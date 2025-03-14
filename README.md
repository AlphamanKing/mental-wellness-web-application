# Mental Wellness AI Support System

A comprehensive mental health support system with an AI therapist, built using Vue.js, Flask, Firebase, and Groq API.

## Features

- User Authentication (Email/Password and Google Sign-in)
- Interactive AI Therapist Chat
- Sentiment Analysis using BERT
- Dashboard with Mental Health Resources
- Mood Tracking
- Journaling
- Goal Setting
- Secure Conversation History

## Tech Stack

### Frontend
- Vue.js 3 (with Composition API)
- Vite (Build Tool)
- Tailwind CSS (Styling)
- Firebase SDK (Authentication & Firestore)
- Chart.js (for Mood Tracking Visualization)

### Backend
- Flask (Python)
- Firebase Admin SDK
- BERT Model for Sentiment Analysis
- Groq API for LLM Integration

## Project Structure

```
mental-wellness/
├── frontend/               # Vue.js frontend
│   ├── public/             # Static assets
│   └── src/                # Source code
│       ├── assets/         # Images, fonts, etc.
│       ├── components/     # Reusable Vue components
│       ├── views/          # Page components
│       └── store/          # Vuex store modules
├── backend/                # Flask backend
│   ├── api/                # API endpoints
│   ├── models/             # Model integration
│   └── utils/              # Utility functions
└── docs/                   # Documentation
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- Python (v3.8 or later)
- Firebase Account
- Groq API Key
- Hosted BERT Model

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_API_BASE_URL=http://localhost:5000
   ```
4. Start the development server:
   ```
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Create a virtual environment:
   ```
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
5. Create a `.env` file with your configuration:
   ```
   FLASK_APP=app.py
   FLASK_ENV=development
   GROQ_API_KEY=your_groq_api_key
   BERT_MODEL_URL=your_bert_model_url
   GOOGLE_APPLICATION_CREDENTIALS=path/to/your/firebase-credentials.json
   ```
6. Start the Flask server:
   ```
   flask run
   ```

## Deployment

### Frontend Deployment (Firebase Hosting)
1. Build the production version:
   ```
   npm run build
   ```
2. Deploy to Firebase Hosting:
   ```
   firebase deploy --only hosting
   ```

### Backend Deployment (Google Cloud Run)
1. Build the Docker image:
   ```
   docker build -t mental-wellness-backend .
   ```
2. Deploy to Google Cloud Run:
   ```
   gcloud run deploy mental-wellness-backend --image mental-wellness-backend --platform managed
   ```

## License
MIT
