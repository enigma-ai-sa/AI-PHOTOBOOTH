from google import genai
from google.genai import types
from PIL import Image
import time
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
import win32print
import win32ui

load_dotenv()

# GLOBAL VARIABLES
client = genai.Client(
    api_key=os.getenv('GEMINI_API_KEY'),
)
aspect_ratio = "9:16" # "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
resolution = "1K" # "1K", "2K", "4K"

app = Flask(__name__)
CORS(app)

# THE ENDPOINTS FOR IMAGE GENERATION
@app.route('/image-generator-1', methods=['POST'])
def generate_image_route():
    data = request.json
    image_base64 = data.get('image')
    # Convert base64 to PIL Image
    input_image = base64_to_image(image_base64)

    prompt = (
        "make me do pottery in a saudi old scene, matching the theme عام الحرف اليدوية",
    )
    output_image = generate_image_function(prompt, input_image)
    # Convert PIL Image back to base64
    output_base64 = image_to_base64(output_image)
    return jsonify({'image': output_base64})


# generate image FUNCTION
def generate_image_function(prompt: str, image: Image.Image) -> Image.Image:
    start_time = time.time()
    response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[
        prompt,
        image,
    ],
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
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

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)


