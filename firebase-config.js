// Configuração do Firebase
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCJXxaG8R5-VmkoGA7PyFcyfcvBAk92yTc",
    authDomain: "portal-fila-payhub.firebaseapp.com",
    projectId: "portal-fila-payhub",
    storageBucket: "portal-fila-payhub.firebasestorage.app",
    messagingSenderId: "28871537008",
    appId: "1:28871537008:web:38d6ac22721f40a7d61fb5"
};

// Inicializar Firebase
const app = firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

// Habilitar persistência offline
db.enablePersistence()
    .catch((err) => {
        console.error("Erro na persistência:", err);
    });