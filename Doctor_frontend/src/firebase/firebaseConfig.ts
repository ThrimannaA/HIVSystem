// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use the values from your Firebase JSON
const firebaseConfig = {
  apiKey: 'AIzaSyAJIjz62jB05i1Qf8Ct26VYe8e0kwS17ww',
  authDomain: 'hivsystem.firebaseapp.com',
  projectId: 'hivsystem',
  storageBucket: 'hivsystem.firebasestorage.app',
  messagingSenderId: '1040289047448',      // From project_number
  appId: '1:1040289047448:web:00cd2589a748bd451441ed', // From mobilesdk_app_id
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exports for Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
