// ============================================
// MÓDULOS PRINCIPAIS
// ============================================

// 1. Configuração Inicial
const analysts = [
    { 
        id: 1, 
        name: "Eric", 
        level: "N1", 
        startTime: 8, 
        endTime: 17, 
        isAvailable: false, 
        isBusy: false,
        currentTicket: null,
        ticketStatus: null,
        specialClient: "TIM",
        inQueue: true,
        ticketsHandled: 0
    },
    // ... outros analistas (mesma estrutura do código original)
];

const specialClients = [
    { client: "Benoit", analyst: "André", level: "N2" },
    { client: "TIM", analyst: "Eric", level: "N1" },
    { client: "DPSP", analyst: "Tamiris", level: "N1" }
];

let state = {
    currentAnalystIndex: 0,
    ticketsToday: 0,
    specialTicketsToday: 0,
    waitingTicketsToday: 0,
    lastReset: new Date().toLocaleDateString('pt-BR'),
    queueOrder: [],
    lastUpdate: new Date().toLocaleTimeString('pt-BR'),
    simulatedTime: null,
    nextTicketNumber: 1000,
    dailyResetDone: false,
    currentUser: null
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    firebaseApp.auth.onAuthStateChanged(function(user) {
        if (user) {
            // Usuário autenticado
            state.currentUser = user;
            showAuthenticatedUI();
            initializeApp();
            loadDataFromFirestore();
        } else {
            // Usuário não autenticado
            showLoginUI();
        }
    });

    setupEventListeners();
    setInterval(updateApp, 60000);
});

function showAuthenticatedUI() {
    document.getElementById('authStatus').innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-user-circle"></i>
            <span>${state.currentUser.email}</span>
            <button class="btn btn-small btn-danger" id="logoutBtn">
                <i class="fas fa-sign-out-alt"></i>
                Sair
            </button>
        </div>
    `;
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

function showLoginUI() {
    document.getElementById('authStatus').innerHTML = `
        <button class="btn btn-small" id="loginBtn">
            <i class="fas fa-sign-in-alt"></i>
            Entrar
        </button>
    `;
    
    // Mostrar modal de login
    document.getElementById('loginModal').style.display = 'flex';
    
    document.getElementById('loginBtn').addEventListener('click', function() {
        document.getElementById('loginModal').style.display = 'flex';
    });
}

// ============================================
// AUTENTICAÇÃO
// ============================================

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Preencha todos os campos', 'warning');
        return;
    }
    
    firebaseApp.auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            showNotification('Login realizado com sucesso!', 'success');
            document.getElementById('loginModal').style.display = 'none';
        })
        .catch((error) => {
            showNotification('Erro no login: ' + error.message, 'error');
        });
}

function logout() {
    firebaseApp.auth.signOut()
        .then(() => {
            showNotification('Logout realizado', 'info');
            state.currentUser = null;
        })
        .catch((error) => {
            showNotification('Erro ao sair: ' + error.message, 'error');
        });
}

// ============================================
// FIRESTORE - CRUD
// ============================================

function saveDataToFirestore() {
    if (!state.currentUser) return;
    
    const dataToSave = {
        ...state,
        simulatedTime: state.simulatedTime ? state.simulatedTime.getTime() : null,
        analysts: analysts,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: state.currentUser.email
    };
    
    // Salvar no Firestore
    firebaseApp.db.collection('queueState').doc('currentState').set(dataToSave)
        .then(() => {
            console.log('Dados salvos no Firestore');
        })
        .catch((error) => {
            console.error('Erro ao salvar no Firestore:', error);
        });
}

function loadDataFromFirestore() {
    if (!state.currentUser) return;
    
    firebaseApp.db.collection('queueState').doc('currentState').get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                
                // Restaurar estado
                state.ticketsToday = data.ticketsToday || 0;
                state.specialTicketsToday = data.specialTicketsToday || 0;
                state.waitingTicketsToday = data.waitingTicketsToday || 0;
                state.lastReset = data.lastReset || new Date().toLocaleDateString('pt-BR');
                state.currentAnalystIndex = data.currentAnalystIndex || 0;
                state.nextTicketNumber = data.nextTicketNumber || 1000;
                state.dailyResetDone = data.dailyResetDone || false;
                
                if (data.simulatedTime) {
                    state.simulatedTime = new Date(data.simulatedTime);
                }
                
                // Restaurar analistas
                if (data.analysts) {
                    data.analysts.forEach(savedAnalyst => {
                        const analyst = analysts.find(a => a.id === savedAnalyst.id);
                        if (analyst) {
                            Object.assign(analyst, savedAnalyst);
                        }
                    });
                }
                
                updateQueueOrder();
                updateQueueDisplay();
                updateSpecialCasesDisplay();
                updateStatistics();
                
                showNotification('Dados carregados do servidor', 'info');
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar do Firestore:', error);
        });
}

function saveAnalystState(analyst) {
    if (!state.currentUser) return;
    
    firebaseApp.db.collection('analystLogs').add({
        analystId: analyst.id,
        analystName: analyst.name,
        action: analyst.currentTicket ? 'ticket_assigned' : 'freed',
        ticketNumber: analyst.currentTicket,
        ticketStatus: analyst.ticketStatus,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        user: state.currentUser.email
    });
}

function saveTicketLog(ticketNumber, action, analystName) {
    if (!state.currentUser) return;
    
    firebaseApp.db.collection('ticketLogs').add({
        ticketNumber: ticketNumber,
        action: action,
        analystName: analystName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        user: state.currentUser.email
    });
}

// ============================================
// FUNÇÕES PRINCIPAIS (mantidas do código original)
// ============================================

// Aqui você deve copiar todas as funções do código original
// que estão depois da inicialização:
// updateCurrentTime, updateAnalystAvailability, updateQueueOrder,
// updateQueueDisplay, createAnalystCardHTML, getStatusDotClass,
// getClientNameFromTicket, attachAnalystCardEvents,
// updateSpecialCasesDisplay, updateStatistics, handleNewTicket,
// handleNormalTicket, handleSpecialTicket, assignTicketToAnalyst,
// setTicketWaiting, resumeTicket, finishTicket, freeAllAnalysts,
// nextAnalyst, resetQueue, checkDailyReset, openTimeSimulationModal,
// closeTimeSimulationModal, applyTimeSimulation, returnToRealTime,
// updateApp, updateLastUpdateTime, showNotification, saveState, loadState

// Nota: Substitua as chamadas a saveState() por saveDataToFirestore()
// e as chamadas a loadState() por loadDataFromFirestore()

// ============================================
// EVENT LISTENERS (atualizados)
// ============================================

function setupEventListeners() {
    // Login
    document.getElementById('doLoginBtn').addEventListener('click', login);
    document.getElementById('closeLoginModal').addEventListener('click', function() {
        document.getElementById('loginModal').style.display = 'none';
    });
    
    // Botões principais
    document.getElementById('addTicketBtn').addEventListener('click', handleNewTicket);
    document.getElementById('nextAnalystBtn').addEventListener('click', nextAnalyst);
    document.getElementById('resetQueueBtn').addEventListener('click', resetQueue);
    document.getElementById('freeAllBtn').addEventListener('click', freeAllAnalysts);
    document.getElementById('simulateTimeBtn').addEventListener('click', openTimeSimulationModal);
    document.getElementById('realTimeBtn').addEventListener('click', returnToRealTime);
    
    // Modal de simulação
    document.getElementById('closeTimeModal').addEventListener('click', closeTimeSimulationModal);
    document.getElementById('cancelSimulation').addEventListener('click', closeTimeSimulationModal);
    document.getElementById('applySimulation').addEventListener('click', applyTimeSimulation);
    
    // Opções de horário
    document.querySelectorAll('.time-option').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.time-option').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Enter no campo de ticket
    document.getElementById('newTicketNumber').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleNewTicket();
        }
    });
    
    // Fechar modais com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

// ============================================
// INICIALIZAÇÃO DO APP
// ============================================

function initializeApp() {
    updateCurrentTime();
    updateAnalystAvailability();
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    updateLastUpdateTime();
    checkDailyReset();
}

// Exportar para uso global (se necessário)
window.appState = state;
window.analysts = analysts;
