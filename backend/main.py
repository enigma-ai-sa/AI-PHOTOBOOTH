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
        "prompt": """
        Generate a photorealistic, high-resolution vertical portrait of the person from the provided input image. 
        CRITICAL INSTRUCTION - POSE CHANGE Modify the subject's pose: You must ignore whatever pose the person is doing and substitute it with the following new action. New Action: The subject must be holding the large golden trophy cup up with both hands, exactly as shown in the Generation Reference Images. The hands should grasp the base or stem of the trophy, lifting it in a celebratory manner. 
        Subject Consistency (From Input Image): Identity: Strictly preserve the exact facial features, do not alter any facial features, resulting image facial features must match exactly with the input image. 
        Clothing: Do not alter the clothing of the person in the input image, it must remain unchanged. 
        Trophy & Reference Adherence: Trophy Design: The trophy must be the exact golden cup visible in the Generation Reference Images. It is a large, ornate gold cup with a lid and two prominent looped handles. Ensure the scale creates a sense of weight and prestige. 
        Style & Lighting: Mimic the lighting and atmosphere of the Generation Reference Images. The scene is set at night under bright stadium ﬂoodlights. 
        Setting & Location: The dirt track of a professional racecourse (King Abdulaziz Racecourse style). Background: Blurred stadium lights, dark night sky, and distant green railing/crowd elements, creating a cinematic depth of ﬁeld. 
        Summary: Subject Face/Clothes = From Input Image. Pose/Trophy/Lighting = From Generation Reference Images.
        """,
        "reference_images": ["./references/trophy.png"]
    },
    "horse": {
        "prompt": """
        Photorealistic premium sports photograph.

        PRIMARY GOAL (must prioritize): The rider is the SAME PERSON as the input portrait. Preserve the subject’s exact facial identity: facial proportions, eye shape/spacing, eyebrows, nose, lips, beard/mustache shape, skin tone. Do not stylize the face. Keep natural skin texture.
        Insure that the face is extactly the same as the input image, no alterations, no changes, it must remain the same exact face as the input.
        SCENE: The subject is racing as a professional jockey in the Saudi Cup at King Abdulaziz Racecourse at night under powerful stadium floodlights. Dynamic action, dirt flying from hooves, other horses slightly behind, background grandstands with motion blur to show speed.
        COMPOSITION (identity lock): Tight 3/4 close-up action framing from the chest up while riding (telephoto sports shot). The subject’s face must be clearly visible, sharp, and well-lit. No motion blur on the face. Helmet allowed but MUST NOT cover key facial features. Keep visor up. NO goggles. No face coverings. Do not obscure the face with shadows; ensure floodlights illuminate the face.
        WARDROBE (full replacement): Completely replace the original clothing with professional jockey racing silks matching Saudi Cup style. Outfit must match the outfit in the reference image exactly.
        ACTION / HORSE: Subject is in a realistic racing crouch, hands on reins, riding a galloping thoroughbred racehorse. Horse anatomy must be realistic and proportionate. Add kicked-up dirt and subtle particles.
        LIGHTING / CAMERA: Nighttime cinematic high-contrast stadium lighting, realistic reflections on helmet and satin silks. Shallow depth of field. Sports photography look (telephoto, fast shutter). Sharp subject, blurred background only.
        QUALITY RULES (avoid common failures): No face morphing, no “generic” face, no extra fingers, no warped hands, no deformed horse legs, no melted logos, no unreadable text, no duplicated limbs, no plastic skin, no painterly or CGI look.
        """,
        "reference_images": ["./references/horse.png"]
    },
    "card": {
        "prompt": """
        Transform the subject from the input image into a luxury fashion illustration on a physical card, following the artistic style of the reference image but incorporating speciﬁc branding changes. 
        1. Subject & Pose (From Input Image):  Illustrate the person in the input image. Maintain whatever pose is in the input image. 
        Artistic Abstraction: As per the reference style, the face must remain completely blank/faceless (no eyes, nose, or mouth), drawing only the jawline and head shape. 
        2. Artistic Style (From Reference Image): Mimic the mixed-media fashion croquis style: watercolor washes, Copic marker shading, and pencil outlines. The illustration should appear drawn on textured oﬀ-white/cream paper.   
        3. CRITICAL FEEDBACK MODIFICATIONS (Must Implement): The Logo: Insure the logo is in the top right corner of the card in the output image, exactly the same as the reference image.
        The Background: Place the card against a background representing The Saudi Cup (e.g., the architecture of the King Abdulaziz Racetrack, or a luxury equestrian atmosphere associated with the event). The background should be elegant   and blurred to keep focus on the card. 
        Summary of Output: A vertical image of a hand-drawn fashion sketch of a faceless person on a card, featuring the Saudi Cup logo, set against a Saudi Cup themed background.

        """,
        "reference_images": ["./references/card.png"]
    },
    "portrait": {
        "prompt": """
        Create a high-quality, hand-drawn oil painting portrait of the person from the input image. 
        1. Subject & Likeness (From Input Image): Portray the person in the input image, do not alter any features. Maintain the poses from the input photo. 
        CRITICAL CHANGE: Render a complete, detailed portrait of the persons face and expression as if a live artist were painting him in a studio. 
        2. Art Style (Oil Painting): Adopt a classic oil painting style: Use visible brushstrokes, rich textures, and deep colors to mimic the look of a ﬁne art piece created on canvas. The lighting should be dramatic and elegant. 
        3. Background & Composition: The image should be a full-frame painting.
        Setting: Place the subject against a sophisticated, blurred background representing the atmosphere of The Saudi Cup (King Abdulaziz Racetrack). Use warm, architectural tones or equestrian hints in the background to establish the context without distracting from the portrait. 

        """,
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

