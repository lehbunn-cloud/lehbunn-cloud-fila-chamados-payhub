// ============================================
// PORTAL DE FILA DE CHAMADOS - PAYHUB
// ============================================
// app.js - Lógica principal da aplicação
// Versão: 3.3.1
// Data: 2024
// ATUALIZAÇÃO: Sistema unificado com colunas de status e lógica de retorno à fila
// CORREÇÕES: Otimização de renderização para evitar perda de foco nos inputs

// ============================================
// CONFIGURAÇÃO GLOBAL
// ============================================

// Configuração dos analistas
window.analysts = [
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
        ticketsHandled: 0,
        lastActivity: null,
        showInQueueWhenBusy: true,
        isWaitingForClient: false
    },
    { 
        id: 2, 
        name: "Carolina", 
        level: "N1", 
        startTime: 9, 
        endTime: 18, 
        isAvailable: false, 
        isBusy: false,
        currentTicket: null,
        ticketStatus: null,
        specialClient: null,
        inQueue: true,
        ticketsHandled: 0,
        lastActivity: null,
        showInQueueWhenBusy: true,
        isWaitingForClient: false
    },
    { 
        id: 3, 
        name: "Tamiris", 
        level: "N1", 
        startTime: 9, 
        endTime: 18, 
        isAvailable: false, 
        isBusy: false,
        currentTicket: null,
        ticketStatus: null,
        specialClient: null,
        inQueue: true,
        ticketsHandled: 0,
        lastActivity: null,
        showInQueueWhenBusy: true,
        isWaitingForClient: false
    },
    { 
        id: 4, 
        name: "Cristiane", 
        level: "N1", 
        startTime: 9, 
        endTime: 18, 
        isAvailable: false, 
        isBusy: false,
        currentTicket: null,
        ticketStatus: null,
        specialClient: null,
        inQueue: true,
        ticketsHandled: 0,
        lastActivity: null,
        showInQueueWhenBusy: true,
        isWaitingForClient: false
    },
    { 
        id: 5, 
        name: "Jonathan", 
        level: "N1", 
        startTime: 8, 
        endTime: 17, 
        isAvailable: false, 
        isBusy: false,
        currentTicket: null,
        ticketStatus: null,
        specialClient: null,
        inQueue: true,
        ticketsHandled: 0,
        lastActivity: null,
        showInQueueWhenBusy: true,
        isWaitingForClient: false
    },
    { 
        id: 6, 
        name: "Sander", 
        level: "N1", 
        startTime: 14, 
        endTime: 23, 
        isAvailable: false, 
        isBusy: false,
        currentTicket: null,
        ticketStatus: null,
        specialClient: null,
        inQueue: true,
        ticketsHandled: 0,
        lastActivity: null,
        showInQueueWhenBusy: true,
        isWaitingForClient: false
    },
    { 
        id: 7, 
        name: "Yan", 
        level: "N1", 
        startTime: 14, 
        endTime: 23, 
        isAvailable: false, 
        isBusy: false,
        currentTicket: null,
        ticketStatus: null,
        specialClient: null,
        inQueue: true,
        ticketsHandled: 0,
        lastActivity: null,
        showInQueueWhenBusy: true,
        isWaitingForClient: false
    },
    { 
        id: 8, 
        name: "André", 
        level: "N1",
        startTime: 8, 
        endTime: 18, 
        isAvailable: false, 
        isBusy: false,
        currentTicket: null,
        ticketStatus: null,
        specialClient: "Benoit",
        inQueue: true,
        ticketsHandled: 0,
        lastActivity: null,
        showInQueueWhenBusy: true,
        isWaitingForClient: false
    },
    { 
        id: 9, 
        name: "Felipe", 
        level: "N1",
        startTime: 8, 
        endTime: 18, 
        isAvailable: false, 
        isBusy: false,
        currentTicket: null,
        ticketStatus: null,
        specialClient: "DPSP",
        inQueue: true,
        ticketsHandled: 0,
        lastActivity: null,
        showInQueueWhenBusy: true,
        isWaitingForClient: false
    }
];

// Clientes especiais
window.specialClients = [
    { client: "Benoit", analyst: "André", level: "N1" },
    { client: "TIM", analyst: "Eric", level: "N1" },
    { client: "DPSP", analyst: "Felipe", level: "N1" }
];

// Estado da aplicação
let appState = {
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
    isInitialized: false,
    autoRefreshInterval: null,
    focusedInputId: null,
    manualAssignments: [],
    userLoggedIn: false,
    activeInputs: {} // Para rastrear inputs ativos
};

// Cache para melhor performance
let cache = {
    lastUpdate: 0,
    queueHTML: '',
    analystsData: {},
    lastFocus: null
};

// ============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Portal de Fila Payhub v3.3.1...');
    
    // Primeiro: remover o modal de login (temporário para testes)
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'none';
    }
    
    // Habilitar todos os controles (modo de desenvolvimento)
    enableAllControls();
    
    initializeApp();
    setupAutoRefresh();
    setupEventListeners();
    checkSavedState();
});

function initializeApp() {
    try {
        // Inicializar inputs ativos
        appState.activeInputs = {
            newTicketNumber: '',
            quickAssignInputs: {}
        };
        
        updateCurrentTime();
        updateAnalystAvailability();
        updateQueueOrder();
        createAnalystStatusColumns();  // Criar colunas de status
        updateSpecialCasesDisplay();
        updateStatistics();
        updateLastUpdateTime();
        
        checkDailyReset();
        
        appState.isInitialized = true;
        
        console.log('✅ Aplicação v3.3.1 inicializada com sucesso');
        
        // Focar no input principal
        setTimeout(() => {
            const ticketInput = document.getElementById('newTicketNumber');
            if (ticketInput) {
                ticketInput.focus();
                ticketInput.select();
            }
        }, 500);
        
        // Mostrar notificação de inicialização
        setTimeout(() => {
            showNotification('Sistema de fila v3.3.1 carregado', 'success');
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showError('Falha na inicialização do sistema');
    }
}

// ============================================
// FUNÇÃO PRINCIPAL: Criar colunas de status dos analistas
// ============================================

function createAnalystStatusColumns() {
    const container = document.getElementById('analystStatusColumns');
    if (!container) return;
    
    // Salvar estado dos inputs ativos antes de atualizar
    saveActiveInputsState();
    
    // Atualizar status dos analistas primeiro
    updateAnalystStatusFlags();
    
    // Filtrar analistas
    const availableAnalysts = window.analysts.filter(a => 
        a.level === "N1" && 
        a.isAvailable && 
        !a.isBusy && 
        !a.currentTicket &&
        !a.isWaitingForClient
    );
    
    const busyAnalysts = window.analysts.filter(a => 
        a.level === "N1" && 
        a.isAvailable && 
        ((a.isBusy && !a.isWaitingForClient) || (a.currentTicket && !a.isWaitingForClient))
    );
    
    const waitingAnalysts = window.analysts.filter(a => 
        a.level === "N1" && 
        a.isAvailable && 
        a.isWaitingForClient
    );
    
    const offlineAnalysts = window.analysts.filter(a => 
        a.level === "N1" && 
        !a.isAvailable
    );
    
    let html = `
        <div class="analyst-columns">
            <!-- Coluna 1: Analistas Disponíveis -->
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
        html += `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <span>Nenhum analista disponível no momento</span>
            </div>
        `;
    }
    
    html += `
            </div>
            
            <!-- Coluna 2: Analistas em Atendimento -->
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
        html += `
            <div class="empty-state">
                <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
                <span>Todos os analistas estão livres</span>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
        
        <!-- Analistas aguardando cliente (em uma linha separada) -->
        ${waitingAnalysts.length > 0 ? `
        <div style="margin-top: 20px; padding: 15px; background: #FFF3E0; border-radius: 8px; border: 1px solid #FFE0B2;">
            <div class="column-header" style="border-color: #FF9800; color: #FF9800;">
                <i class="fas fa-clock"></i>
                Aguardando Retorno do Cliente
                <span class="analyst-count">${waitingAnalysts.length}</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
        ` : ''}
        
    ${waitingAnalysts.length > 0 ? waitingAnalysts.map(analyst => `
        <div class="waiting-analyst-tag" data-analyst-id="${analyst.id}">
            ${analyst.name}
            <span style="font-size: 10px; color: #666;">
                (${analyst.currentTicket || 'Sem ticket'})
            </span>
            <button class="resume-waiting-btn" data-analyst-id="${analyst.id}" 
                    title="Retomar atendimento" style="margin-left: 8px; padding: 2px 8px; font-size: 10px;">
                <i class="fas fa-play"></i> Retomar
            </button>
        </div>
    `).join('') : ''}
    
    ${waitingAnalysts.length > 0 ? `
            </div>
        </div>
    ` : ''}
    
        <!-- Analistas fora do horário -->
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
            <div class="column-header" style="border-color: #9E9E9E; color: #9E9E9E;">
                <i class="fas fa-clock"></i>
                Fora do Horário
                <span class="analyst-count">${offlineAnalysts.length}</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
    `;
    
    if (offlineAnalysts.length > 0) {
        offlineAnalysts.forEach(analyst => {
            html += `
                <div class="offline-analyst-tag">
                    ${analyst.name}
                    <span style="font-size: 10px; color: #999;">
                        (${analyst.startTime}h-${analyst.endTime}h)
                    </span>
                </div>
            `;
        });
    } else {
        html += `<div style="color: #666; font-size: 13px;">Todos os analistas estão no horário</div>`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    // Atualizar o container
    container.innerHTML = html;
    
    // Restaurar estado dos inputs
    restoreActiveInputsState();
    
    // Anexar eventos aos botões
    attachAnalystCardEvents();
}

// ============================================
// FUNÇÃO: Criar card de analista para colunas
// ============================================

function createAnalystCardHTML(analyst, status) {
    let statusText = '';
    let statusClass = '';
    let ticketInfo = '';
    let quickAssignHTML = '';
    
    // Recuperar valor do input se existir
    const savedInputValue = appState.activeInputs.quickAssignInputs[analyst.id] || '';
    
    if (status === 'available') {
        statusText = 'DISPONÍVEL';
        statusClass = 'available';
        
        // Input para atribuição rápida
        quickAssignHTML = `
            <div class="quick-assign-input">
                <input type="text" 
                       class="quick-ticket-input" 
                       data-analyst-id="${analyst.id}"
                       placeholder="Nº chamado"
                       value="${savedInputValue}"
                       style="width: 120px; padding: 4px 8px; font-size: 12px;">
                <button class="assign-quick-btn" data-analyst-id="${analyst.id}" 
                        title="Atribuir chamado">
                    <i class="fas fa-paperclip"></i> Atribuir
                </button>
            </div>
        `;
    } else if (status === 'busy') {
        statusText = 'EM ATENDIMENTO';
        statusClass = 'busy';
        
        if (analyst.currentTicket) {
            const isSpecial = analyst.ticketSpecialType ? ` (${analyst.ticketSpecialType})` : '';
            ticketInfo = `
                <div class="ticket-info-compact">
                    <div style="font-weight: 600; color: #333; font-size: 12px;">
                        <i class="fas fa-ticket-alt"></i> ${analyst.currentTicket}${isSpecial}
                    </div>
                    <div style="margin-top: 4px;">
                        <button class="status-btn-small waiting" data-analyst-id="${analyst.id}" 
                                title="Aguardar retorno do cliente">
                            <i class="fas fa-clock"></i> Aguardar
                        </button>
                        <button class="status-btn-small finish" data-analyst-id="${analyst.id}" 
                                title="Finalizar chamado">
                            <i class="fas fa-check"></i> Finalizar
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    return `
        <div class="analyst-card-column" data-analyst-id="${analyst.id}">
            <div class="analyst-header-column">
                <div class="analyst-name-column">
                    ${analyst.name}
                    <span class="analyst-level-column">${analyst.level}</span>
                    ${analyst.specialClient ? `<span class="special-client-badge-small">${analyst.specialClient}</span>` : ''}
                </div>
                <div class="analyst-schedule-column">
                    <i class="far fa-clock"></i> ${analyst.startTime}h-${analyst.endTime}h
                </div>
            </div>
            
            ${ticketInfo}
            
            <div class="analyst-status-column">
                <div class="status-indicator-column">
                    <span class="status-dot-column ${statusClass}"></span>
                    <span class="status-text-column">${statusText}</span>
                </div>
                <div class="tickets-count-column">
                    <small style="color: #666;">${analyst.ticketsHandled} chamados hoje</small>
                </div>
            </div>
            
            ${quickAssignHTML}
        </div>
    `;
}

// ============================================
// FUNÇÃO: Atualizar flags de status dos analistas
// ============================================

function updateAnalystStatusFlags() {
    const now = appState.simulatedTime ? new Date(appState.simulatedTime) : new Date();
    const currentHour = now.getHours();
    const currentTime = currentHour + now.getMinutes() / 100;
    
    window.analysts.forEach(analyst => {
        // Atualizar disponibilidade baseada no horário
        analyst.isAvailable = (currentTime >= analyst.startTime && currentTime < analyst.endTime);
        
        // Atualizar status de ocupação
        if (analyst.ticketStatus === 'aguardando-cliente') {
            analyst.isBusy = false;
            analyst.isWaitingForClient = true;
            analyst.inQueue = true; // Retorna à fila quando aguardando
        } else if (analyst.ticketStatus === 'atendendo' || analyst.currentTicket) {
            analyst.isBusy = true;
            analyst.isWaitingForClient = false;
            analyst.inQueue = false; // Sai da fila quando atendendo
        } else {
            analyst.isBusy = false;
            analyst.isWaitingForClient = false;
            analyst.inQueue = analyst.level === "N1"; // Entra na fila se for N1
        }
    });
}

// ============================================
// FUNÇÃO: Salvar estado dos inputs ativos
// ============================================

function saveActiveInputsState() {
    const mainInput = document.getElementById('newTicketNumber');
    if (mainInput) {
        appState.activeInputs.newTicketNumber = mainInput.value;
    }
    
    // Salvar valores dos inputs de atribuição rápida
    document.querySelectorAll('.quick-ticket-input').forEach(input => {
        const analystId = input.getAttribute('data-analyst-id');
        if (analystId) {
            appState.activeInputs.quickAssignInputs[analystId] = input.value;
        }
    });
    
    // Salvar elemento com foco
    if (document.activeElement) {
        const activeId = document.activeElement.id;
        const dataId = document.activeElement.getAttribute('data-analyst-id');
        if (activeId) {
            appState.activeInputs.lastFocus = { type: 'id', value: activeId };
        } else if (dataId) {
            appState.activeInputs.lastFocus = { type: 'data', value: dataId };
        }
    }
}

// ============================================
// FUNÇÃO: Restaurar estado dos inputs ativos
// ============================================

function restoreActiveInputsState() {
    // Restaurar input principal
    const mainInput = document.getElementById('newTicketNumber');
    if (mainInput && appState.activeInputs.newTicketNumber !== undefined) {
        mainInput.value = appState.activeInputs.newTicketNumber;
    }
    
    // Restaurar inputs de atribuição rápida
    setTimeout(() => {
        document.querySelectorAll('.quick-ticket-input').forEach(input => {
            const analystId = input.getAttribute('data-analyst-id');
            if (analystId && appState.activeInputs.quickAssignInputs[analystId] !== undefined) {
                input.value = appState.activeInputs.quickAssignInputs[analystId];
            }
        });
        
        // Restaurar foco se necessário
        restoreFocus();
    }, 10);
}

// ============================================
// FUNÇÃO: Restaurar foco do cursor
// ============================================

function restoreFocus() {
    if (!appState.activeInputs.lastFocus) return;
    
    setTimeout(() => {
        const focusInfo = appState.activeInputs.lastFocus;
        
        if (focusInfo.type === 'id') {
            const element = document.getElementById(focusInfo.value);
            if (element) {
                element.focus();
                if (element.type === 'text' || element.type === 'number') {
                    element.setSelectionRange(element.value.length, element.value.length);
                }
            }
        } else if (focusInfo.type === 'data') {
            const element = document.querySelector(`[data-analyst-id="${focusInfo.value}"]`);
            if (element) {
                const input = element.querySelector('input');
                if (input) {
                    input.focus();
                    input.setSelectionRange(input.value.length, input.value.length);
                }
            }
        }
    }, 50);
}

// ============================================
// FUNÇÃO: Anexar eventos aos cards dos analistas
// ============================================

function attachAnalystCardEvents() {
    // Botões de atribuição rápida
    document.querySelectorAll('.assign-quick-btn').forEach(button => {
        button.addEventListener('click', function() {
            const analystId = parseInt(this.getAttribute('data-analyst-id'));
            const input = document.querySelector(`.quick-ticket-input[data-analyst-id="${analystId}"]`);
            const ticketNumber = input?.value.trim();
            
            if (ticketNumber) {
                quickAssignTicket(analystId, ticketNumber);
                if (input) input.value = '';
                appState.activeInputs.quickAssignInputs[analystId] = '';
            } else {
                showNotification('Digite o número do chamado', 'warning');
                if (input) {
                    input.focus();
                    input.select();
                }
            }
        });
    });
    
    // Inputs de atribuição rápida (tecla Enter)
    document.querySelectorAll('.quick-ticket-input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const analystId = parseInt(this.getAttribute('data-analyst-id'));
                const ticketNumber = this.value.trim();
                
                if (ticketNumber) {
                    quickAssignTicket(analystId, ticketNumber);
                    this.value = '';
                    appState.activeInputs.quickAssignInputs[analystId] = '';
                } else {
                    showNotification('Digite o número do chamado', 'warning');
                    this.focus();
                    this.select();
                }
            }
        });
        
        // Salvar valor ao digitar
        input.addEventListener('input', function() {
            const analystId = this.getAttribute('data-analyst-id');
            if (analystId) {
                appState.activeInputs.quickAssignInputs[analystId] = this.value;
            }
        });
    });
    
    // Botões de aguardar cliente
    document.querySelectorAll('.status-btn-small.waiting').forEach(button => {
        button.addEventListener('click', function() {
            const analystId = parseInt(this.getAttribute('data-analyst-id'));
            setTicketWaiting(analystId);
        });
    });
    
    // Botões de finalizar chamado
    document.querySelectorAll('.status-btn-small.finish').forEach(button => {
        button.addEventListener('click', function() {
            const analystId = parseInt(this.getAttribute('data-analyst-id'));
            finishTicket(analystId);
        });
    });
    
    // Botões de retomar (analistas aguardando)
    document.querySelectorAll('.resume-waiting-btn').forEach(button => {
        button.addEventListener('click', function() {
            const analystId = parseInt(this.getAttribute('data-analyst-id'));
            resumeTicket(analystId);
        });
    });
}

// ============================================
// FUNÇÃO: Atribuição rápida de chamado
// ============================================

function quickAssignTicket(analystId, ticketNumber) {
    const analyst = window.analysts.find(a => a.id === analystId);
    
    if (!analyst) {
        showNotification('Analista não encontrado', 'error');
        return;
    }
    
    if (!analyst.isAvailable) {
        showNotification(`${analyst.name} não está disponível no momento`, 'warning');
        return;
    }
    
    if (analyst.isBusy || analyst.currentTicket) {
        showNotification(`${analyst.name} já está em atendimento`, 'warning');
        return;
    }
    
    if (isTicketAlreadyExists(ticketNumber)) {
        showNotification(`Chamado ${ticketNumber} já está em atendimento`, 'warning');
        return;
    }
    
    // Verificar se é cliente especial deste analista
    if (analyst.specialClient && isSpecialClientTicket(ticketNumber, analyst.specialClient)) {
        assignTicketToAnalyst(analystId, ticketNumber, analyst.specialClient, 'atendendo');
        showNotification(`Chamado especial ${ticketNumber} atribuído a ${analyst.name}`, 'success');
    } else {
        assignTicketToAnalyst(analystId, ticketNumber, 'normal', 'atendendo');
        showNotification(`Chamado ${ticketNumber} atribuído a ${analyst.name}`, 'success');
    }
}

// ============================================
// FUNÇÃO: Atribuir chamado a analista
// ============================================

function assignTicketToAnalyst(analystId, ticketNumber, ticketType, ticketStatus = 'atendendo') {
    const analyst = window.analysts.find(a => a.id === analystId);
    
    if (!analyst) {
        console.error(`Analista com ID ${analystId} não encontrado`);
        return;
    }
    
    // Verificar se o analista está atendendo SEU cliente especial
    const isThisAnalystSpecialClient = analyst.specialClient && 
                                      isSpecialClientTicket(ticketNumber, analyst.specialClient);
    
    // Verificar se já está atendendo outro cliente especial
    if (analyst.currentTicket && analyst.ticketSpecialType && analyst.ticketSpecialType !== ticketType) {
        if (isThisAnalystSpecialClient) {
            // É seu cliente especial - tem prioridade
            showNotification(`${analyst.name} está atendendo outro cliente. Finalize primeiro.`, 'warning');
            return;
        } else {
            // É cliente normal, mas analista está com especial - não pode atender
            showNotification(`${analyst.name} está com cliente especial ${analyst.ticketSpecialType}`, 'warning');
            return;
        }
    }
    
    analyst.isBusy = true;
    analyst.isWaitingForClient = false;
    analyst.inQueue = false; // Sai da fila quando atendendo
    
    if (ticketType !== 'normal' || isThisAnalystSpecialClient) {
        // É um cliente especial
        analyst.currentTicket = ticketNumber;
        analyst.ticketSpecialType = ticketType;
        
        // Registrar como ticket especial
        if (ticketType !== 'normal') {
            appState.specialTicketsToday++;
        }
    } else {
        // É um chamado normal
        analyst.currentTicket = ticketNumber;
        analyst.ticketSpecialType = null;
    }
    
    analyst.ticketStatus = ticketStatus;
    analyst.lastActivity = new Date();
    analyst.ticketsHandled++;
    
    // Atualizar contador de tickets
    if (ticketType === 'normal' && !isThisAnalystSpecialClient) {
        appState.ticketsToday++;
    }
    
    // Atualizar interface de forma otimizada
    updateStatistics();
    updateSpecialCasesDisplay();
    
    // Atualizar apenas os cards afetados
    updateAnalystCard(analystId);
    
    // Salvar no Firebase se disponível
    if (window.firebaseAppIntegration?.saveTicketToFirebase) {
        window.firebaseAppIntegration.saveTicketToFirebase(ticketNumber, analyst.name, ticketStatus === 'atendendo' ? 'iniciado' : 'aguardando');
    }
    
    // Salvar localmente
    saveStateToLocalStorage();
}

// ============================================
// FUNÇÃO: Atualizar card específico do analista
// ============================================

function updateAnalystCard(analystId) {
    const analyst = window.analysts.find(a => a.id === analystId);
    if (!analyst) return;
    
    // Determinar status do analista
    let status = '';
    if (analyst.isWaitingForClient) {
        status = 'waiting';
    } else if (analyst.isBusy || analyst.currentTicket) {
        status = 'busy';
    } else if (analyst.isAvailable) {
        status = 'available';
    } else {
        return; // Offline - não precisa atualizar
    }
    
    // Encontrar e atualizar o card
    const cardElement = document.querySelector(`.analyst-card-column[data-analyst-id="${analystId}"]`);
    if (cardElement) {
        // Substituir apenas este card
        const parent = cardElement.parentElement;
        if (parent) {
            const newCardHTML = createAnalystCardHTML(analyst, status);
            cardElement.outerHTML = newCardHTML;
            
            // Reanexar eventos
            setTimeout(() => {
                attachAnalystCardEvents();
            }, 10);
        }
    }
}

// ============================================
// FUNÇÃO: Finalizar chamado
// ============================================

function finishTicket(analystId) {
    const analyst = window.analysts.find(a => a.id === analystId);
    
    if (!analyst) return;
    
    const ticketNumber = analyst.currentTicket;
    const wasSpecialClient = analyst.ticketSpecialType;
    
    // Salvar histórico antes de limpar
    if (ticketNumber && window.firebaseAppIntegration?.saveTicketToFirebase) {
        window.firebaseAppIntegration.saveTicketToFirebase(ticketNumber, analyst.name, 'finalizado');
    }
    
    // Finalizar o chamado
    analyst.isBusy = false;
    analyst.isWaitingForClient = false;
    analyst.currentTicket = null;
    analyst.ticketStatus = null;
    analyst.ticketSpecialType = null;
    analyst.lastActivity = null;
    analyst.inQueue = analyst.level === "N1"; // Retorna à fila se for N1
    
    updateQueueOrder();
    updateStatistics();
    updateSpecialCasesDisplay();
    
    // Atualizar card do analista
    updateAnalystCard(analystId);
    
    const clientType = wasSpecialClient ? ` (cliente ${wasSpecialClient})` : '';
    showNotification(`Chamado ${ticketNumber || 'desconhecido'}${clientType} finalizado por ${analyst.name}`, 'success');
    saveStateToLocalStorage();
}

// ============================================
// FUNÇÃO: Colocar chamado em espera
// ============================================

function setTicketWaiting(analystId) {
    const analyst = window.analysts.find(a => a.id === analystId);
    
    if (!analyst) return;
    
    // Colocar em estado de espera
    analyst.ticketStatus = 'aguardando-cliente';
    analyst.isBusy = false;
    analyst.isWaitingForClient = true;
    analyst.inQueue = true; // Retorna ao final da fila
    analyst.lastActivity = new Date();
    
    updateQueueOrder();
    updateStatistics();
    updateSpecialCasesDisplay();
    
    // Atualizar card do analista
    updateAnalystCard(analystId);
    
    const clientType = analyst.ticketSpecialType ? ` (cliente ${analyst.ticketSpecialType})` : '';
    showNotification(`${analyst.name} está aguardando retorno do cliente${clientType}. Retornou ao final da fila.`, 'info');
    saveStateToLocalStorage();
}

// ============================================
// FUNÇÃO: Retomar chamado em espera
// ============================================

function resumeTicket(analystId) {
    const analyst = window.analysts.find(a => a.id === analystId);
    
    if (!analyst) return;
    
    // Retomar atendimento
    analyst.ticketStatus = 'atendendo';
    analyst.isBusy = true;
    analyst.isWaitingForClient = false;
    analyst.inQueue = false; // Sai da fila novamente
    analyst.lastActivity = new Date();
    
    updateQueueOrder();
    updateStatistics();
    updateSpecialCasesDisplay();
    
    // Atualizar card do analista
    updateAnalystCard(analystId);
    
    const clientType = analyst.ticketSpecialType ? ` (cliente ${analyst.ticketSpecialType})` : '';
    showNotification(`${analyst.name} retomou o atendimento${clientType}`, 'success');
    saveStateToLocalStorage();
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function isSpecialClientTicket(ticketNumber, specialClientName) {
    if (!ticketNumber || !specialClientName) return false;
    
    // Verifica se o ticket contém o nome do cliente especial
    return ticketNumber.toString().toUpperCase().includes(specialClientName.toUpperCase());
}

function isTicketAlreadyExists(ticketNumber) {
    return window.analysts.some(analyst => 
        analyst.currentTicket === ticketNumber
    );
}

// ============================================
// FUNÇÃO: Atualizar ordem da fila
// ============================================

function updateQueueOrder() {
    // Analistas que devem estar na fila:
    // 1. N1, disponíveis, não ocupados, na fila
    // 2. N1, disponíveis, aguardando cliente (vão para o final)
    const queueEligibleAnalysts = window.analysts.filter(a => 
        a.level === "N1" &&
        a.isAvailable && 
        ((!a.isBusy && a.inQueue) || a.isWaitingForClient)
    );
    
    if (queueEligibleAnalysts.length === 0) {
        appState.queueOrder = [];
        appState.currentAnalystIndex = 0;
        return;
    }
    
    // Ordenar: primeiro os não ocupados, depois os aguardando
    // Dentro de cada grupo, ordenar por ticketsHandled e ID
    appState.queueOrder = [...queueEligibleAnalysts].sort((a, b) => {
        // Primeiro: não aguardando vs aguardando
        if (!a.isWaitingForClient && b.isWaitingForClient) return -1;
        if (a.isWaitingForClient && !b.isWaitingForClient) return 1;
        
        // Segundo: menos tickets vs mais tickets
        if (a.ticketsHandled !== b.ticketsHandled) {
            return a.ticketsHandled - b.ticketsHandled;
        }
        
        // Terceiro: ID
        return a.id - b.id;
    });
    
    if (appState.currentAnalystIndex >= appState.queueOrder.length) {
        appState.currentAnalystIndex = 0;
    }
}

// ============================================
// FUNÇÃO: Atualizar casos especiais
// ============================================

function updateSpecialCasesDisplay() {
    const specialCasesDiv = document.getElementById('specialCases');
    if (!specialCasesDiv) return;
    
    let specialCasesHTML = '';
    
    window.specialClients.forEach(special => {
        const analyst = window.analysts.find(a => a.name === special.analyst);
        
        let statusText = 'INDISPONÍVEL';
        let statusClass = 'status-offline';
        let currentTask = '';
        
        if (analyst && analyst.isAvailable) {
            if (analyst.currentTicket && analyst.ticketSpecialType === special.client) {
                // Está atendendo SEU cliente especial
                if (analyst.ticketStatus === 'aguardando-cliente') {
                    statusText = 'AGUARDANDO';
                    statusClass = 'status-waiting';
                    currentTask = `Aguardando retorno do cliente ${special.client}`;
                } else {
                    statusText = 'ATENDENDO';
                    statusClass = 'status-busy';
                    currentTask = `Atendendo chamado ${analyst.currentTicket}`;
                }
            } else if (analyst.currentTicket && analyst.ticketSpecialType !== special.client) {
                // Está atendendo, mas NÃO é seu cliente especial
                statusText = 'OCUPADO';
                statusClass = 'status-busy';
                currentTask = `Atendendo chamado normal ${analyst.currentTicket}`;
            } else if (!analyst.isBusy) {
                // Disponível para atender cliente especial
                statusText = 'DISPONÍVEL';
                statusClass = 'status-available';
                currentTask = 'Pronto para atender cliente especial';
            }
        }
        
        specialCasesHTML += `
            <div class="special-client">
                <div class="client-info">
                    <div class="client-name">Cliente ${special.client}</div>
                    <div class="client-description">
                        Analista dedicado: ${special.analyst} (${special.level})
                    </div>
                </div>
                <div>
                    <div class="status-container">
                        <div class="status-indicator">
                            <span class="status-dot ${statusClass}"></span>
                            <span class="status-text">${statusText}</span>
                        </div>
                        ${currentTask ? `
                            <div class="current-task-info">
                                <i class="fas fa-tasks"></i> ${currentTask}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    specialCasesDiv.innerHTML = specialCasesHTML;
}

// ============================================
// FUNÇÃO: Processar novo chamado especial
// ============================================

function handleSpecialTicket(ticketNumber, ticketType) {
    const specialClient = window.specialClients.find(c => c.client === ticketType);
    
    if (!specialClient) {
        showNotification(`Cliente especial ${ticketType} não encontrado!`, 'error');
        return false;
    }
    
    const analyst = window.analysts.find(a => a.name === specialClient.analyst);
    
    if (!analyst) {
        showNotification(`Analista ${specialClient.analyst} não encontrado!`, 'error');
        return false;
    }
    
    // Verificar se o analista está disponível
    if (!analyst.isAvailable) {
        showNotification(`${analyst.name} não está disponível (fora do horário)!`, 'warning');
        return false;
    }
    
    // Se está aguardando cliente especial, retomar
    if (analyst.ticketStatus === 'aguardando-cliente' && analyst.ticketSpecialType === ticketType) {
        resumeTicket(analyst.id);
        showNotification(`${analyst.name} retomou atendimento do cliente ${specialClient.client}`, 'success');
        return true;
    }
    
    // Se já está atendendo este cliente especial
    if (analyst.currentTicket && analyst.ticketSpecialType === ticketType) {
        showNotification(`${analyst.name} já está atendendo cliente ${specialClient.client}`, 'info');
        return false;
    }
    
    // Se está ocupado com outro chamado
    if (analyst.isBusy) {
        showNotification(`${analyst.name} está ocupado com outro atendimento!`, 'warning');
        return false;
    }
    
    // Atribuir o chamado especial
    assignTicketToAnalyst(analyst.id, ticketNumber, ticketType, 'atendendo');
    
    showNotification(`Chamado especial ${ticketNumber} (${specialClient.client}) atribuído a ${analyst.name}`, 'success');
    return true;
}

// ============================================
// FUNÇÕES DE ATUALIZAÇÃO DE INTERFACE
// ============================================

function setupAutoRefresh() {
    if (appState.autoRefreshInterval) {
        clearInterval(appState.autoRefreshInterval);
    }
    
    // Atualização mais inteligente - apenas o necessário
    appState.autoRefreshInterval = setInterval(() => {
        updateCurrentTime();
        updateStatistics();
    }, 30000); // 30 segundos
    
    // Atualização do relógio
    setInterval(() => {
        updateCurrentTime();
    }, 1000);
}

function setupEventListeners() {
    try {
        // Botões principais
        document.getElementById('addTicketBtn').addEventListener('click', handleNewTicket);
        document.getElementById('nextAnalystBtn').addEventListener('click', nextAnalyst);
        document.getElementById('resetQueueBtn').addEventListener('click', resetQueue);
        document.getElementById('freeAllBtn').addEventListener('click', freeAllAnalysts);
        document.getElementById('simulateTimeBtn').addEventListener('click', openTimeSimulationModal);
        document.getElementById('realTimeBtn').addEventListener('click', returnToRealTime);
        
        // Modais
        document.getElementById('closeTimeModal').addEventListener('click', closeTimeSimulationModal);
        document.getElementById('cancelSimulation').addEventListener('click', closeTimeSimulationModal);
        document.getElementById('applySimulation').addEventListener('click', applyTimeSimulation);
        
        document.getElementById('generateReportBtn').addEventListener('click', openReportModal);
        document.getElementById('closeReportModal').addEventListener('click', closeReportModal);
        document.getElementById('cancelReport').addEventListener('click', closeReportModal);
        document.getElementById('generateCSV').addEventListener('click', generateCSVReport);
        
        // Input principal (Enter)
        const ticketNumberInput = document.getElementById('newTicketNumber');
        if (ticketNumberInput) {
            ticketNumberInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNewTicket();
                }
            });
            
            // Salvar valor ao digitar
            ticketNumberInput.addEventListener('input', function() {
                appState.activeInputs.newTicketNumber = this.value;
            });
        }
        
        // Atalhos de teclado
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                const input = document.getElementById('newTicketNumber');
                if (input) {
                    input.focus();
                    input.select();
                }
            }
            
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                freeAllAnalysts();
            }
            
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                resetQueue();
            }
            
            if (e.key === 'Escape') {
                closeAllModals();
            }
        });
        
        console.log('✅ Event listeners configurados');
        
    } catch (error) {
        console.error('❌ Erro ao configurar event listeners:', error);
    }
}

function handleNewTicket() {
    try {
        const ticketNumberInput = document.getElementById('newTicketNumber');
        const ticketTypeSelect = document.getElementById('ticketType');
        
        if (!ticketNumberInput || !ticketTypeSelect) {
            showNotification('Erro: campo não encontrado', 'error');
            return;
        }
        
        let ticketNumber = ticketNumberInput.value.trim();
        const ticketType = ticketTypeSelect.value;
        
        if (!ticketNumber) {
            showNotification('Digite o número do chamado', 'warning');
            ticketNumberInput.focus();
            return;
        }
        
        if (isTicketAlreadyExists(ticketNumber)) {
            showNotification(`Chamado ${ticketNumber} já está em atendimento`, 'warning');
            ticketNumberInput.focus();
            ticketNumberInput.select();
            return;
        }
        
        const success = handleSpecialTicket(ticketNumber, ticketType);
        
        if (success) {
            ticketNumberInput.value = '';
            appState.activeInputs.newTicketNumber = '';
            setTimeout(() => {
                ticketNumberInput.focus();
            }, 10);
        }
        
        saveStateToLocalStorage();
        
    } catch (error) {
        console.error('❌ Erro em handleNewTicket:', error);
        showNotification('Erro ao processar chamado', 'error');
    }
}

function updateCurrentTime() {
    try {
        const now = appState.simulatedTime ? new Date(appState.simulatedTime) : new Date();
        
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('pt-BR', dateOptions);
        const timeString = now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        document.getElementById('currentDate').textContent = dateString;
        document.getElementById('currentTime').textContent = timeString;
        
        // Atualizar indicador de simulação
        const simulationIndicator = document.getElementById('simulationIndicator');
        const realTimeBtn = document.getElementById('realTimeBtn');
        
        if (appState.simulatedTime) {
            if (simulationIndicator) simulationIndicator.style.display = 'inline-flex';
            if (realTimeBtn) realTimeBtn.style.display = 'inline-flex';
        } else {
            if (simulationIndicator) simulationIndicator.style.display = 'none';
            if (realTimeBtn) realTimeBtn.style.display = 'none';
        }
        
        // Atualizar disponibilidade dos analistas sem recriar toda a interface
        const needsRefresh = updateAnalystAvailability();
        
        // Apenas recriar colunas se realmente necessário
        if (needsRefresh) {
            createAnalystStatusColumns();
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar hora:', error);
    }
}

function updateAnalystAvailability() {
    const now = appState.simulatedTime ? new Date(appState.simulatedTime) : new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes / 100;
    
    let needsRefresh = false;
    const previousStates = window.analysts.map(a => ({
        id: a.id,
        isAvailable: a.isAvailable,
        isBusy: a.isBusy
    }));
    
    window.analysts.forEach(analyst => {
        const startTime = analyst.startTime;
        const endTime = analyst.endTime;
        
        // Atualizar disponibilidade baseada no horário
        const newAvailability = (currentTime >= startTime && currentTime < endTime);
        
        if (analyst.isAvailable !== newAvailability) {
            analyst.isAvailable = newAvailability;
            needsRefresh = true;
        }
        
        // Se saiu do horário, liberar qualquer atendimento
        if (!analyst.isAvailable && (analyst.isBusy || analyst.currentTicket)) {
            analyst.isBusy = false;
            analyst.currentTicket = null;
            analyst.ticketStatus = null;
            analyst.ticketSpecialType = null;
            analyst.isWaitingForClient = false;
            analyst.inQueue = false;
            needsRefresh = true;
        }
    });
    
    // Atualizar interface se necessário
    if (needsRefresh) {
        updateQueueOrder();
        updateStatistics();
        updateSpecialCasesDisplay();
        saveStateToLocalStorage();
    }
    
    return needsRefresh;
}

function updateStatistics() {
    // Chamados hoje
    updateElementText('totalTickets', appState.ticketsToday);
    
    // Analistas disponíveis
    const availableAnalysts = window.analysts.filter(a => 
        a.isAvailable && !a.isBusy && !a.currentTicket
    ).length;
    updateElementText('availableAnalystsStat', availableAnalysts);
    
    // Próximo na fila
    let nextInQueue = '-';
    if (appState.queueOrder.length > 0) {
        nextInQueue = appState.queueOrder[0]?.name || '-';
    }
    updateElementText('nextInQueue', nextInQueue);
    
    // Casos especiais
    updateElementText('specialTickets', appState.specialTicketsToday);
    
    // Aguardando cliente
    const waitingTickets = window.analysts.filter(a => 
        a.ticketStatus === 'aguardando-cliente'
    ).length;
    updateElementText('waitingTickets', waitingTickets);
    appState.waitingTicketsToday = waitingTickets;
    
    // Último reset
    updateElementText('lastResetDate', appState.lastReset);
}

function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

function updateLastUpdateTime() {
    appState.lastUpdate = new Date().toLocaleTimeString('pt-BR');
    updateElementText('lastUpdate', appState.lastUpdate);
}

// ============================================
// FUNÇÕES DE CONTROLE DA FILA
// ============================================

function nextAnalyst() {
    if (appState.queueOrder.length === 0) {
        showNotification('Não há analistas na fila!', 'warning');
        return;
    }
    
    // Salvar estado dos inputs antes de atualizar
    saveActiveInputsState();
    
    // Mover o primeiro para o final
    appState.queueOrder.push(appState.queueOrder.shift());
    
    updateStatistics();
    
    const currentAnalyst = appState.queueOrder[0];
    showNotification(`Próximo analista: ${currentAnalyst?.name || 'Nenhum'}`, 'info');
    
    saveStateToLocalStorage();
    
    // Restaurar foco
    setTimeout(restoreFocus, 100);
}

function resetQueue() {
    if (!confirm('Tem certeza que deseja reiniciar a fila do dia?\n\nIsso irá:\n• Zerar todos os contadores\n• Liberar todos os analistas\n• Reiniciar a ordem da fila')) {
        return;
    }
    
    appState.currentAnalystIndex = 0;
    appState.queueOrder = [];
    appState.lastReset = new Date().toLocaleDateString('pt-BR');
    appState.dailyResetDone = false;
    appState.manualAssignments = [];
    
    window.analysts.forEach(analyst => {
        analyst.ticketsHandled = 0;
        analyst.isBusy = false;
        analyst.currentTicket = null;
        analyst.ticketStatus = null;
        analyst.ticketSpecialType = null;
        analyst.lastActivity = null;
        analyst.inQueue = analyst.level === "N1";
        analyst.isWaitingForClient = false;
    });
    
    appState.ticketsToday = 0;
    appState.specialTicketsToday = 0;
    appState.waitingTicketsToday = 0;
    appState.nextTicketNumber = 1000;
    
    updateQueueOrder();
    updateStatistics();
    createAnalystStatusColumns();
    updateSpecialCasesDisplay();
    
    showNotification('Fila reiniciada para o novo dia!', 'success');
    saveStateToLocalStorage();
}

function freeAllAnalysts() {
    if (!confirm('Liberar TODOS os analistas?\n\nIsso irá finalizar todos os atendimentos em andamento.')) {
        return;
    }
    
    // Salvar estado dos inputs
    saveActiveInputsState();
    
    let freedCount = 0;
    
    window.analysts.forEach(analyst => {
        if (analyst.isBusy || analyst.currentTicket) {
            analyst.isBusy = false;
            analyst.currentTicket = null;
            analyst.ticketStatus = null;
            analyst.ticketSpecialType = null;
            analyst.lastActivity = null;
            analyst.inQueue = analyst.level === "N1";
            analyst.isWaitingForClient = false;
            freedCount++;
        }
    });
    
    updateQueueOrder();
    updateStatistics();
    createAnalystStatusColumns();
    updateSpecialCasesDisplay();
    
    showNotification(`${freedCount} analistas liberados`, 'success');
    saveStateToLocalStorage();
    
    // Restaurar foco
    setTimeout(restoreFocus, 100);
}

function checkDailyReset() {
    const now = new Date();
    const today = now.toLocaleDateString('pt-BR');
    
    if (today !== appState.lastReset && !appState.dailyResetDone) {
        resetQueue();
        appState.dailyResetDone = true;
    }
}

// ============================================
// FUNÇÕES DE MODAIS
// ============================================

function openTimeSimulationModal() {
    saveActiveInputsState();
    document.getElementById('timeSimulationModal').style.display = 'flex';
}

function closeTimeSimulationModal() {
    document.getElementById('timeSimulationModal').style.display = 'none';
    setTimeout(restoreFocus, 100);
}

function applyTimeSimulation() {
    const selectedButton = document.querySelector('.time-option.active');
    
    if (!selectedButton) {
        showNotification('Selecione um horário para simular', 'warning');
        return;
    }
    
    const hour = parseInt(selectedButton.getAttribute('data-hour'));
    const simulatedDate = new Date();
    simulatedDate.setHours(hour, 0, 0, 0);
    appState.simulatedTime = simulatedDate;
    
    closeTimeSimulationModal();
    updateCurrentTime();
    
    showNotification(`Horário simulado: ${hour}:00`, 'success');
    saveStateToLocalStorage();
}

function returnToRealTime() {
    appState.simulatedTime = null;
    updateCurrentTime();
    showNotification('Voltando ao horário real', 'info');
    saveStateToLocalStorage();
}

function openReportModal() {
    saveActiveInputsState();
    document.getElementById('reportModal').style.display = 'flex';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    setTimeout(restoreFocus, 100);
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    setTimeout(restoreFocus, 100);
}

// ============================================
// FUNÇÕES DE NOTIFICAÇÃO
// ============================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function showError(message) {
    showNotification(message, 'error');
}

// ============================================
// FUNÇÕES DE PERSISTÊNCIA
// ============================================

function saveStateToLocalStorage() {
    try {
        const stateToSave = {
            ...appState,
            simulatedTime: appState.simulatedTime ? appState.simulatedTime.getTime() : null,
            analysts: window.analysts.map(a => ({
                id: a.id,
                ticketsHandled: a.ticketsHandled,
                isBusy: a.isBusy,
                currentTicket: a.currentTicket,
                ticketStatus: a.ticketStatus,
                ticketSpecialType: a.ticketSpecialType,
                inQueue: a.inQueue,
                lastActivity: a.lastActivity,
                isWaitingForClient: a.isWaitingForClient
            }))
        };
        
        localStorage.setItem('queuePortalState', JSON.stringify(stateToSave));
    } catch (e) {
        console.error('❌ Erro ao salvar estado:', e);
    }
}

function loadStateFromLocalStorage() {
    try {
        const savedState = localStorage.getItem('queuePortalState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            appState.ticketsToday = parsedState.ticketsToday || 0;
            appState.specialTicketsToday = parsedState.specialTicketsToday || 0;
            appState.waitingTicketsToday = parsedState.waitingTicketsToday || 0;
            appState.lastReset = parsedState.lastReset || new Date().toLocaleDateString('pt-BR');
            appState.currentAnalystIndex = parsedState.currentAnalystIndex || 0;
            appState.nextTicketNumber = parsedState.nextTicketNumber || 1000;
            appState.dailyResetDone = parsedState.dailyResetDone || false;
            appState.manualAssignments = parsedState.manualAssignments || [];
            
            if (parsedState.simulatedTime) {
                appState.simulatedTime = new Date(parsedState.simulatedTime);
            }
            
            if (parsedState.analysts) {
                parsedState.analysts.forEach(savedAnalyst => {
                    const analyst = window.analysts.find(a => a.id === savedAnalyst.id);
                    if (analyst) {
                        analyst.ticketsHandled = savedAnalyst.ticketsHandled || 0;
                        analyst.isBusy = savedAnalyst.isBusy || false;
                        analyst.currentTicket = savedAnalyst.currentTicket || null;
                        analyst.ticketStatus = savedAnalyst.ticketStatus || null;
                        analyst.ticketSpecialType = savedAnalyst.ticketSpecialType || null;
                        analyst.inQueue = savedAnalyst.inQueue !== undefined ? savedAnalyst.inQueue : true;
                        analyst.lastActivity = savedAnalyst.lastActivity ? new Date(savedAnalyst.lastActivity) : null;
                        analyst.isWaitingForClient = savedAnalyst.isWaitingForClient || false;
                    }
                });
            }
            
            updateQueueOrder();
            updateStatistics();
            createAnalystStatusColumns();
            updateSpecialCasesDisplay();
            
            console.log('✅ Estado carregado do localStorage');
        }
    } catch (e) {
        console.error('❌ Erro ao carregar estado:', e);
        localStorage.removeItem('queuePortalState');
    }
}

// ============================================
// FUNÇÕES DE RELATÓRIOS
// ============================================

async function generateCSVReport() {
    if (!window.firebaseAppIntegration || !window.firebaseAppIntegration.getTicketsByDateRange) {
        showNotification('Funcionalidade de relatórios não disponível', 'error');
        return;
    }
    
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    if (!startDate || !endDate) {
        showNotification('Selecione as datas inicial e final', 'warning');
        return;
    }
    
    // Implementação do relatório...
    showNotification('Gerando relatório...', 'info');
}

// ============================================
// FUNÇÕES PARA HABILITAR CONTROLES
// ============================================

function enableAllControls() {
    // Habilitar todos os inputs
    const inputs = document.querySelectorAll('input, select, button');
    inputs.forEach(input => {
        input.disabled = false;
    });
    
    // Definir usuário como logado
    appState.userLoggedIn = true;
    updateUserInfo();
}

function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    
    if (userInfo && userName) {
        userName.textContent = 'Administrador (Modo Teste)';
        userInfo.style.display = 'flex';
    }
}

function checkSavedState() {
    loadStateFromLocalStorage();
}

// ============================================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ============================================

window.appController = {
    appState: appState,
    analysts: window.analysts,
    specialClients: window.specialClients,
    
    updateCurrentTime,
    updateAnalystAvailability,
    updateStatistics,
    updateSpecialCasesDisplay,
    createAnalystStatusColumns,
    
    handleNewTicket,
    assignTicketToAnalyst,
    finishTicket,
    setTicketWaiting,
    resumeTicket,
    quickAssignTicket,
    
    nextAnalyst,
    resetQueue,
    freeAllAnalysts,
    
    showNotification,
    saveStateToLocalStorage,
    loadStateFromLocalStorage
};

console.log('✅ app.js v3.3.1 carregado com sucesso');
console.log('📋 Sistema otimizado para evitar perda de foco nos inputs');
