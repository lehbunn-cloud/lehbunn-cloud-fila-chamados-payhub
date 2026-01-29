// ============================================
// CONFIGURAÇÃO DO FIREBASE - PAYHUB QUEUE PORTAL
// ============================================
// ATENÇÃO: Este arquivo contém configurações sensíveis
// Não faça commit público sem revisar as restrições de segurança

// Versão da aplicação
const APP_VERSION = '1.0.0';
const APP_ENV = getEnvironment();

// Configurações do Firebase (substitua com suas credenciais)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCJXxaG8R5-VmkoGA7PyFcyfcvBAk92yTc",
  authDomain: "portal-fila-payhub.firebaseapp.com",
  projectId: "portal-fila-payhub",
  storageBucket: "portal-fila-payhub.firebasestorage.app",
  messagingSenderId: "28871537008",
  appId: "1:28871537008:web:38d6ac22721f40a7d61fb5"
};

// Verificar se as configurações são válidas
function validateFirebaseConfig(config) {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!config[field] || config[field].trim() === '') {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length > 0) {
    console.error(`❌ Configuração do Firebase incompleta. Campos faltando: ${missingFields.join(', ')}`);
    return false;
  }
  
  // Verificar formato do API Key
  if (!config.apiKey.startsWith('AIza')) {
    console.warn('⚠️ API Key do Firebase pode estar em formato incorreto');
  }
  
  return true;
}

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
  console.log(`🕒 Inicializado em: ${new Date().toLocaleString('pt-BR')}`);
  
  if (env === 'development') {
    console.warn('⚠️ Modo desenvolvimento ativo - Dados podem não ser persistidos');
  }
}

// Inicializar Firebase
function initializeFirebaseApp() {
  // Verificar se Firebase SDK foi carregado
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK não foi carregado. Verifique:');
    console.error('1. Conexão com internet');
    console.error('2. Scripts do Firebase no HTML');
    console.error('3. Bloqueadores de script (AdBlock)');
    
    // Tentar recarregar os scripts dinamicamente
    loadFirebaseSDK();
    return null;
  }
  
  // Validar configuração
  if (!validateFirebaseConfig(FIREBASE_CONFIG)) {
    console.error('❌ Configuração do Firebase inválida. Verifique firebase-config.js');
    return null;
  }
  
  try {
    // Inicializar Firebase App
    let app;
    
    // Verificar se já foi inicializado
    if (firebase.apps.length > 0) {
      app = firebase.app();
      console.log('✅ Firebase já inicializado anteriormente');
    } else {
      app = firebase.initializeApp(FIREBASE_CONFIG);
      console.log('✅ Firebase inicializado com sucesso');
    }
    
    // Configurar Firestore com otimizações
    const db = firebase.firestore(app);
    
    // Otimizações para performance
    if (APP_ENV === 'development') {
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        experimentalForceLongPolling: true
      });
      console.log('🔧 Modo desenvolvimento: Cache ilimitado ativo');
    }
    
    // Configurar Auth com persistência
    const auth = firebase.auth(app);
    
    // Configurar persistência baseada no ambiente
    const persistence = APP_ENV === 'production' 
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;
    
    auth.setPersistence(persistence)
      .then(() => {
        console.log(`✅ Persistência de auth configurada: ${persistence}`);
      })
      .catch((error) => {
        console.error('❌ Erro ao configurar persistência:', error);
      });
    
    // Retornar objeto com referências
    return {
      app: app,
      db: db,
      auth: auth,
      firebase: firebase,
      config: FIREBASE_CONFIG,
      environment: APP_ENV
    };
    
  } catch (error) {
    console.error('❌ Erro crítico ao inicializar Firebase:', error);
    
    // Fallback para desenvolvimento
    if (APP_ENV === 'development') {
      console.warn('⚠️ Criando mock do Firebase para desenvolvimento');
      return createFirebaseMock();
    }
    
    return null;
  }
}

// Fallback: Carregar SDK dinamicamente
function loadFirebaseSDK() {
  console.log('🔄 Tentando carregar Firebase SDK dinamicamente...');
  
  const scripts = [
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js'
  ];
  
  let loaded = 0;
  
  scripts.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      loaded++;
      if (loaded === scripts.length) {
        console.log('✅ Firebase SDK carregado dinamicamente');
        // Tentar inicializar novamente após 1 segundo
        setTimeout(() => {
          window.firebaseApp = initializeFirebaseApp();
        }, 1000);
      }
    };
    script.onerror = () => {
      console.error(`❌ Falha ao carregar: ${src}`);
    };
    document.head.appendChild(script);
  });
}

// Mock para desenvolvimento offline
function createFirebaseMock() {
  console.warn('⚠️ Usando MOCK do Firebase - Dados serão armazenados apenas localmente');
  
  return {
    app: { name: '[MOCK] Firebase App' },
    db: {
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false, data: () => null }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve()
        }),
        get: () => Promise.resolve({ docs: [], forEach: () => {} }),
        add: () => Promise.resolve({ id: 'mock-' + Date.now() })
      }),
      enableNetwork: () => Promise.resolve(),
      disableNetwork: () => Promise.resolve()
    },
    auth: {
      onAuthStateChanged: (callback) => {
        // Simula usuário não autenticado
        setTimeout(() => callback(null), 100);
        return () => {};
      },
      signInWithEmailAndPassword: () => Promise.reject(new Error('Mock: Offline')),
      signOut: () => Promise.resolve()
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
  
  const connectionRef = firebaseApp.db.collection('.info/connected');
  
  connectionRef.onSnapshot((snapshot) => {
    const isConnected = snapshot.data()?.connected || false;
    
    // Atualizar status na UI
    updateConnectionStatus(isConnected);
    
    if (isConnected) {
      console.log('✅ Conectado ao Firebase');
    } else {
      console.warn('⚠️ Desconectado do Firebase - Trabalhando offline');
    }
  });
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

// Aguardar DOM estar pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM carregado - Inicializando Firebase...');
  
  // Log do ambiente
  logInitialization(APP_ENV);
  
  // Inicializar Firebase
  const firebaseApp = initializeFirebaseApp();
  
  // Armazenar globalmente
  window.firebaseApp = firebaseApp;
  
  if (firebaseApp && !firebaseApp.isMock) {
    // Configurar monitoramento de conexão
    setupConnectionMonitoring(firebaseApp);
    
    // Configurar listeners para erros do Firebase
    firebaseApp.auth.onAuthStateChanged((user) => {
      if (user) {
        console.log(`👤 Usuário autenticado: ${user.email}`);
      }
    }, (error) => {
      console.error('❌ Erro no auth state:', error);
    });
    
    // Configurar tratamento de erros do Firestore
    firebaseApp.db.enableNetwork().catch((error) => {
      console.error('❌ Erro ao habilitar rede:', error);
    });
    
  } else if (firebaseApp?.isMock) {
    // Modo mock - mostrar aviso na interface
    const statusElement = document.getElementById('firebaseStatus');
    if (statusElement) {
      statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Modo Offline';
      statusElement.className = 'firebase-status disconnected';
      statusElement.title = 'Sistema operando em modo offline - Dados locais';
    }
    
    // Notificar usuário
    setTimeout(() => {
      if (typeof showNotification === 'function') {
        showNotification('Sistema operando em modo offline', 'warning');
      }
    }, 2000);
  }
  
  // Expor função para re-inicialização manual
  window.reinitializeFirebase = function() {
    console.log('🔄 Re-inicializando Firebase...');
    window.firebaseApp = initializeFirebaseApp();
    return window.firebaseApp;
  };
});

// ============================================
// FUNÇÕES UTILITÁRIAS PARA USO EXTERNO
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

// Limpar cache (para desenvolvimento)
function clearFirebaseCache() {
  if (window.firebaseApp?.db) {
    window.firebaseApp.db.clearPersistence()
      .then(() => console.log('🧹 Cache do Firestore limpo'))
      .catch(err => console.error('❌ Erro ao limpar cache:', err));
  }
}

// Exportar para uso global
window.firebaseConfig = {
  initializeFirebaseApp,
  getFirebaseRefs,
  isFirebaseAvailable,
  clearFirebaseCache,
  APP_VERSION,
  APP_ENV
};

// Log de carregamento
console.log('✅ firebase-config.js carregado');
