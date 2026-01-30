# AI Photobooth - Enigma

## Environment Setup

1. **Backend** - Create `backend/.env`:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

2. **Frontend** - Create `engima-photobooth/.env.local`:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:5000
   ```

## Installation & Running

1. **Install Frontend Dependencies**

   ```bash
   cd engima-photobooth
   npm install
   ```

2. **Install Backend Dependencies**

   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

3. **Start Flask Backend** (Terminal 1)

   ```bash
   cd backend
   python main.py
   # Backend runs on http://127.0.0.1:5000
   ```

4. **Start Next.js Frontend** (Terminal 2)

   ```bash
   cd engima-photobooth
   npm run dev
   # Frontend runs on http://localhost:3000
   ```

5. **Access the App**
   - Open browser to `http://localhost:3000`
