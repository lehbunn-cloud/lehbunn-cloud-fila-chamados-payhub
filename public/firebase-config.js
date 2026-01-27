// Configurações do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCJXxaG8R5-VmkoGA7PyFcyfcvBAk92yTc",
  authDomain: "portal-fila-payhub.firebaseapp.com",
  projectId: "portal-fila-payhub",
  storageBucket: "portal-fila-payhub.firebasestorage.app",
  messagingSenderId: "28871537008",
  appId: "1:28871537008:web:38d6ac22721f40a7d61fb5"
};

// Firebase já foi inicializado automaticamente pelo SDK
// Verificar se firebase está disponível
if (typeof firebase !== 'undefined') {
    // Criar referências
    window.firebaseApp = {
        db: firebase.firestore(),
        auth: firebase.auth(),
        firebase: firebase
    };
    console.log("✅ Firebase configurado!");
} else {
    console.error("❌ Firebase não carregou!");
}
