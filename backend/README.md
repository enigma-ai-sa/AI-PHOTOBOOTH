1. INSTALL PYTHON
2. CREATE A VIRTUAL ENVIRONMENT:
    - python -m venv .venv
3. ACTIVATE VIRUAL ENVIRONMENT:
    - WINDOWS: .venv\Scripts\activate
    - MAC: source .venv\bin\activate
4. INSTALL requirements.txt
    - pip install -r requirements.txt
5. SET UP THE ENVIROMENTS (.env file):
    - GEMINI_API_KEY=xxx
6. RUN BACKEND
    - python main.py

THE ENDPOINTS ARE ALL LOCALHOST ON PORT 5000, (127.0.0.1:5000)
    - (e.g) you want to print image, 127.0.0.1:5000/print -> and send an image file
    - (e.g) you want to generate image, 127.0.0.1:5000/image-generator-x and send an image file, prompts are handled within the endpoint itself.


