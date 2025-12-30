from google import genai
from google.genai import types
from PIL import Image, ImageWin
import time
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
import win32print
import win32ui
import boto3
import qrcode

load_dotenv()

# s3 bucket
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("S3_REGION")
)

key = "/images/new_years"

# GLOBAL VARIABLES
client = genai.Client(
    api_key=os.getenv('GEMINI_API_KEY'),
)
aspect_ratio = "9:16" # "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
resolution = "1K" # "1K", "2K", "4K"
qrCode = True

app = Flask(__name__)
CORS(app, resources={r"/*": 
    {"origins": "*",
    "methods": ["GET", "POST"],
    "allow_headers": ["Content-Type"]}})

options = {
    "ghibli": {
        "prompt": """
        Create a full-body shot of the person(s) in the provided photo in a semi-realisticStudio Ghibli style.
        Set the background to AlUla mountains which is provided as a reference image, it should be night time, with stars visible.
        """,
        "reference_images": [Image.open("./references/alula_mountains.png")]
    },
    "studio": {
        "prompt": """
        Take the person(s) from the provided image and generate a Studio Portrait a blurred background of sparkles.
        Ensure the person(s)' face and features remain completely unchanged. Keep the face untouched, only blur the background.
        """
    },
    "2026": {
        "prompt": """
        Take the person(s) from the provided image and generate a hyper-realistic image of them with
        the background displays a spectacular New Year's Eve atmosphere with a drone light show in the night sky explicitly spelling "2026", accompanied by elegant gold and silver fireworks. The scene is illuminated by the festival lights and starlight.
        Ensure the person(s)' face and features remain completely unchanged. Keep the face untouched.
        """,
        "reference_images": [Image.open("./references/alula_mountains.png")]
    },
    "HNY": {
        "prompt": """
        Take the person(s) from the provided image and generate a hyper-realistic image of them with
        the background displays a spectacular New Year's Eve atmosphere with a drone light show in the night sky explicitly spelling "Happy New Year from AlUla", accompanied by elegant gold and silver fireworks. The scene is illuminated by the festival lights and starlight.
        Ensure the person(s)' face and features remain completely unchanged. Keep the face untouched.
        """,
        "reference_images": [Image.open("./references/alula_mountains.png")]
    }
}

# THE ENDPOINTS FOR IMAGE GENERATION - should receive an option parameter
@app.route('/image-generator', methods=['POST'])
def generate_image_pottery_route():
    data = request.json
    option = data.get('option')
    image_base64 = data.get('image')
    # Convert base64 to PIL Image
    input_image = base64_to_image(image_base64)
    output_image = generate_image_function(option, input_image)
    # Convert PIL Image back to base64
    output_base64 = image_to_base64(output_image)
    if qrCode:
        bucket_name = os.getenv('S3_BUCKET_NAME')
        region = os.getenv('S3_REGION')
        # Convert base64 back to bytes for S3
        image_bytes = base64.b64decode(output_base64)
        # Create a unique filename with timestamp
        filename = f"images/new_years/{int(time.time())}.png"
        s3.put_object(
            Bucket=os.getenv('S3_BUCKET_NAME'),
            Key=filename,
            Body= image_bytes,
            ContentType="image/png",
            ContentDisposition="inline"
        )

        # Construct the S3 URL
        s3_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{filename}"
        print(f"Image uploaded to S3: {s3_url}")

        # Generate QR code with the S3 URL
        qr_code_base64 = generate_qr_code(s3_url)
        return jsonify({'image': output_base64, "qrCode" : qr_code_base64})

    return jsonify({'image': output_base64})

# ------------------------------------------------------------

# generate image FUNCTION
def generate_image_function(option: str, image: Image.Image) -> Image.Image:
    start_time = time.time()
    # check if option is valid
    if option not in options:
        return jsonify({'error': 'Invalid option'}), 400

    # check if option has reference images - if yes add them to contents
    contents = [
        options[option]['prompt'],
        image,
    ]

    if 'reference_images' in options[option]:
        for img in options[option]['reference_images']:
            contents.append(img)
    
    response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=contents,
    config=types.GenerateContentConfig(
        response_modalities=['IMAGE', 'TEXT'],
        image_config=types.ImageConfig(
            aspect_ratio=aspect_ratio,
            image_size=resolution
            ),
        )
    )

    result_image = None
    for part in response.parts:
        if part.text is not None:
            print(part.text)
        elif part.inline_data is not None:
            # Get raw image bytes from the response
            image_bytes = part.inline_data.data
            result_image = Image.open(BytesIO(image_bytes))
    end_time = time.time()
    print(f"Time taken: {end_time - start_time} seconds")
    return result_image

# ------------------------ BASE64 TO IMAGE AND IMAGE TO BASE64 --------------------------------

def base64_to_image(base64_string: str) -> Image.Image:
    """Convert base64 string to PIL Image"""
    # Remove data URL prefix if present (e.g., "data:image/png;base64,")
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    image_data = base64.b64decode(base64_string)
    return Image.open(BytesIO(image_data))

def image_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string"""
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')


# ------------------------ QR CODE GENERATION --------------------------------
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
    buffered = BytesIO()
    qr_image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

# ------------------------ PRINTING --------------------------------

# CONFIGURATION FPR PRINTING
UPLOAD_FOLDER = os.getcwd()
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- 1. ENDPOINT FOR PRINTING
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/print', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
   
    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        # We enforce the specific filename you requested
        filename = 'image_print_job.png'
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
       
        try:
            # 1. Save the file
            file.save(save_path)
           
            # 2. Trigger the silent print
            print_success = print_image_silently(save_path)
           
            msg = 'Image saved and sent to printer' if print_success else 'Image saved but printing failed'

            # time.sleep(5)
            cleanup()
           
            return jsonify({
                'message': msg,
                'path': save_path
            }), 200
           
        except Exception as e:
            return jsonify({'error': f'Failed operation: {str(e)}'}), 500

    return jsonify({'error': 'File type not allowed'}), 400

# --- 2. THE SILENT PRINT FUNCTION ---
def print_image_silently(image_path):
    """
    Prints an image to the default Windows printer without dialogs.
    Scales the image to fit the paper.
    """
    try:
        # Open the image using Pillow
        img = Image.open(image_path)

        # Get the default printer name
        printer_name = win32print.GetDefaultPrinter()
       
        # Create a Device Context (DC) for the printer
        hDC = win32ui.CreateDC()
        hDC.CreatePrinterDC(printer_name)
       
        # Calculate scaling to fit image to page
        printer_size = hDC.GetDeviceCaps(110), hDC.GetDeviceCaps(111) # (HORZRES, VERTRES)
       
        # rotate image if printer is portrait and image is landscape (optional)
        if img.width > img.height and printer_size[0] < printer_size[1]:
             img = img.rotate(90, expand=True)

        # Calculate correct aspect ratio to fit page
        w, h = img.size
        print_w, print_h = printer_size
       
        scale = min(print_w / w, print_h / h)
        new_w = int(w * scale)
        new_h = int(h * scale)
       
        # Center the image on the page
        x = (print_w - new_w) // 2
        y = (print_h - new_h) // 2

        # Start the print job
        hDC.StartDoc("Flask Auto Print Job")
        hDC.StartPage()

        # Draw the image (DIB = Device Independent Bitmap)
        dib = ImageWin.Dib(img)
        dib.draw(hDC.GetHandleOutput(), (x, y, x + new_w, y + new_h))

        # Finish
        hDC.EndPage()
        hDC.EndDoc()
        hDC.DeleteDC()
        print(f"Sent {image_path} to printer: {printer_name}")
        return True

    except Exception as e:
        print(f"Printing failed: {e}")
        return False

# --- 3. CLEANUP ---
def cleanup():
    os.remove('image_print_job.png')

# ------------------------ RUN THE APP --------------------------------
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)


