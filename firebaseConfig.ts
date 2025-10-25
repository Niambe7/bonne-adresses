// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyBIo-FU6rhg093geFN3pGp5lS-T5t7eCSg",
  authDomain: "mes-bonnes-adresses-40217.firebaseapp.com",
  projectId: "mes-bonnes-adresses-40217",
  storageBucket: "mes-bonnes-adresses-40217.firebasestorage.app",
  messagingSenderId: "11742480671",
  appId: "1:11742480671:web:c5fa38f8845e122fb3882a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
