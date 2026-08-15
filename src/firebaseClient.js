import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_API_KEY) || "AIzaSyCfaO63UV0UhuBP0dKqXWMN5pYCMdLplmg",
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_AUTH_DOMAIN) || "ayuda-emilio-83261.firebaseapp.com",
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_PROJECT_ID) || "ayuda-emilio-83261",
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_STORAGE_BUCKET) || "ayuda-emilio-83261.firebasestorage.app",
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || "375420549895",
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_APP_ID) || "1:375420549895:web:bb9cb403bee3b3103d63a2"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
