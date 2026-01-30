// ============================================
// CONFIGURAÇÃO DO FIREBASE - PAYHUB QUEUE PORTAL
// ============================================

// Versão da aplicação
const APP_VERSION = '3.5.0';
const APP_ENV = getEnvironment();

// Configurações do Firebase
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCJXxaG8R5-VmkoGA7PyFcyfcvBAk92yTc",
  authDomain: "portal-fila-payhub.firebaseapp.com",
  projectId: "portal-fila-payhub",
  storageBucket: "portal-fila-payhub.firebasestorage.app",
  messagingSenderId: "28871537008",
  appId: "1:28871537008:web:38d6ac22721f40a7d61fb5"
};

// Detectar ambiente
function getEnvironment() {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  } else if (hostname.includes('test') || hostname.includes('staging')) {
    return 'staging';
  } else {
    return 'production';
  }
}

// Log de inicialização
function logInitialization(env) {
  console.log(`🚀 Portal Payhub - v${APP_VERSION}`);
  console.log(`🌍 Ambiente: ${env}`);
  console.log(`🕒 ${new Date().toLocaleString('pt-BR')}`);
  
  if (env === 'development') {
    console.log('🔧 Modo desenvolvimento ativo');
  }
}

// Modificar a função initializeFirebaseApp:
function initializeFirebaseApp() {
  // Verificar se Firebase SDK foi carregado
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK não foi carregado');
    return null;
  }
  
  try {
    // Inicializar Firebase App
    let app;
    
    if (firebase.apps.length > 0) {
      app = firebase.app();
      console.log('✅ Firebase já inicializado');
    } else {
      app = firebase.initializeApp(FIREBASE_CONFIG);
      console.log('✅ Firebase inicializado com sucesso');
    }
    
    // Configurar Firestore COM PERSISTÊNCIA PRIMEIRO
    const db = firebase.firestore(app);
    
    // HABILITAR PERSISTÊNCIA ANTES DE QUALQUER OUTRA OPERAÇÃO
    db.enablePersistence()
      .then(() => {
        console.log('✅ Persistência offline ativada');
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('⚠️ Múltiplas abas abertas - Persistência limitada');
        } else if (err.code === 'unimplemented') {
          console.warn('⚠️ Persistência não suportada pelo navegador');
        }
      });
    
    // Configurações para desenvolvimento
    if (APP_ENV === 'development') {
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
      });
    }
    
    // Configurar Auth
    const auth = firebase.auth(app);
    
    return {
      app: app,
      db: db,
      auth: auth,
      firebase: firebase,
      config: FIREBASE_CONFIG,
      environment: APP_ENV,
      isMock: false
    };
    
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    
    // Fallback para desenvolvimento
    if (APP_ENV === 'development') {
      console.warn('⚠️ Criando mock do Firebase');
      return createFirebaseMock();
    }
    
    return null;
  }
}
// Mock para desenvolvimento offline
function createFirebaseMock() {
  console.warn('⚠️ Usando MOCK do Firebase - Dados apenas locais');
  
  return {
    app: { name: '[MOCK] Firebase App' },
    db: {
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false, data: () => null }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve()
        }),
        get: () => Promise.resolve({ docs: [], forEach: () => {} }),
        add: () => Promise.resolve({ id: 'mock-' + Date.now() }),
        where: () => ({ get: () => Promise.resolve({ docs: [], forEach: () => {} }) }),
        orderBy: () => ({ get: () => Promise.resolve({ docs: [], forEach: () => {} }) }),
        limit: () => ({ get: () => Promise.resolve({ docs: [], forEach: () => {} }) }),
        onSnapshot: () => () => {}
      }),
      batch: () => ({
        set: () => {},
        delete: () => {},
        commit: () => Promise.resolve()
      }),
      enablePersistence: () => Promise.resolve()
    },
    auth: {
      onAuthStateChanged: (callback) => {
        setTimeout(() => callback(null), 100);
        return () => {};
      }
    },
    firebase: null,
    config: FIREBASE_CONFIG,
    environment: 'mock',
    isMock: true
  };
}

// Monitorar conexão
function setupConnectionMonitoring(firebaseApp) {
  if (!firebaseApp || firebaseApp.isMock) return;
  
  try {
    // Monitorar conexão de forma simples
    const connectionRef = firebaseApp.db.collection('_connections').doc('monitor');
    
    // Testar conexão inicial
    connectionRef.set({
      lastCheck: new Date().toISOString(),
      status: 'online'
    }, { merge: true })
      .then(() => {
        console.log('✅ Rede habilitada');
        updateConnectionStatus(true);
      })
      .catch((error) => {
        console.error('❌ Erro ao testar conexão:', error);
        updateConnectionStatus(false);
      });
    
    // Verificar conexão periodicamente de forma mais simples
    setInterval(() => {
      connectionRef.get()
        .then(() => updateConnectionStatus(true))
        .catch(() => updateConnectionStatus(false));
    }, 30000);
    
  } catch (error) {
    console.error('❌ Erro ao configurar monitoramento:', error);
  }
}

// Atualizar status na interface
function updateConnectionStatus(isConnected) {
  const statusElement = document.getElementById('firebaseStatus');
  if (!statusElement) return;
  
  if (isConnected) {
    statusElement.innerHTML = '<i class="fas fa-plug"></i> Conectado';
    statusElement.className = 'firebase-status connected';
  } else {
    statusElement.innerHTML = '<i class="fas fa-unlink"></i> Offline';
    statusElement.className = 'firebase-status disconnected';
  }
}

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================

// Aguardar DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM carregado - Inicializando Firebase...');
  
  logInitialization(APP_ENV);
  
  const firebaseApp = initializeFirebaseApp();
  window.firebaseApp = firebaseApp;
  
  if (firebaseApp && !firebaseApp.isMock) {
    setupConnectionMonitoring(firebaseApp);
    
    firebaseApp.db.enablePersistence()
      .then(() => console.log('✅ Persistência offline ativada'))
      .catch(err => {
        if (err.code === 'failed-precondition') {
          console.warn('⚠️ Múltiplas abas abertas');
        } else if (err.code === 'unimplemented') {
          console.warn('⚠️ Persistência não suportada');
        }
      });
  } else if (firebaseApp?.isMock) {
    const statusElement = document.getElementById('firebaseStatus');
    if (statusElement) {
      statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Modo Offline';
      statusElement.className = 'firebase-status disconnected';
    }
  }
});

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

// Verificar se Firebase está disponível
function isFirebaseAvailable() {
  return window.firebaseApp && !window.firebaseApp.isMock;
}

// Obter referências principais
function getFirebaseRefs() {
  const app = window.firebaseApp;
  if (!app) return null;
  
  return {
    db: app.db,
    auth: app.auth,
    isOnline: !app.isMock
  };
}

// Exportar para uso global
window.firebaseConfig = {
  initializeFirebaseApp,
  getFirebaseRefs,
  isFirebaseAvailable,
  APP_VERSION,
  APP_ENV
};

console.log('✅ firebase-config.js carregado');
