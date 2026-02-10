import base64
from openai import OpenAI
from google import genai
from google.genai import types
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
    "trophy": {
        "prompt": """Image 1 is a portrait photo of a real person. Image 2 is a reference showing the trophy, pose, and scene.

SCENE: Night-time celebration on the dirt track of King Abdulaziz Racecourse. Dark sky, bright white stadium floodlights casting dramatic top-down illumination. Blurred stadium lights and crowd creating cinematic bokeh. Shot on 85mm lens, f/2.0, fast shutter speed.

SUBJECT: Place the person from Image 1 into the scene, holding the golden trophy from Image 2 overhead with both hands in a celebratory pose. Vertical 3/4 portrait from waist up. Face must be well-lit by floodlights, clearly visible.

IDENTITY: Preserve the person's exact face, identity, skin tone, facial hair, hair, expression, and all distinguishing features from Image 1. Do not alter, smooth, or stylize the face in any way.

CLOTHING: Keep the person's exact clothing from Image 1 unchanged.

TROPHY: Replicate the exact golden cup from Image 2 with realistic scale, golden reflections from floodlights on its surface.

MODESTY: If the subject is female, ensure Islamic modesty standards — clothing must fully cover arms, legs, and chest with zero cleavage visible. If the original clothing in Image 1 does not meet this, extend or adjust garments (e.g. raise neckline, extend sleeves) to provide full modest coverage while keeping the same style, color, and fabric. A hijab or headscarf is acceptable if already present in Image 1, but do not add one if not already worn.

CHANGE ONLY the background and pose. Keep the face, identity, and clothing exactly as they appear in Image 1. No watermarks, text, logos, sunglasses, hats, or face coverings. No deformed hands.""",
        "reference_images": ["./references/trophy.png"]
    },
    "horse": {
        "prompt": """Image 1 is a portrait photo of a real person. Image 2 is a reference showing the jockey outfit, horse, and racing scene.

SCENE: Night-time horse race at King Abdulaziz Racecourse during the Saudi Cup. Dark sky, powerful white stadium floodlights. Background grandstands with spectators in motion blur. Other racehorses slightly behind. Kicked-up dirt and dust clouds. Shot on 200mm telephoto, f/2.8, 1/2000s shutter freezing the rider while blurring the background.

COMPOSITION: Tight 3/4 action framing from chest up while riding. The face must be the sharpest element — well-lit by floodlights, zero motion blur. Camera angle slightly below eye level for heroic perspective.

IDENTITY: Preserve the person's exact face, identity, skin tone, facial hair, hair, expression, and all distinguishing features from Image 1. Do not alter, smooth, or stylize the face in any way.

WARDROBE: Change only the clothing — replace with professional jockey racing silks matching Image 2 exactly (same colors, patterns, design). Jockey helmet must not obscure the face: visor up, no goggles, full face exposed and well-lit.

HORSE & ACTION: Realistic racing crouch, gloved hands gripping reins, galloping thoroughbred at full speed. Anatomically correct horse with proper galloping stride. Kicked-up dirt and motion particles.

MODESTY: If the subject is female, ensure Islamic modesty standards — racing silks must fully cover arms, legs, and chest with zero cleavage visible and no exposed skin. Adjust the jockey outfit to provide full modest coverage while keeping the same colors and design from Image 2. A hijab or headscarf under the helmet is acceptable if already present in Image 1, but do not add one if not already worn.

CHANGE ONLY the background, clothing, and pose. Keep the face and identity exactly as they appear in Image 1. No face coverings, goggles, or visors over the face. No deformed hands or horse legs. No watermarks or text.""",
        "reference_images": ["./references/horse.png"]
    },
    "card": {
        "prompt": """Image 1 is a photo of a real person. Image 2 is a reference card showing the artistic style, layout, and logo placement.

ARTWORK STYLE: Create a luxury fashion illustration on a physical card, using the mixed-media fashion croquis style from Image 2: watercolor washes, Copic marker shading, and pencil outlines. The illustration should appear hand-drawn on textured off-white/cream paper.

SUBJECT & POSE: Illustrate the person from Image 1, maintaining their pose from the input photo. CRITICAL: The face must remain completely blank/faceless as per the reference style - no eyes, nose, or mouth. Draw only the jawline and head shape. Preserve the subject's body proportions, clothing silhouette, and overall appearance from Image 1.

LOGO & BRANDING: Place the Saudi Cup logo in the top right corner of the card, exactly matching the logo position, size, and design from Image 2. The logo must be crisp and legible.

BACKGROUND: Place the card against a background representing The Saudi Cup - the architecture of King Abdulaziz Racetrack or a luxury equestrian atmosphere. The background should be elegant and blurred to keep focus on the card.

OUTPUT: A vertical image of a hand-drawn fashion sketch of a faceless person on a card, featuring the Saudi Cup logo, set against a Saudi Cup themed background.

MODESTY: If the subject is female, ensure Islamic modesty standards in the illustrated clothing — garments must fully cover arms, legs, and chest with zero cleavage visible. Adjust the fashion sketch to provide full modest coverage while keeping the same style and silhouette. A hijab or headscarf is acceptable if already present in Image 1, but do not add one if not already worn.

DO NOT: Add facial features (eyes, nose, mouth). Change the logo design or placement. Add watermarks or extra text.""",
        "reference_images": ["./references/card.png"]
    },
    "portrait": {
        "prompt": """Image 1 is a portrait photo of a real person. Image 2 is a reference showing the oil painting style and composition.

STYLE: Apply the oil painting style from Image 2 — visible brushstrokes, rich textures, deep colors on canvas. Dramatic chiaroscuro lighting. Canvas texture visible through the paint. The look of a commissioned fine art portrait by a master painter.

SUBJECT: Paint the person from Image 1 as a detailed portrait. Preserve the person's exact face, identity, skin tone, facial hair, hair, expression, pose, and all distinguishing features from Image 1. The portrait must be unmistakably recognizable as the same person.

COMPOSITION: Full-frame oil painting portrait. Maintain the framing and pose from Image 1.

BACKGROUND: Softly blurred background representing The Saudi Cup at King Abdulaziz Racetrack — warm golden and amber architectural tones with subtle equestrian hints.

MODESTY: If the subject is female, ensure Islamic modesty standards — clothing in the portrait must fully cover arms, legs, and chest with zero cleavage visible. If the original clothing in Image 1 does not meet this, extend or adjust garments (e.g. raise neckline, extend sleeves) to provide full modest coverage while keeping the same style and color. A hijab or headscarf is acceptable if already present in Image 1, but do not add one if not already worn.

Change only the visual medium (photo to oil painting) and background. Keep the face, identity, and likeness exactly as they appear in Image 1. No watermarks or text.""",
        "reference_images": ["./references/portrait.png"]
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
                quality="high",
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
    test_path = os.path.join(os.path.dirname(__file__), "test.html")
    return HTMLResponse(
        open(test_path, encoding="utf-8").read()
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
