// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// ===== Configuración de tu proyecto Firebase =====
const firebaseConfig = {
  apiKey: "AIzaSyC_ZA6oT3T3nGcOqFzhO5wzCmoZ2kPyTVQ",
  authDomain: "preguntas-b1535.firebaseapp.com",
  projectId: "preguntas-b1535",
  storageBucket: "preguntas-b1535.firebasestorage.app",
  messagingSenderId: "440538985413",
  appId: "1:440538985413:web:afa9cc3a4194fc868a11ac",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ===== Manejo de sesión (sessionStorage) =====
export const setRole = (role) => sessionStorage.setItem("qa_role", role);
export const getRole = () => sessionStorage.getItem("qa_role");
export const clearRole = () => sessionStorage.removeItem("qa_role");

// ===== Login con código desde Firestore =====
export async function loginWithCodigo(codigo) {
  try {
    const q = query(collection(db, "usuarios"), where("codigo", "==", codigo.trim()));
    const snap = await getDocs(q);

    if (snap.empty) return null;

    const d0 = snap.docs[0];
    const data = d0.data();

    if (data.activo === false) return null;

    // Retornamos la info del usuario
    return { id: d0.id, ...data };
  } catch (err) {
    console.error("Error en loginWithCodigo:", err);
    throw err;
  }
}
