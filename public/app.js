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
        simulatedTime: state.sim
