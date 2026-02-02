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
let firestore = null;
let auth = null;

try {
    // Verificar se Firebase está disponível (v9+)
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        // Inicializar Firebase v9
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        
        // Obter módulos do v9
        firestore = firebase.firestore();
        auth = firebase.auth();
        
        console.log('✅ Firebase v9 inicializado com sucesso');
        console.log('📡 Firebase App:', firebaseApp.name);
        console.log('🗄️  Firestore disponível:', !!firestore);
        
    } else if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        // Já inicializado
        firebaseApp = firebase.app();
        firestore = firebase.firestore();
        auth = firebase.auth();
        console.log('✅ Firebase já inicializado');
    } else {
        throw new Error('Firebase SDK não carregado corretamente');
    }
} catch (error) {
    console.warn('⚠️ Firebase não disponível, usando modo offline:', error.message);
    
    // Mock para desenvolvimento offline
    firebaseApp = {
        isMock: true,
        name: '[MOCK] Firebase Offline'
    };
    
    firestore = {
        collection: () => ({
            doc: () => ({
                get: () => Promise.resolve({ exists: false, data: () => null }),
                set: () => Promise.resolve(),
                update: () => Promise.resolve(),
                delete: () => Promise.resolve(),
                onSnapshot: () => () => {}
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
    };
    
    auth = {
        currentUser: null,
        signInWithEmailAndPassword: () => Promise.reject(new Error('Modo offline')),
        signOut: () => Promise.resolve(),
        onAuthStateChanged: () => () => {}
    };
    
    isMock = true;
}

// Configuração global
window.firebaseConfig = {
    config: FIREBASE_CONFIG,
    app: firebaseApp,
    firestore: firestore,
    auth: auth,
    isMock: isMock,
    
    getFirebaseRefs: function() {
        return {
            db: firestore,
            auth: auth,
            isMock: isMock
        };
    },
    
    testConnection: async function() {
        if (isMock) {
            return { 
                connected: false, 
                mode: 'offline',
                message: 'Modo offline ativo'
            };
        }
        
        try {
            const db = firestore;
            if (!db) {
                return { 
                    connected: false, 
                    mode: 'error', 
                    error: 'Firestore não disponível' 
                };
            }
            
            await db.collection('_tests').doc('connection').set({
                test: true,
                timestamp: new Date().toISOString(),
                session: window.location.hostname
            });
            
            return { 
                connected: true, 
                mode: 'online',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Teste de conexão falhou:', error);
            return { 
                connected: false, 
                mode: 'error', 
                error: error.message 
            };
        }
    }
};

// Teste automático após carregar
setTimeout(async () => {
    console.log('🔄 Testando conexão Firebase...');
    
    try {
        const status = await window.firebaseConfig.testConnection();
        console.log(`📡 Status Firebase:`, status);
        
        if (status.connected) {
            console.log('🎉 Firebase conectado com sucesso!');
            showNotification('Firebase conectado', 'success');
        } else if (status.mode === 'offline') {
            console.warn('🔌 Operando em modo offline');
            showNotification('Modo offline ativo', 'warning');
        } else {
            console.error('❌ Erro de conexão:', status.error);
            showNotification('Erro de conexão: ' + status.error, 'error');
        }
    } catch (error) {
        console.error('❌ Erro ao testar conexão:', error);
    }
}, 2000);

// Função auxiliar para notificações
function showNotification(message, type = 'info') {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    // Você pode implementar notificações visuais aqui
}

console.log('✅ Configuração Firebase carregada');
