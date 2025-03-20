import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Check if Firebase config is properly loaded
const missingVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error(`Missing Firebase configuration variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env file and make sure all Firebase variables are defined.');
}

// Storage bucket specific validation
if (firebaseConfig.storageBucket && !firebaseConfig.storageBucket.includes('firebasestorage.app')) {
  console.warn('Storage bucket may be misconfigured. Expected format: project-id.appspot.com');
  console.warn('Current value:', firebaseConfig.storageBucket);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication
const auth = getAuth(app)

// Initialize Firestore
const db = getFirestore(app)

// Initialize Storage with proper error handling
const storage = getStorage(app);

// Create Google Auth Provider
const googleProvider = new GoogleAuthProvider()

export { app, auth, db, storage, googleProvider }
