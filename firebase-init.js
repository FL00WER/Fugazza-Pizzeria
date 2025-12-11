// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDXje5D3ah76jZUd5PqJs5Puo5t1mGTdqc",
  authDomain: "fugazza-pizzeria.firebaseapp.com",
  projectId: "fugazza-pizzeria",
  storageBucket: "fugazza-pizzeria.appspot.com",
  messagingSenderId: "286843422656",
  appId: "1:286843422656:web:37a30f25c2d40b2bda2a25",
  measurementId: "G-W2K1RGJQNH"
};

export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
