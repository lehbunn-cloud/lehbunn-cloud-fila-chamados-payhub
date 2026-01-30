// ============================================
// PORTAL DE FILA DE CHAMADOS - PAYHUB
// ============================================
// app.js - Lógica principal da aplicação
// Versão: 3.5.0
// Data: 2024
// PERSISTÊNCIA COMPLETA COM FIREBASE

// ============================================
// CONFIGURAÇÃO GLOBAL
// ============================================

// Analistas
window.analysts = [
    { id: 1, name: "Eric", level: "N1", startTime: 8, endTime: 17, isAvailable: false, isBusy: false, currentTicket: null, ticketStatus: null, specialClient: "TIM", inQueue: true, ticketsHandled: 0, lastActivity: null, isWaitingForClient: false },
    { id: 2, name: "Carolina", level: "N1", startTime: 9, endTime: 18, isAvailable: false, isBusy: false, currentTicket: null, ticketStatus: null, specialClient: null, inQueue: true, ticketsHandled: 0, lastActivity: null, isWaitingForClient: false },
    { id: 3, name: "Tamiris", level: "N1", startTime: 9, endTime: 18, isAvailable: false, isBusy: false, currentTicket: null, ticketStatus: null, specialClient: null, inQueue: true, ticketsHandled: 0, lastActivity: null, isWaitingForClient: false },
    { id: 4, name: "Cristiane", level: "N1", startTime: 9, endTime: 18, isAvailable: false, isBusy: false, currentTicket: null, ticketStatus: null, specialClient: null, inQueue: true, ticketsHandled: 0, lastActivity: null, isWaitingForClient: false },
    { id: 5, name: "Jonathan", level: "N1", startTime: 8, endTime: 17, isAvailable: false, isBusy: false, currentTicket: null, ticketStatus: null, specialClient: null, inQueue: true, ticketsHandled: 0, lastActivity: null, isWaitingForClient: false },
    { id: 6, name: "Sander", level: "N1", startTime: 14, endTime: 23, isAvailable: false, isBusy: false, currentTicket: null, ticketStatus: null, specialClient: null, inQueue: true, ticketsHandled: 0, lastActivity: null, isWaitingForClient: false },
    { id: 7, name: "Yan", level: "N1", startTime: 14, endTime: 23, isAvailable: false, isBusy: false, currentTicket: null, ticketStatus: null, specialClient: null, inQueue: true, ticketsHandled: 0, lastActivity: null, isWaitingForClient: false },
    { id: 8, name: "André", level: "N1", startTime: 8, endTime: 18, isAvailable: false, isBusy: false, currentTicket: null, ticketStatus: null, specialClient: "Benoit", inQueue: true, ticketsHandled: 0, lastActivity: null, isWaitingForClient: false },
    { id: 9, name: "Felipe", level: "N1", startTime: 8, endTime: 18, isAvailable: false, isBusy: false, currentTicket: null, ticketStatus: null, specialClient: "DPSP", inQueue: true, ticketsHandled: 0, lastActivity: null, isWaitingForClient: false }
];

// Clientes especiais
window.specialClients = [
    { client: "Benoit", analyst: "André", level: "N1" },
    { client: "TIM", analyst: "Eric", level: "N1" },
    { client: "DPSP", analyst: "Felipe", level: "N1" }
];

// Estado da aplicação
let appState = {
    ticketsToday: 0,
    specialTicketsToday: 0,
    waitingTicketsToday: 0,
    lastReset: new Date().toLocaleDateString('pt-BR'),
    queueOrder: [],
    simulatedTime: null,
    nextTicketNumber: 1000,
    dailyResetDone: false,
    sessionId: null,
    firebaseStatus: 'checking',
    lastSaveTime: null
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Portal v3.5.0...');
    
    // Inicializar de forma síncrona primeiro
    initializeAppSync();
    
    // Depois inicializar async
    setTimeout(async () => {
        try {
            await initializeAppAsync();
            console.log('✅ Sistema inicializado com Firebase');
        } catch (error) {
            console.error('❌ Erro na inicialização async:', error);
        } finally {
            // Esconder loading overlay
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 1000);
            }
        }
    }, 1000);
});

function initializeAppSync() {
    try {
        // Gerar ID de sessão
        appState.sessionId = generateSessionId();
        sessionStorage.setItem('queue_session_id', appState.sessionId);
        
        // Atualizar interface básica
        updateCurrentTime();
        updateLastUpdateTime();
        
        // Configurar eventos básicos
        setupEventListeners();
        
        // Configurar auto-refresh
        setupAutoRefresh();
        
        // Focar no input
        focusMainInput();
        
        console.log('✅ Sistema básico inicializado');
        
    } catch (error) {
        console.error('❌ Erro na inicialização síncrona:', error);
    }
}

async function initializeAppAsync() {
    try {
        // Aguardar Firebase inicializar
        await waitForFirebase();
        
        // Carregar estado salvo
        await loadSavedState();
        
        // Atualizar disponibilidade baseada no horário
        updateAnalystAvailability();
        
        // Atualizar interface completa
        createAnalystStatusColumns();
        updateSpecialCasesDisplay();
        updateQueueOrder();
        updateStatistics();
        
        // Configurar auto-salvamento
        setupAutoSave();
        
        // Verificar reset diário
        checkDailyReset();
        
        // Atualizar sessão no rodapé
        const sessionElement = document.getElementById('sessionId');
        if (sessionElement && appState.sessionId) {
            sessionElement.textContent = appState.sessionId.substring(0, 12) + '...';
        }
        
        showNotification('Sistema carregado com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro na inicialização async:', error);
    }
}

async function waitForFirebase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.firebaseAppIntegration && window.firebaseAppIntegration.initialized) {
                clearInterval(checkInterval);
                resolve();
                return;
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn('⚠️ Firebase não inicializado após tentativas');
                resolve(); // Resolver mesmo sem Firebase
            }
            
            if (attempts % 5 === 0) {
                console.log(`⏳ Aguardando Firebase... (${attempts}/${maxAttempts})`);
            }
        }, 500);
    });
}

// ============================================
// PERSISTÊNCIA - CORRIGIDA
// ============================================

async function loadSavedState() {
    console.log('📂 Carregando estado salvo...');
    
    let loaded = false;
    
    try {
        // Tentar Firebase primeiro
        if (window.firebaseAppIntegration && window.firebaseAppIntegration.initialized) {
            const savedState = await window.firebaseAppIntegration.loadFullState();
            if (savedState) {
                restoreFromFirebaseState(savedState);
                appState.firebaseStatus = 'connected';
                console.log('✅ Estado carregado do Firebase');
                loaded = true;
            }
        }
    } catch (firebaseError) {
        console.warn('⚠️ Erro ao carregar do Firebase:', firebaseError);
    }
    
    // Fallback para localStorage
    if (!loaded) {
        loaded = loadFromLocalStorage();
        appState.firebaseStatus = 'disconnected';
        console.log('📱 Estado carregado do localStorage');
    }
    
    return loaded;
}

async function saveState() {
    console.log('💾 Salvando estado...');
    
    const stateToSave = prepareStateForSave();
    
    try {
        // Salvar localmente PRIMEIRO (mais rápido)
        saveToLocalStorage(stateToSave);
        
        // Salvar no Firebase se disponível
        if (window.firebaseAppIntegration && window.firebaseAppIntegration.initialized) {
            try {
                const success = await window.firebaseAppIntegration.saveFullState(stateToSave);
                if (success) {
                    appState.firebaseStatus = 'connected';
                    appState.lastSaveTime = new Date();
                    console.log('✅ Estado salvo no Firebase');
                } else {
                    appState.firebaseStatus = 'disconnected';
                    console.log('✅ Estado salvo apenas localmente');
                }
            } catch (firebaseError) {
                console.warn('⚠️ Erro ao salvar no Firebase:', firebaseError);
                appState.firebaseStatus = 'disconnected';
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar estado:', error);
        return false;
    }
}

function prepareStateForSave() {
    return {
        appState: {
            ticketsToday: appState.ticketsToday,
            specialTicketsToday: appState.specialTicketsToday,
            waitingTicketsToday: appState.waitingTicketsToday,
            lastReset: appState.lastReset,
            nextTicketNumber: appState.nextTicketNumber,
            simulatedTime: appState.simulatedTime ? appState.simulatedTime.getTime() : null,
            lastSaveTime: new Date().toISOString(),
            sessionId: appState.sessionId
        },
        analysts: window.analysts.map(a => ({
            id: a.id,
            name: a.name,
            level: a.level,
            startTime: a.startTime,
            endTime: a.endTime,
            isAvailable: a.isAvailable,
            isBusy: a.isBusy,
            currentTicket: a.currentTicket,
            ticketStatus: a.ticketStatus,
            ticketSpecialType: a.ticketSpecialType,
            ticketsHandled: a.ticketsHandled,
            isWaitingForClient: a.isWaitingForClient,
            inQueue: a.inQueue,
            specialClient: a.specialClient,
            lastActivity: a.lastActivity ? a.lastActivity.toISOString() : null
        })),
        queueOrder: appState.queueOrder.map(a => a.id),
        sessionId: appState.sessionId,
        version: '3.5.0',
        savedAt: new Date().toISOString()
    };
}

function restoreFromFirebaseState(savedState) {
    if (!savedState) return false;
    
    try {
        // Restaurar appState
        if (savedState.appState) {
            appState.ticketsToday = savedState.appState.ticketsToday || 0;
            appState.specialTicketsToday = savedState.appState.specialTicketsToday || 0;
            appState.waitingTicketsToday = savedState.appState.waitingTicketsToday || 0;
            appState.lastReset = savedState.appState.lastReset || new Date().toLocaleDateString('pt-BR');
            appState.nextTicketNumber = savedState.appState.nextTicketNumber || 1000;
            appState.sessionId = savedState.appState.sessionId || appState.sessionId;
            
            if (savedState.appState.simulatedTime) {
                appState.simulatedTime = new Date(savedState.appState.simulatedTime);
            }
            
            if (savedState.appState.lastSaveTime) {
                appState.lastSaveTime = new Date(savedState.appState.lastSaveTime);
            }
        }
        
        // Restaurar analistas
        if (savedState.analysts && Array.isArray(savedState.analysts)) {
            savedState.analysts.forEach(savedAnalyst => {
                const analyst = window.analysts.find(a => a.id === savedAnalyst.id);
                if (analyst) {
                    analyst.isAvailable = savedAnalyst.isAvailable !== undefined ? savedAnalyst.isAvailable : false;
                    analyst.isBusy = savedAnalyst.isBusy || false;
                    analyst.currentTicket = savedAnalyst.currentTicket || null;
                    analyst.ticketStatus = savedAnalyst.ticketStatus || null;
                    analyst.ticketSpecialType = savedAnalyst.ticketSpecialType || null;
                    analyst.ticketsHandled = savedAnalyst.ticketsHandled || 0;
                    analyst.isWaitingForClient = savedAnalyst.isWaitingForClient || false;
                    analyst.inQueue = savedAnalyst.inQueue !== undefined ? savedAnalyst.inQueue : true;
                    
                    if (savedAnalyst.lastActivity) {
                        analyst.lastActivity = new Date(savedAnalyst.lastActivity);
                    }
                }
            });
        }
        
        // Restaurar fila
        if (savedState.queueOrder && Array.isArray(savedState.queueOrder)) {
            appState.queueOrder = savedState.queueOrder.map(id => 
                window.analysts.find(a => a.id === id)
            ).filter(a => a);
        }
        
        // Restaurar sessionId
        if (savedState.sessionId) {
            appState.sessionId = savedState.sessionId;
            sessionStorage.setItem('queue_session_id', savedState.sessionId);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao restaurar estado do Firebase:', error);
        return false;
    }
}

function saveToLocalStorage(state) {
    try {
        localStorage.setItem('queue_state', JSON.stringify(state));
        console.log('✅ Estado salvo no localStorage');
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        return false;
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('queue_state');
        if (saved) {
            const state = JSON.parse(saved);
            return restoreFromFirebaseState(state);
        }
        return false;
    } catch (error) {
        console.error('❌ Erro ao carregar do localStorage:', error);
        return false;
    }
}

// ============================================
// FUNÇÕES PRINCIPAIS DA INTERFACE
// ============================================

function createAnalystStatusColumns() {
    const container = document.getElementById('analystStatusColumns');
    if (!container) {
        console.error('❌ Container analystStatusColumns não encontrado');
        return;
    }
    
    // Atualizar status baseado no horário atual
    updateAnalystStatusFlags();
    
    // Filtrar analistas
    const availableAnalysts = window.analysts.filter(a => 
        a.level === "N1" && a.isAvailable && !a.isBusy && !a.currentTicket && !a.isWaitingForClient
    );
    
    const busyAnalysts = window.analysts.filter(a => 
        a.level === "N1" && a.isAvailable && (a.isBusy || a.currentTicket) && !a.isWaitingForClient
    );
    
    const waitingAnalysts = window.analysts.filter(a => 
        a.level === "N1" && a.isAvailable && a.isWaitingForClient
    );
    
    const offlineAnalysts = window.analysts.filter(a => 
        a.level === "N1" && !a.isAvailable
    );
    
    let html = `
        <div class="analyst-columns">
            <!-- Disponíveis -->
            <div class="analyst-column">
                <div class="column-header available">
                    <i class="fas fa-user-check"></i>
                    Disponíveis para Atendimento
                    <span class="analyst-count">${availableAnalysts.length}</span>
                </div>
    `;
    
    if (availableAnalysts.length > 0) {
        availableAnalysts.forEach(analyst => {
            html += createAnalystCardHTML(analyst, 'available');
        });
    } else {
        html += '<div class="empty-state">Nenhum analista disponível</div>';
    }
    
    html += `
            </div>
            
            <!-- Em Atendimento -->
            <div class="analyst-column">
                <div class="column-header busy">
                    <i class="fas fa-headset"></i>
                    Em Atendimento
                    <span class="analyst-count">${busyAnalysts.length}</span>
                </div>
    `;
    
    if (busyAnalysts.length > 0) {
        busyAnalysts.forEach(analyst => {
            html += createAnalystCardHTML(analyst, 'busy');
        });
    } else {
        html += '<div class="empty-state">Nenhum atendimento em andamento</div>';
    }
    
    html += `
            </div>
        </div>
    `;
    
    // Aguardando cliente
    if (waitingAnalysts.length > 0) {
        html += `
            <div class="waiting-section">
                <div class="column-header waiting">
                    <i class="fas fa-clock"></i>
                    Aguardando Retorno do Cliente
                    <span class="analyst-count">${waitingAnalysts.length}</span>
                </div>
                <div class="waiting-list">
        `;
        
        waitingAnalysts.forEach(analyst => {
            html += `
                <div class="waiting-item">
                    <span>${analyst.name}</span>
                    <small>${analyst.currentTicket || 'Sem ticket'}</small>
                    <button class="btn-small resume-btn" onclick="resumeTicket(${analyst.id})">
                        <i class="fas fa-play"></i> Retomar
                    </button>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Offline
    if (offlineAnalysts.length > 0) {
        html += `
            <div class="offline-section">
                <div class="column-header offline">
                    <i class="fas fa-clock"></i>
                    Fora do Horário
                    <span class="analyst-count">${offlineAnalysts.length}</span>
                </div>
                <div class="offline-list">
        `;
        
        offlineAnalysts.forEach(analyst => {
            html += `
                <div class="offline-item">
                    ${analyst.name}
                    <small>${analyst.startTime}h-${analyst.endTime}h</small>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Adicionar eventos aos botões
    attachCardEvents();
}

function createAnalystCardHTML(analyst, status) {
    let statusText = status === 'available' ? 'DISPONÍVEL' : 'EM ATENDIMENTO';
    let statusClass = status === 'available' ? 'available' : 'busy';
    let ticketInfo = '';
    let quickAssign = '';
    
    if (status === 'available') {
        quickAssign = `
            <div class="quick-assign">
                <input type="text" class="quick-input" data-id="${analyst.id}" 
                       placeholder="Nº chamado" value="">
                <button class="btn-small assign-btn" onclick="handleQuickAssign(${analyst.id})">
                    <i class="fas fa-paperclip"></i> Atribuir
                </button>
            </div>
        `;
    } else if (status === 'busy' && analyst.currentTicket) {
        const specialTag = analyst.ticketSpecialType ? 
            `<span class="special-tag">${analyst.ticketSpecialType}</span>` : '';
        
        ticketInfo = `
            <div class="ticket-info">
                <strong><i class="fas fa-ticket-alt"></i> ${analyst.currentTicket}</strong>
                ${specialTag}
                <div class="ticket-actions">
                    <button class="btn-small wait-btn" onclick="setTicketWaiting(${analyst.id})">
                        <i class="fas fa-clock"></i> Aguardar
                    </button>
                    <button class="btn-small finish-btn" onclick="finishTicket(${analyst.id})">
                        <i class="fas fa-check"></i> Finalizar
                    </button>
                </div>
            </div>
        `;
    }
    
    const specialBadge = analyst.specialClient ? 
        `<span class="special-badge">${analyst.specialClient}</span>` : '';
    
    return `
        <div class="analyst-card" data-id="${analyst.id}">
            <div class="analyst-header">
                <div class="analyst-name">
                    ${analyst.name}
                    <span class="level-badge">${analyst.level}</span>
                    ${specialBadge}
                </div>
                <div class="analyst-schedule">
                    <i class="far fa-clock"></i> ${analyst.startTime}h-${analyst.endTime}h
                </div>
            </div>
            
            ${ticketInfo}
            
            <div class="analyst-status">
                <span class="status-dot ${statusClass}"></span>
                <span class="status-text">${statusText}</span>
                <small class="ticket-count">${analyst.ticketsHandled} chamados hoje</small>
            </div>
            
            ${quickAssign}
        </div>
    `;
}

// ============================================
// FUNÇÕES DE ATRIBUIÇÃO DE TICKETS - CORRIGIDAS
// ============================================

async function assignTicketToAnalyst(analystId, ticketNumber, ticketType = 'normal') {
    const analyst = window.analysts.find(a => a.id === analystId);
    if (!analyst) {
        showNotification('Analista não encontrado', 'error');
        return;
    }
    
    // Verificar disponibilidade
    if (!analyst.isAvailable) {
        showNotification(`${analyst.name} não está disponível`, 'warning');
        return;
    }
    
    if (analyst.isBusy && analyst.currentTicket) {
        showNotification(`${analyst.name} já está em atendimento`, 'warning');
        return;
    }
    
    // Verificar se ticket já existe
    if (isTicketAlreadyExists(ticketNumber)) {
        showNotification(`Ticket ${ticketNumber} já está em atendimento`, 'warning');
        return;
    }
    
    // Atualizar analista
    analyst.isBusy = true;
    analyst.currentTicket = ticketNumber;
    analyst.ticketStatus = 'atendendo';
    analyst.ticketSpecialType = ticketType !== 'normal' ? ticketType : null;
    analyst.ticketsHandled++;
    analyst.lastActivity = new Date();
    analyst.inQueue = false;
    analyst.isWaitingForClient = false;
    
    // Atualizar contadores
    if (ticketType === 'normal') {
        appState.ticketsToday++;
    } else {
        appState.specialTicketsToday++;
    }
    
    // Salvar ticket no Firebase para relatórios
    if (window.firebaseAppIntegration && window.firebaseAppIntegration.initialized) {
        try {
            await window.firebaseAppIntegration.saveTicketToFirebase(
                ticketNumber,
                analyst.name,
                'iniciado',
                ticketType
            );
        } catch (error) {
            console.error('❌ Erro ao salvar ticket no Firebase:', error);
        }
    }
    
    // Atualizar interface
    updateQueueOrder();
    updateStatistics();
    updateSpecialCasesDisplay();
    createAnalystStatusColumns();
    
    // Salvar estado COMPLETO
    await saveState();
    
    showNotification(`Ticket ${ticketNumber} atribuído a ${analyst.name}`, 'success');
}

async function finishTicket(analystId) {
    const analyst = window.analysts.find(a => a.id === analystId);
    if (!analyst) {
        showNotification('Analista não encontrado', 'error');
        return;
    }
    
    const ticketNumber = analyst.currentTicket;
    
    // Atualizar ticket no Firebase
    if (window.firebaseAppIntegration && window.firebaseAppIntegration.initialized && ticketNumber) {
        try {
            await window.firebaseAppIntegration.updateTicketStatus(ticketNumber, 'finalizado', analyst.name);
        } catch (error) {
            console.error('❌ Erro ao finalizar ticket no Firebase:', error);
        }
    }
    
    // Liberar analista
    analyst.isBusy = false;
    analyst.currentTicket = null;
    analyst.ticketStatus = null;
    analyst.ticketSpecialType = null;
    analyst.inQueue = analyst.level === "N1";
    analyst.isWaitingForClient = false;
    analyst.lastActivity = new Date();
    
    // Atualizar interface
    updateQueueOrder();
    updateStatistics();
    updateSpecialCasesDisplay();
    createAnalystStatusColumns();
    
    // Salvar estado COMPLETO
    await saveState();
    
    showNotification(`Ticket ${ticketNumber} finalizado`, 'success');
}

async function setTicketWaiting(analystId) {
    const analyst = window.analysts.find(a => a.id === analystId);
    if (!analyst) {
        showNotification('Analista não encontrado', 'error');
        return;
    }
    
    const ticketNumber = analyst.currentTicket;
    
    // Atualizar ticket no Firebase
    if (window.firebaseAppIntegration && window.firebaseAppIntegration.initialized && ticketNumber) {
        try {
            await window.firebaseAppIntegration.updateTicketStatus(ticketNumber, 'aguardando', analyst.name);
        } catch (error) {
            console.error('❌ Erro ao atualizar status no Firebase:', error);
        }
    }
    
    // Colocar em espera
    analyst.ticketStatus = 'aguardando-cliente';
    analyst.isBusy = false;
    analyst.isWaitingForClient = true;
    analyst.inQueue = true;
    analyst.lastActivity = new Date();
    
    // Atualizar interface
    updateQueueOrder();
    updateStatistics();
    updateSpecialCasesDisplay();
    createAnalystStatusColumns();
    
    // Salvar estado COMPLETO
    await saveState();
    
    showNotification(`${analyst.name} aguardando retorno do cliente`, 'info');
}

async function resumeTicket(analystId) {
    const analyst = window.analysts.find(a => a.id === analystId);
    if (!analyst) {
        showNotification('Analista não encontrado', 'error');
        return;
    }
    
    const ticketNumber = analyst.currentTicket;
    
    // Atualizar ticket no Firebase
    if (window.firebaseAppIntegration && window.firebaseAppIntegration.initialized && ticketNumber) {
        try {
            await window.firebaseAppIntegration.updateTicketStatus(ticketNumber, 'iniciado', analyst.name);
        } catch (error) {
            console.error('❌ Erro ao retomar ticket no Firebase:', error);
        }
    }
    
    // Retomar atendimento
    analyst.ticketStatus = 'atendendo';
    analyst.isBusy = true;
    analyst.isWaitingForClient = false;
    analyst.inQueue = false;
    analyst.lastActivity = new Date();
    
    // Atualizar interface
    updateQueueOrder();
    updateStatistics();
    updateSpecialCasesDisplay();
    createAnalystStatusColumns();
    
    // Salvar estado COMPLETO
    await saveState();
    
    showNotification(`${analyst.name} retomou o atendimento`, 'success');
}

function handleQuickAssign(analystId) {
    const input = document.querySelector(`.quick-input[data-id="${analystId}"]`);
    if (!input) return;
    
    const ticketNumber = input.value.trim();
    if (!ticketNumber) {
        showNotification('Digite o número do ticket', 'warning');
        input.focus();
        return;
    }
    
    assignTicketToAnalyst(analystId, ticketNumber, 'normal');
    input.value = '';
}

// ============================================
// FUNÇÕES AUXILIARES - CORRIGIDAS
// ============================================

function updateAnalystAvailability() {
    const now = appState.simulatedTime ? new Date(appState.simulatedTime) : new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes / 100;
    
    let needsRefresh = false;
    let needsSave = false;
    
    window.analysts.forEach(analyst => {
        const newAvailability = (currentTime >= analyst.startTime && currentTime < analyst.endTime);
        
        if (analyst.isAvailable !== newAvailability) {
            analyst.isAvailable = newAvailability;
            needsRefresh = true;
            
            // Se saiu do horário, liberar ticket
            if (!analyst.isAvailable && (analyst.isBusy || analyst.currentTicket)) {
                analyst.isBusy = false;
                analyst.currentTicket = null;
                analyst.ticketStatus = null;
                analyst.ticketSpecialType = null;
                analyst.isWaitingForClient = false;
                analyst.inQueue = false;
                needsSave = true;
            }
        }
    });
    
    if (needsRefresh) {
        updateQueueOrder();
        updateStatistics();
        updateSpecialCasesDisplay();
        
        if (needsSave) {
            saveState(); // Não precisa await aqui
        }
    }
}

function updateAnalystStatusFlags() {
    const now = appState.simulatedTime ? new Date(appState.simulatedTime) : new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes / 100;
    
    window.analysts.forEach(analyst => {
        // Atualizar disponibilidade por horário
        const shouldBeAvailable = (currentTime >= analyst.startTime && currentTime < analyst.endTime);
        
        // Se mudou a disponibilidade, atualizar
        if (analyst.isAvailable !== shouldBeAvailable) {
            analyst.isAvailable = shouldBeAvailable;
            
            // Se saiu do horário, liberar
            if (!analyst.isAvailable) {
                analyst.isBusy = false;
                analyst.currentTicket = null;
                analyst.ticketStatus = null;
                analyst.isWaitingForClient = false;
                analyst.inQueue = false;
            }
        }
    });
}

function updateQueueOrder() {
    const queueEligible = window.analysts.filter(a => 
        a.level === "N1" && a.isAvailable && ((!a.isBusy && a.inQueue) || a.isWaitingForClient)
    );
    
    appState.queueOrder = [...queueEligible].sort((a, b) => {
        if (!a.isWaitingForClient && b.isWaitingForClient) return -1;
        if (a.isWaitingForClient && !b.isWaitingForClient) return 1;
        return a.ticketsHandled - b.ticketsHandled;
    });
}

function updateStatistics() {
    updateElementText('totalTickets', appState.ticketsToday);
    updateElementText('specialTickets', appState.specialTicketsToday);
    
    const available = window.analysts.filter(a => a.isAvailable && !a.isBusy && !a.currentTicket).length;
    updateElementText('availableAnalystsStat', available);
    
    const waiting = window.analysts.filter(a => a.isWaitingForClient).length;
    updateElementText('waitingTickets', waiting);
    appState.waitingTicketsToday = waiting;
    
    const next = appState.queueOrder.length > 0 ? appState.queueOrder[0].name : '-';
    updateElementText('nextInQueue', next);
    
    updateElementText('lastResetDate', appState.lastReset);
    
    // Atualizar contador de analistas
    updateElementText('analystCount', `${window.analysts.length} analistas`);
}

function updateSpecialCasesDisplay() {
    const container = document.getElementById('specialCases');
    if (!container) return;
    
    let html = '';
    
    window.specialClients.forEach(special => {
        const analyst = window.analysts.find(a => a.name === special.analyst);
        let status = 'INDISPONÍVEL';
        let statusClass = 'offline';
        let details = '';
        
        if (analyst) {
            if (analyst.isAvailable) {
                if (analyst.currentTicket && analyst.ticketSpecialType === special.client) {
                    status = analyst.ticketStatus === 'aguardando-cliente' ? 'AGUARDANDO' : 'ATENDENDO';
                    statusClass = analyst.ticketStatus === 'aguardando-cliente' ? 'waiting' : 'busy';
                    details = `Ticket: ${analyst.currentTicket}`;
                } else if (!analyst.isBusy) {
                    status = 'DISPONÍVEL';
                    statusClass = 'available';
                    details = 'Pronto para atender';
                } else {
                    status = 'OCUPADO';
                    statusClass = 'busy';
                    details = 'Atendendo outro cliente';
                }
            }
        }
        
        html += `
            <div class="special-client-card">
                <div class="special-client-header">
                    <i class="fas fa-star"></i>
                    <div>
                        <strong>Cliente ${special.client}</strong>
                        <small>Analista: ${special.analyst} (${special.level})</small>
                    </div>
                </div>
                <div class="special-client-status">
                    <span class="status-indicator ${statusClass}"></span>
                    <span>${status}</span>
                    ${details ? `<small>${details}</small>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html || '<div class="empty-state">Nenhum cliente especial</div>';
}

function updateCurrentTime() {
    const now = appState.simulatedTime ? new Date(appState.simulatedTime) : new Date();
    
    const dateStr = now.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const timeStr = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    updateElementText('currentDate', dateStr);
    updateElementText('currentTime', timeStr);
    
    // Mostrar/ocultar indicador de simulação
    const indicator = document.getElementById('simulationIndicator');
    const realTimeBtn = document.getElementById('realTimeBtn');
    
    if (appState.simulatedTime) {
        if (indicator) indicator.style.display = 'flex';
        if (realTimeBtn) realTimeBtn.style.display = 'inline-flex';
    } else {
        if (indicator) indicator.style.display = 'none';
        if (realTimeBtn) realTimeBtn.style.display = 'none';
    }
}

function updateLastUpdateTime() {
    const now = new Date().toLocaleTimeString('pt-BR');
    updateElementText('lastUpdate', now);
}

function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 
                         'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function isTicketAlreadyExists(ticketNumber) {
    return window.analysts.some(a => a.currentTicket === ticketNumber);
}

function focusMainInput() {
    setTimeout(() => {
        const input = document.getElementById('newTicketNumber');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
}

function checkDailyReset() {
    const today = new Date().toLocaleDateString('pt-BR');
    if (today !== appState.lastReset && !appState.dailyResetDone) {
        resetQueue();
        appState.dailyResetDone = true;
    }
}

// ============================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================

function setupEventListeners() {
    // Botões principais
    document.getElementById('addTicketBtn')?.addEventListener('click', handleNewTicket);
    document.getElementById('nextAnalystBtn')?.addEventListener('click', nextAnalyst);
    document.getElementById('resetQueueBtn')?.addEventListener('click', resetQueue);
    document.getElementById('freeAllBtn')?.addEventListener('click', freeAllAnalysts);
    document.getElementById('simulateTimeBtn')?.addEventListener('click', openTimeSimulationModal);
    document.getElementById('realTimeBtn')?.addEventListener('click', returnToRealTime);
    document.getElementById('generateReportBtn')?.addEventListener('click', openReportModal);
    document.getElementById('testFirebaseBtn')?.addEventListener('click', testFirebase);
    
    // Input principal (Enter)
    const ticketInput = document.getElementById('newTicketNumber');
    if (ticketInput) {
        ticketInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleNewTicket();
        });
    }
    
    // Modais
    document.getElementById('closeTimeModal')?.addEventListener('click', closeTimeSimulationModal);
    document.getElementById('cancelSimulation')?.addEventListener('click', closeTimeSimulationModal);
    document.getElementById('applySimulation')?.addEventListener('click', applyTimeSimulation);
    
    document.getElementById('closeReportModal')?.addEventListener('click', closeReportModal);
    document.getElementById('cancelReport')?.addEventListener('click', closeReportModal);
    document.getElementById('generateCSV')?.addEventListener('click', generateCSVReport);
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            const input = document.getElementById('newTicketNumber');
            if (input) input.focus();
        }
        if (e.key === 'Escape') closeAllModals();
    });
    
    console.log('✅ Event listeners configurados');
}

function attachCardEvents() {
    // Inputs de atribuição rápida (Enter)
    document.querySelectorAll('.quick-input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const analystId = parseInt(this.getAttribute('data-id'));
                const ticketNumber = this.value.trim();
                
                if (ticketNumber) {
                    assignTicketToAnalyst(analystId, ticketNumber, 'normal');
                    this.value = '';
                }
            }
        });
    });
}

async function handleNewTicket() {
    const ticketInput = document.getElementById('newTicketNumber');
    const typeSelect = document.getElementById('ticketType');
    
    if (!ticketInput || !typeSelect) return;
    
    const ticketNumber = ticketInput.value.trim();
    const ticketType = typeSelect.value;
    
    if (!ticketNumber) {
        showNotification('Digite o número do ticket', 'warning');
        ticketInput.focus();
        return;
    }
    
    if (isTicketAlreadyExists(ticketNumber)) {
        showNotification('Ticket já está em atendimento', 'warning');
        ticketInput.select();
        return;
    }
    
    // Processar ticket especial
    const success = await handleSpecialTicket(ticketNumber, ticketType);
    
    if (success) {
        ticketInput.value = '';
        ticketInput.focus();
    }
}

async function handleSpecialTicket(ticketNumber, ticketType) {
    const specialClient = window.specialClients.find(c => c.client === ticketType);
    if (!specialClient) {
        showNotification('Cliente especial não encontrado', 'error');
        return false;
    }
    
    const analyst = window.analysts.find(a => a.name === specialClient.analyst);
    if (!analyst) {
        showNotification('Analista não encontrado', 'error');
        return false;
    }
    
    if (!analyst.isAvailable) {
        showNotification(`${analyst.name} não está disponível`, 'warning');
        return false;
    }
    
    if (analyst.isBusy && analyst.currentTicket) {
        // Se está aguardando SEU cliente especial, retomar
        if (analyst.ticketStatus === 'aguardando-cliente' && analyst.ticketSpecialType === ticketType) {
            await resumeTicket(analyst.id);
            return true;
        }
        
        showNotification(`${analyst.name} já está em atendimento`, 'warning');
        return false;
    }
    
    // Atribuir ticket especial
    await assignTicketToAnalyst(analyst.id, ticketNumber, ticketType);
    return true;
}

// ============================================
// FUNÇÕES DE CONTROLE
// ============================================

async function freeAllAnalysts() {
    if (!confirm('Liberar TODOS os analistas?\n\nIsso finalizará todos os atendimentos.')) {
        return;
    }
    
    // Finalizar tickets no Firebase
    const promises = window.analysts.map(analyst => {
        if (analyst.currentTicket && window.firebaseAppIntegration && window.firebaseAppIntegration.initialized) {
            return window.firebaseAppIntegration.updateTicketStatus(analyst.currentTicket, 'finalizado', analyst.name);
        }
        return Promise.resolve();
    });
    
    await Promise.all(promises);
    
    // Resetar todos os analistas
    window.analysts.forEach(analyst => {
        analyst.isBusy = false;
        analyst.currentTicket = null;
        analyst.ticketStatus = null;
        analyst.ticketSpecialType = null;
        analyst.isWaitingForClient = false;
        analyst.inQueue = analyst.level === "N1";
        analyst.lastActivity = new Date();
    });
    
    // Resetar contadores
    appState.waitingTicketsToday = 0;
    
    // Atualizar interface
    updateQueueOrder();
    updateStatistics();
    createAnalystStatusColumns();
    updateSpecialCasesDisplay();
    
    // Salvar estado
    await saveState();
    
    showNotification('Todos os analistas foram liberados', 'success');
}

async function resetQueue() {
    if (!confirm('Reiniciar a fila do dia?\n\nIsso irá zerar todos os contadores e liberar analistas.')) {
        return;
    }
    
    // Finalizar tickets no Firebase
    const promises = window.analysts.map(analyst => {
        if (analyst.currentTicket && window.firebaseAppIntegration && window.firebaseAppIntegration.initialized) {
            return window.firebaseAppIntegration.updateTicketStatus(analyst.currentTicket, 'finalizado', analyst.name);
        }
        return Promise.resolve();
    });
    
    await Promise.all(promises);
    
    // Resetar estado
    appState.ticketsToday = 0;
    appState.specialTicketsToday = 0;
    appState.waitingTicketsToday = 0;
    appState.lastReset = new Date().toLocaleDateString('pt-BR');
    appState.queueOrder = [];
    appState.nextTicketNumber = 1000;
    appState.dailyResetDone = true;
    
    // Resetar analistas
    window.analysts.forEach(analyst => {
        analyst.ticketsHandled = 0;
        analyst.isBusy = false;
        analyst.currentTicket = null;
        analyst.ticketStatus = null;
        analyst.ticketSpecialType = null;
        analyst.isWaitingForClient = false;
        analyst.inQueue = analyst.level === "N1";
        analyst.lastActivity = null;
    });
    
    // Atualizar interface
    updateQueueOrder();
    updateStatistics();
    createAnalystStatusColumns();
    updateSpecialCasesDisplay();
    
    // Salvar estado
    await saveState();
    
    showNotification('Fila reiniciada para o novo dia!', 'success');
}

function nextAnalyst() {
    if (appState.queueOrder.length === 0) {
        showNotification('Não há analistas na fila', 'warning');
        return;
    }
    
    // Rotacionar fila
    const first = appState.queueOrder.shift();
    appState.queueOrder.push(first);
    
    updateStatistics();
    showNotification(`Próximo: ${appState.queueOrder[0]?.name || 'Nenhum'}`, 'info');
    saveState(); // Salvar estado
}

// ============================================
// FUNÇÕES DE MODAIS
// ============================================

function openTimeSimulationModal() {
    document.getElementById('timeSimulationModal').style.display = 'flex';
    
    // Adicionar eventos às opções
    document.querySelectorAll('.time-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.time-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function closeTimeSimulationModal() {
    document.getElementById('timeSimulationModal').style.display = 'none';
}

async function applyTimeSimulation() {
    const selected = document.querySelector('.time-option.active');
    if (!selected) {
        showNotification('Selecione um horário', 'warning');
        return;
    }
    
    const hour = parseInt(selected.getAttribute('data-hour'));
    const simulated = new Date();
    simulated.setHours(hour, 0, 0, 0);
    appState.simulatedTime = simulated;
    
    closeTimeSimulationModal();
    updateCurrentTime();
    updateAnalystAvailability();
    createAnalystStatusColumns();
    
    showNotification(`Horário simulado: ${hour}:00`, 'success');
    await saveState();
}

async function returnToRealTime() {
    appState.simulatedTime = null;
    updateCurrentTime();
    updateAnalystAvailability();
    createAnalystStatusColumns();
    
    showNotification('Voltando ao horário real', 'info');
    await saveState();
}

function openReportModal() {
    document.getElementById('reportModal').style.display = 'flex';
    
    // Definir datas padrão (últimos 7 dias)
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate) startDate.value = lastWeek.toISOString().split('T')[0];
    if (endDate) endDate.value = today.toISOString().split('T')[0];
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// ============================================
// FUNÇÕES DE RELATÓRIO
// ============================================

async function generateCSVReport() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    const includeAll = document.getElementById('includeAllTickets')?.checked;
    
    if (!startDate || !endDate) {
        showNotification('Selecione as datas', 'warning');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showNotification('Data inicial maior que final', 'error');
        return;
    }
    
    try {
        showNotification('Gerando relatório...', 'info');
        
        if (!window.firebaseAppIntegration || !window.firebaseAppIntegration.initialized) {
            showNotification('Firebase não disponível', 'error');
            return;
        }
        
        const csvContent = await window.firebaseAppIntegration.generateCSVReport(
            startDate,
            endDate,
            includeAll
        );
        
        if (!csvContent) {
            showNotification('Nenhum dado encontrado', 'warning');
            return;
        }
        
        const filename = `relatorio_${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}.csv`;
        const success = window.firebaseAppIntegration.downloadCSV(csvContent, filename);
        
        if (success) {
            showNotification(`Relatório ${filename} gerado`, 'success');
        } else {
            showNotification('Erro ao gerar relatório', 'error');
        }
        
        closeReportModal();
        
    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error);
        showNotification('Erro: ' + error.message, 'error');
    }
}

// ============================================
// FUNÇÕES DE CONFIGURAÇÃO
// ============================================

function setupAutoSave() {
    // Salvar a cada 30 segundos
    setInterval(async () => {
        try {
            await saveState();
            console.log('💾 Auto-salvamento realizado');
        } catch (error) {
            console.error('❌ Erro no auto-salvamento:', error);
        }
    }, 30000);
}

function setupAutoRefresh() {
    // Atualizar hora a cada segundo
    setInterval(updateCurrentTime, 1000);
    
    // Atualizar disponibilidade a cada minuto
    setInterval(() => {
        updateAnalystAvailability();
        createAnalystStatusColumns();
    }, 60000);
    
    // Atualizar estatísticas a cada 30 segundos
    setInterval(updateStatistics, 30000);
    
    // Atualizar último update a cada 10 segundos
    setInterval(updateLastUpdateTime, 10000);
}

async function testFirebase() {
    showNotification('Testando Firebase...', 'info');
    
    if (!window.firebaseAppIntegration) {
        showNotification('Firebase não carregado', 'error');
        return;
    }
    
    const success = await window.testFirebaseIntegration();
    
    if (success) {
        showNotification('✅ Firebase conectado com sucesso!', 'success');
    } else {
        showNotification('❌ Erro na conexão Firebase', 'error');
    }
}

// ============================================
// FUNÇÕES DE DIAGNÓSTICO E TESTE
// ============================================

window.testPersistence = async function() {
    console.log('🧪 Testando persistência...');
    
    // 1. Verificar estado atual
    console.log('📊 Estado atual:');
    window.analysts.forEach(a => {
        if (a.currentTicket) {
            console.log(`  ${a.name}: ${a.currentTicket} (${a.ticketStatus})`);
        }
    });
    
    // 2. Salvar estado
    await saveState();
    
    // 3. Verificar localStorage
    const saved = localStorage.getItem('queue_state');
    if (!saved) {
        console.error('❌ Nenhum estado salvo no localStorage');
        return false;
    }
    
    const state = JSON.parse(saved);
    const activeTickets = state.analysts?.filter(a => a.currentTicket) || [];
    
    console.log('✅ Estado salvo:', {
        analistas: state.analysts?.length || 0,
        ticketsHoje: state.appState?.ticketsToday || 0,
        ticketsAtivos: activeTickets.length,
        especialHoje: state.appState?.specialTicketsToday || 0
    });
    
    if (activeTickets.length > 0) {
        console.log('📝 Tickets ativos salvos:');
        activeTickets.forEach(a => {
            console.log(`  ${a.name}: ${a.currentTicket}`);
        });
    }
    
    return true;
};

// Log periódico para diagnóstico (opcional)
setInterval(() => {
    const activeTickets = window.analysts.filter(a => a.currentTicket);
    if (activeTickets.length > 0) {
        console.log('🔄 Tickets ativos:', activeTickets.map(a => 
            `${a.name}: ${a.currentTicket}`
        ).join(', '));
    }
}, 60000); // A cada minuto

// ============================================
// EXPORTAÇÃO GLOBAL
// ============================================

window.appController = {
    appState: appState,
    analysts: window.analysts,
    saveState: saveState,
    showNotification: showNotification,
    updateStatistics: updateStatistics,
    createAnalystStatusColumns: createAnalystStatusColumns,
    testPersistence: window.testPersistence
};

console.log('✅ app.js v3.5.0 CORRIGIDO carregado com sucesso');
