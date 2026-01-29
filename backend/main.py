import base64
from openai import OpenAI
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import Response, HTMLResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import time
import os
import io
import uvicorn
from PIL import Image
import sys
import uuid
import json
import boto3
import qrcode

# Conditional Windows imports
if sys.platform == "win32":
    import win32print
    import win32ui
    from PIL import ImageWin

# GLOBAL VARIABLES
QRCODE = True

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CONFIGURATIONS

# s3 bucket
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("S3_REGION")
)

key = "images/test"

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)


options = {
    "bluebrains": {
        "prompt": """
        Take the person(s) from the provided image and generate a sophisticated, modern portrait for a medical conference setting. The subject should remain exactly as captured in the original image, including their clothing, suit, and overall appearance. Do not modify, replace, or stylize the clothing in any way. Integrate the subject into a high-tech, futuristic environment inspired by neuro-oncology. The background should feature clean, glowing holographic visualizations of brain structures and abstract neural network data, representing advanced neuroscience and innovation. The scientific graphics should appear as a refined background or flowing elements around the subject, and must not overlap, distort, or cover the face. Add the event title "MECNO 2026" in a bold, modern sans-serif font, styled as a premium medical conference header. Use a professional "modern medical" color palette with deep navy blues, electric cyan highlights, and clean white accents. The overall mood should feel innovative, authoritative, and visionary. Ensure the person(s)' face and facial features remain completely unchanged. Keep the face untouched. Also render the image vertical and not horizontal.
        """
    },
    "mecno2026": {
        "prompt": """
        Take the person(s) from the provided image and generate a clean, high-quality professional portrait suitable for a medical conference. The subject should remain exactly as captured in the original image, including their clothing, suit, and overall appearance. Do not change, replace, or stylize the clothing in any way. Enhance lighting, posture, and image clarity naturally using AI, without altering facial features or expressions. Set a minimal, elegant background using neutral or soft medical tones that keep full focus on the subject. Add the event title "MECNO 2026" at the top of the image in a modern, professional sans-serif font, styled like a high-end medical conference header. Ensure the person(s)' face and facial features remain completely unchanged. Keep the face untouched.
        """
    },
    "riyadhcity": {
        "prompt": """
        Take the person(s) from the provided image and generate a semi-realistic, hand-painted Studio Ghibli–style illustration inspired by classic Japanese animation. The person should appear as a confident professional wearing a formal suit, with a calm and natural smile. The style should be elegant, warm, and cinematic, not cartoonish. Set the background as the distinctive skyline of the King Abdullah Financial District (KAFD / Abraj Al-Maliyah) in Riyadh, Saudi Arabia, featuring the iconic geometric skyscrapers and the PIF Tower clearly visible in the distance. Above the skyline, include soft glowing neural networks forming a transparent brain shape in the sky, with floating light particles and gentle clouds. Use a color palette of blue, white, and soft gold. The mood should feel intelligent, hopeful, and visionary, suitable for a medical innovation conference. Ensure the person(s)' face and facial features remain completely unchanged. Keep the face untouched.
        """
    },
    "sketch": {
        "prompt": """
        Take the person(s) from the provided image and generate a clean, semi-realistic hand-drawn sketch or illustration style portrait, as if the subject was carefully sketched or drawn by an artist. The illustration should preserve accurate proportions and likeness, using soft pencil, ink, or light charcoal-style lines with minimal shading. The overall style should feel artistic, refined, and professional, not exaggerated or cartoon-like. Set a simple, neutral background with light texture or off-white tones to emphasize the sketch effect and keep the focus on the subject. Ensure the person(s)' face and facial features remain completely unchanged. Keep the face untouched. Render it vertical and not horizontal.
        """
    }
}

def load_reference_images():
    """Pre-load reference images into memory at startup"""
    for opt_name, opt_data in options.items():
        if "reference_images" in opt_data:
            opt_data["_cached_refs"] = []
            for ref_path in opt_data["reference_images"]:
                if os.path.exists(ref_path):
                    with open(ref_path, "rb") as f:
                        opt_data["_cached_refs"].append({
                            "data": f.read(),
                            "name": os.path.basename(ref_path)
                        })

load_reference_images()

@app.post("/generate-stream")
async def generate_stream(
    image: UploadFile = File(...),
    option: str = Form(...),
):
    if option not in options:
        raise HTTPException(status_code=400, detail="Invalid option")

    # Read the uploaded image
    image_data = await image.read()
    image_file = io.BytesIO(image_data)
    image_file.name = image.filename or "upload.png"
    image_list = [image_file]

    # Add cached reference images
    if "_cached_refs" in options[option]:
        for ref in options[option]["_cached_refs"]:
            ref_file = io.BytesIO(ref["data"])
            ref_file.name = ref["name"]
            image_list.append(ref_file)

    prompt = options[option]["prompt"]

    def event_stream():
        final_image = None
        try:
            stream = client.images.edit(
                model="gpt-image-1.5",
                image=image_list,
                prompt=prompt,
                input_fidelity="high",
                size="1024x1536",
                output_format="jpeg",
                partial_images=3,
                stream=True
            )
            
            for event in stream:
                print(f"Event: {event}")
                print(f"Event attrs: {dir(event)}")
                
                if hasattr(event, 'type'):
                    # Partial image event
                    if event.type == 'image_edit.partial_image':
                        b64 = getattr(event, 'b64_json', None) or getattr(event, 'partial_image_b64', None)
                        if b64:
                            yield f"data: {json.dumps({'type': 'partial', 'image': b64})}\n\n"
                    
                    # Completed event - final image
                    elif event.type == 'image_edit.completed':
                        if hasattr(event, 'b64_json') and event.b64_json:
                            final_image = event.b64_json
                        elif hasattr(event, 'result') and event.result:
                            final_image = getattr(event.result, 'b64_json', None)
                        elif hasattr(event, 'data') and event.data:
                            final_image = event.data[0].b64_json if event.data else None
                        
                        if final_image:
                            yield f"data: {json.dumps({'type': 'final', 'image': final_image})}\n\n"
                            
                            # Upload to S3 and generate QR code if enabled
                            if QRCODE:
                                try:
                                    bucket_name = os.getenv('S3_BUCKET_NAME')
                                    region = os.getenv('S3_REGION')
                                    
                                    # Convert base64 back to bytes for S3
                                    image_bytes = base64.b64decode(final_image)
                                    
                                    # Create a unique filename with timestamp
                                    filename = f"{key}/{int(time.time())}.png"
                                    
                                    s3.put_object(
                                        Bucket=bucket_name,
                                        Key=filename,
                                        Body=image_bytes,
                                        ContentType="image/png",
                                        ContentDisposition="inline"
                                    )
                                    
                                    # Construct the S3 URL
                                    s3_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{filename}"
                                    print(f"Image uploaded to S3: {s3_url}")
                                    
                                    # Generate QR code
                                    qr_code_base64 = generate_qr_code(s3_url)
                                    
                                    # Send QR code to frontend
                                    yield f"data: {json.dumps({'type': 'qrcode', 'image': qr_code_base64, 'url': s3_url})}\n\n"
                                    
                                except Exception as s3_err:
                                    print(f"S3/QR error: {s3_err}")
                                    yield f"data: {json.dumps({'type': 'qr_error', 'message': str(s3_err)})}\n\n"
            
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            print(f"Stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

# ------------------------IMAGE GENERATOR (JSON API)------------------------------
@app.post("/image-generator")
async def generate_image_json(request_data: dict):
    """
    Non-streaming endpoint for image generation.
    Accepts JSON: { "image": "base64_string", "option": "ghibli|studio|2026|HNY" }
    Returns JSON: { "image": "base64_string", "qrCode": "base64_string" }
    """
    image_base64 = request_data.get("image")
    option = request_data.get("option")
    
    if not image_base64:
        raise HTTPException(status_code=400, detail="No image provided")
    
    if not option:
        raise HTTPException(status_code=400, detail="No option provided")
    
    if option not in options:
        raise HTTPException(status_code=400, detail=f"Invalid option: {option}. Valid options: {list(options.keys())}")
    
    try:
        # Decode base64 image (handle data URL format)
        if image_base64.startswith('data:'):
            # Remove data URL prefix (e.g., "data:image/png;base64,")
            image_base64 = image_base64.split(',', 1)[1]
        
        image_bytes = base64.b64decode(image_base64)
        image_file = io.BytesIO(image_bytes)
        image_file.name = "upload.png"
        image_list = [image_file]
        
        # Add cached reference images if available
        if "_cached_refs" in options[option]:
            for ref in options[option]["_cached_refs"]:
                ref_file = io.BytesIO(ref["data"])
                ref_file.name = ref["name"]
                image_list.append(ref_file)
        
        prompt = options[option]["prompt"]
        
        # Call OpenAI (non-streaming)
        print(f"🎨 Generating image with option: {option}")
        response = client.images.edit(
            model="gpt-image-1",
            image=image_list,
            prompt=prompt,
            size="1024x1536",
            quality="high",
        )
        
        # Get the generated image
        generated_image_b64 = response.data[0].b64_json
        
        if not generated_image_b64:
            raise HTTPException(status_code=500, detail="No image returned from OpenAI")
        
        print("✅ Image generated successfully")
        
        # Upload to S3 and return URL (much faster than sending base64)
        qr_code_b64 = None
        s3_url = None
        
        try:
            bucket_name = os.getenv('S3_BUCKET_NAME')
            region = os.getenv('S3_REGION')
            
            if bucket_name and region:
                # Upload to S3
                image_bytes_out = base64.b64decode(generated_image_b64)
                filename = f"{key}/{int(time.time())}_{uuid.uuid4().hex[:8]}.png"
                
                s3.put_object(
                    Bucket=bucket_name,
                    Key=filename,
                    Body=image_bytes_out,
                    ContentType="image/png",
                    ContentDisposition="inline"
                )
                
                s3_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{filename}"
                print(f"☁️ Image uploaded to S3: {s3_url}")
                
                # Generate QR code
                qr_code_b64 = generate_qr_code(s3_url)
                print("📱 QR code generated")
            else:
                print("⚠️ S3 not configured, falling back to base64")
        except Exception as s3_err:
            print(f"⚠️ S3/QR error (non-fatal): {s3_err}")
        
        # Return S3 URL if available, otherwise fall back to base64
        return {
            "image": s3_url if s3_url else f"data:image/png;base64,{generated_image_b64}",
            "imageUrl": s3_url,  # Direct URL for faster loading
            "qrCode": qr_code_b64
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------QRCODE------------------------------
def generate_qr_code(url: str) -> str:
    """Generate a QR code image from URL and return as base64 string"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    qr_image = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffered = io.BytesIO()
    qr_image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

# ------------------------STATIC--------------------------------

# return all the options from the options dictionary
@app.get("/options")
async def get_options():
    return {"options": list[str](options.keys())}

# the test.html page
@app.get("/test")
async def test_page():
    return HTMLResponse(
        open("test.html", encoding="utf-8").read()
    )

# ------------------------PRINTING--------------------------------

if sys.platform == "win32":
    UPLOAD_FOLDER = os.getcwd()
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

    def allowed_file(filename: str) -> bool:
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    @app.post("/print")
    async def upload_image(file: UploadFile = File(...)):
        if not file.filename:
            raise HTTPException(status_code=400, detail="No selected file")
        
        if not allowed_file(file.filename):
            raise HTTPException(status_code=400, detail="File type not allowed")
        
        filename = f"print_job_{uuid.uuid4().hex}.png"
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        
        try:
            # 1. Save the file
            contents = await file.read()
            with open(save_path, "wb") as f:
                f.write(contents)
            
            # 2. Trigger the silent print
            print_success = print_image_silently(save_path)
            
            msg = "Image saved and sent to printer" if print_success else "Image saved but printing failed"
            
            # Cleanup this specific file
            try:
                os.remove(save_path)
            except FileNotFoundError:
                pass
            
            return {"message": msg, "path": save_path}
        
        except Exception as e:
            # Cleanup on error too
            try:
                os.remove(save_path)
            except:
                pass
            raise HTTPException(status_code=500, detail=f"Failed operation: {str(e)}")


    def print_image_silently(image_path: str) -> bool:
        """
        Prints an image to the default Windows printer without dialogs.
        Scales the image to fit the paper.
        """
        try:
            img = Image.open(image_path)
            printer_name = win32print.GetDefaultPrinter()
            
            hDC = win32ui.CreateDC()
            hDC.CreatePrinterDC(printer_name)
            
            printer_size = hDC.GetDeviceCaps(110), hDC.GetDeviceCaps(111)
            
            if img.width > img.height and printer_size[0] < printer_size[1]:
                img = img.rotate(90, expand=True)
            
            w, h = img.size
            print_w, print_h = printer_size
            
            scale = min(print_w / w, print_h / h)
            new_w = int(w * scale)
            new_h = int(h * scale)
            
            x = (print_w - new_w) // 2
            y = (print_h - new_h) // 2
            
            hDC.StartDoc("FastAPI Auto Print Job")
            hDC.StartPage()
            
            dib = ImageWin.Dib(img)
            dib.draw(hDC.GetHandleOutput(), (x, y, x + new_w, y + new_h))
            
            hDC.EndPage()
            hDC.EndDoc()
            hDC.DeleteDC()
            print(f"Sent {image_path} to printer: {printer_name}")
            return True
        
        except Exception as e:
            print(f"Printing failed: {e}")
            return False


    def cleanup():
        try:
            os.remove("image_print_job.png")
        except FileNotFoundError:
            pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

