// ============================================
// CONFIGURAÇÃO FIREBASE - PORTAL PAYHUB
// ============================================

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
let firebaseApp;
let isMock = false;

try {
    if (typeof firebase !== 'undefined' && firebase.app) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase inicializado com sucesso');
    } else {
        throw new Error('Firebase SDK não carregado');
    }
} catch (error) {
    console.warn('⚠️ Firebase não disponível, usando modo offline:', error.message);
    
    // Mock para desenvolvimento offline
    firebaseApp = {
        isMock: true,
        firestore: () => ({
            collection: () => ({
                doc: () => ({
                    get: () => Promise.resolve({ exists: false, data: () => null }),
                    set: () => Promise.resolve(),
                    update: () => Promise.resolve(),
                    delete: () => Promise.resolve()
                }),
                add: () => Promise.resolve({ id: 'mock-id' }),
                get: () => Promise.resolve({ empty: true, docs: [] }),
                where: () => ({
                    get: () => Promise.resolve({ empty: true, docs: [] }),
                    orderBy: () => ({
                        get: () => Promise.resolve({ empty: true, docs: [] })
                    })
                }),
                orderBy: () => ({
                    get: () => Promise.resolve({ empty: true, docs: [] }),
                    limit: () => ({
                        get: () => Promise.resolve({ empty: true, docs: [] })
                    })
                })
            })
        }),
        auth: () => ({
            currentUser: null,
            signInWithEmailAndPassword: () => Promise.reject(new Error('Modo offline')),
            signOut: () => Promise.resolve()
        })
    };
    
    isMock = true;
}

// Configuração global
window.firebaseConfig = {
    config: firebaseConfig,
    app: firebaseApp,
    isMock: isMock,
    
    getFirebaseRefs: function() {
        if (isMock) {
            return {
                db: firebaseApp.firestore(),
                auth: firebaseApp.auth(),
                isMock: true
            };
        }
        
        return {
            db: firebase.firestore(),
            auth: firebase.auth(),
            isMock: false
        };
    },
    
    testConnection: async function() {
        if (isMock) {
            return { connected: false, mode: 'offline' };
        }
        
        try {
            const db = firebase.firestore();
            await db.collection('_tests').doc('connection').set({
                test: true,
                timestamp: new Date().toISOString()
            });
            return { connected: true, mode: 'online' };
        } catch (error) {
            return { connected: false, mode: 'error', error: error.message };
        }
    }
};

console.log('✅ Configuração Firebase carregada');
