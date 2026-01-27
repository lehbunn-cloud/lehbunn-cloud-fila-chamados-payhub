// ATENÇÃO: Substitua estas configurações pelas do SEU projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCJXxaG8R5-VmkoGA7PyFcyfcvBAk92yTc",
  authDomain: "portal-fila-payhub.firebaseapp.com",
  projectId: "portal-fila-payhub",
  storageBucket: "portal-fila-payhub.firebasestorage.app",
  messagingSenderId: "28871537008",
  appId: "1:28871537008:web:38d6ac22721f40a7d61fb5"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Referências do Firebase
const db = firebase.firestore();
const auth = firebase.auth();

// Exportar para uso em outros arquivos
window.firebaseApp = {
    db: db,
    auth: auth,
    firebase: firebase
};

