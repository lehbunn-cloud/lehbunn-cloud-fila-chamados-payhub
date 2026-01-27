// ATENÇÃO: Substitua estas configurações pelas do SEU projeto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA1wB9c6fXJ7XvYqQqQqQqQqQqQqQqQqQqQ",
    authDomain: "lehburn-cloud-fila-chamados-payhub.firebaseapp.com",
    projectId: "lehburn-cloud-fila-chamados-payhub",
    storageBucket: "lehburn-cloud-fila-chamados-payhub.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef",
    measurementId: "G-ABCDEF1234"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências do Firebase
const db = firebase.firestore();
const auth = firebase.auth();

// Exportar para uso em outros arquivos
window.firebaseApp = {
    db: db,
    auth: auth,
    firebase: firebase
};
