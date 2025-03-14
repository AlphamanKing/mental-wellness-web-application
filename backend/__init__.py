# This file is intentionally left empty to make the directory a Python package
# backend/__init__.py
import os
from flask import Flask
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Initialize Firebase
from firebase_admin import credentials, firestore, initialize_app

# Get the path to the Firebase credentials file from environment variables
cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
if cred_path and os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    initialize_app(cred)
    db = firestore.client()
else:
    print("Warning: Firebase credentials file not found. Some features may not work properly.")

# Import routes after app initialization to avoid circular imports
# from backend import routes