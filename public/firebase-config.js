// Configuração do Firebase
// ATENÇÃO: Substitua estas configurações pelas suas próprias
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO_ID",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID",
    measurementId: "SEU_MEASUREMENT_ID"
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