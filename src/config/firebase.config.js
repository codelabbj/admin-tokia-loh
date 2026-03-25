// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // ← Importer getAuth

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcdyDRMA93zfHcnhAdrdMuOo2Lps9EfP0",
  authDomain: "tokia-loh-167c1.firebaseapp.com",
  projectId: "tokia-loh-167c1",
  storageBucket: "tokia-loh-167c1.firebasestorage.app",
  messagingSenderId: "205830016827",
  appId: "1:205830016827:web:a10a4417242697a480b11e",
  measurementId: "G-1Z4TNSL3B5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
