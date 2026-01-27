cd ~/portal-payhub/public

cat > firebase-config.js << 'EOF'
// Configurações do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCJXxaG8R5-VmkoGA7PyFcyfcvBAk92yTc",
  authDomain: "portal-fila-payhub.firebaseapp.com",
  projectId: "portal-fila-payhub",
  storageBucket: "portal-fila-payhub.firebasestorage.app",
  messagingSenderId: "28871537008",
  appId: "1:28871537008:web:38d6ac22721f40a7d61fb5"
};

// INICIALIZAR o Firebase (isto estava faltando!)
let firebaseApp = null;

if (typeof firebase !== 'undefined') {
    try {
        // Inicializar o app Firebase
        const app = firebase.initializeApp(firebaseConfig);
        
        // Criar referências
        firebaseApp = {
            db: firebase.firestore(),
            auth: firebase.auth(),
            firebase: firebase,
            app: app
        };
        
        console.log("✅ Firebase inicializado com sucesso!");
    } catch (error) {
        // Se já foi inicializado, pegar a instância existente
        if (error.code === 'app/duplicate-app') {
            const app = firebase.app();
            firebaseApp = {
                db: firebase.firestore(),
                auth: firebase.auth(),
                firebase: firebase,
                app: app
            };
            console.log("✅ Firebase já estava inicializado!");
        } else {
            console.error("❌ Erro ao inicializar Firebase:", error);
        }
    }
} else {
    console.error("❌ Firebase SDK não carregou!");
}

// Exportar para uso global
window.firebaseApp = firebaseApp;
EOF
