import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Inicializar Auth solo en el cliente para prevenir crashes por validación de API KEY
// durante el Server-Side Rendering de Next.js.
let auth: Auth;
let db: any;

if (typeof window !== "undefined") {
    auth = getAuth(app);
    db = getFirestore(app);
} else {
    // Si estamos construyendo (SSR), pasamos un objeto simulado.
    auth = {} as Auth;
    db = {};
}

export { app, auth, db };
