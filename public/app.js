// ============================================
// PORTAL DE FILA DE CHAMADOS - PAYHUB
// ============================================
// app.js - Lógica principal da aplicação
// Versão: 2.0.0
// Data: 2024

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
        lastActivity: null
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
        lastActivity: null
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
        specialClient: "DPSP",
        inQueue: true,
        ticketsHandled: 0,
        lastActivity: null
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
        lastActivity: null
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
        lastActivity: null
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
        lastActivity: null
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
        lastActivity: null
    },
    { 
        id: 8, 
        name: "André", 
        level: "N2", 
        startTime: 8, 
        endTime: 18, 
        isAvailable: false, 
        isBusy: false,
        currentTicket: null,
        ticketStatus: null,
        specialClient: "Benoit",
        inQueue: false,
        ticketsHandled: 0,
        lastActivity: null
    },
    { 
        id: 9, 
        name: "Felipe", 
        level: "N2", 
        startTime: 8, 
        endTime: 18, 
        isAvailable: false, 
        isBusy: false,
        currentTicket: null,
        ticketStatus: null,
        specialClient: null,
        inQueue: false,
        ticketsHandled: 0,
        lastActivity: null
    }
];

// Clientes especiais
window.specialClients = [
    { client: "Benoit", analyst: "André", level: "N2" },
    { client: "TIM", analyst: "Eric", level: "N1" },
    { client: "DPSP", analyst: "Tamiris", level: "N1" }
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
    autoRefreshInterval: null
};

// Cache para melhor performance
let cache = {
    lastUpdate: 0,
    queueHTML: '',
    analystsData: {}
};

// ============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Portal de Fila Payhub...');
    
    // Inicializar componentes
    initializeApp();
    
    // Configurar atualização automática
    setupAutoRefresh();
    
    // Configurar listeners
    setupEventListeners();
    
    // Verificar estado salvo
    checkSavedState();
});

function initializeApp() {
    try {
        // Atualizar interface inicial
        updateCurrentTime();
        updateAnalystAvailability();
        updateQueueOrder();
        updateQueueDisplay();
        updateSpecialCasesDisplay();
        updateStatistics();
        updateLastUpdateTime();
        
        // Configurar datas dos relatórios
        setupReportDates();
        
        // Verificar reset diário
        checkDailyReset();
        
        // Marcar como inicializado
        appState.isInitialized = true;
        
        console.log('✅ Aplicação inicializada com sucesso');
        
        // Mostrar notificação de boas-vindas
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification('Sistema de fila carregado', 'success');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showError('Falha na inicialização do sistema');
    }
}

function setupAutoRefresh() {
    // Limpar intervalo anterior se existir
    if (appState.autoRefreshInterval) {
        clearInterval(appState.autoRefreshInterval);
    }
    
    // Atualizar a cada minuto
    appState.autoRefreshInterval = setInterval(() => {
        updateApp();
    }, 60000); // 60 segundos
    
    // Atualizar tempo a cada segundo (para o relógio)
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
        
        // Botões de relatório
        document.getElementById('generateReportBtn').addEventListener('click', openReportModal);
        document.getElementById('closeReportModal').addEventListener('click', closeReportModal);
        document.getElementById('cancelReport').addEventListener('click', closeReportModal);
        document.getElementById('generateCSV').addEventListener('click', generateCSVReport);
        
        // Modal de simulação
        document.getElementById('closeTimeModal').addEventListener('click', closeTimeSimulationModal);
        document.getElementById('cancelSimulation').addEventListener('click', closeTimeSimulationModal);
        document.getElementById('applySimulation').addEventListener('click', applyTimeSimulation);
        
        // Login
        document.getElementById('loginBtn').addEventListener('click', handleLogin);
        document.getElementById('loginPassword').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
        
        // Opções de horário no modal
        document.querySelectorAll('.time-option').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.time-option').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Permitir Enter no campo de número do chamado
        document.getElementById('newTicketNumber').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleNewTicket();
            }
        });
        
        // Fechar modais ao clicar fora
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
        
        // Hotkeys
        document.addEventListener('keydown', function(e) {
            // Ctrl + N = Novo ticket
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                document.getElementById('newTicketNumber').focus();
            }
            
            // Ctrl + F = Liberar todos
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                freeAllAnalysts();
            }
            
            // Ctrl + R = Resetar fila
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                resetQueue();
            }
            
            // ESC = Fechar modais
            if (e.key === 'Escape') {
                closeAllModals();
            }
        });
        
        console.log('✅ Event listeners configurados');
        
    } catch (error) {
        console.error('❌ Erro ao configurar event listeners:', error);
    }
}

function checkSavedState() {
    // Carregar estado do localStorage
    loadStateFromLocalStorage();
    
    // Se tiver estado salvo, atualizar interface
    if (localStorage.getItem('queuePortalState')) {
        showNotification('Estado anterior restaurado', 'info');
    }
}

// ============================================
// FUNÇÕES PRINCIPAIS - TEMPO E DISPONIBILIDADE
// ============================================

function updateCurrentTime() {
    try {
        const now = appState.simulatedTime ? new Date(appState.simulatedTime) : new Date();
        
        // Formatar data
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('pt-BR', dateOptions);
        
        // Formatar hora
        const timeString = now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Atualizar elementos
        const dateElement = document.getElementById('currentDate');
        const timeElement = document.getElementById('currentTime');
        
        if (dateElement) dateElement.textContent = dateString;
        if (timeElement) timeElement.textContent = timeString;
        
        // Mostrar/ocultar indicador de simulação
        const simulationIndicator = document.getElementById('simulationIndicator');
        const realTimeBtn = document.getElementById('realTimeBtn');
        
        if (appState.simulatedTime) {
            if (simulationIndicator) simulationIndicator.style.display = 'inline-flex';
            if (realTimeBtn) realTimeBtn.style.display = 'block';
        } else {
            if (simulationIndicator) simulationIndicator.style.display = 'none';
            if (realTimeBtn) realTimeBtn.style.display = 'none';
        }
        
        // Atualizar disponibilidade dos analistas
        updateAnalystAvailability();
        
    } catch (error) {
        console.error('❌ Erro ao atualizar hora:', error);
    }
}

function updateAnalystAvailability() {
    const now = appState.simulatedTime ? new Date(appState.simulatedTime) : new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes / 100;
    
    window.analysts.forEach(analyst => {
        const startTime = analyst.startTime;
        const endTime = analyst.endTime;
        
        // Verificar se está no horário de trabalho
        analyst.isAvailable = (currentTime >= startTime && currentTime < endTime);
        
        // Analistas aguardando cliente estão disponíveis para nova chamada
        if (analyst.ticketStatus === 'aguardando-cliente') {
            analyst.isBusy = false;
        } else if (analyst.ticketStatus === 'atendendo' || analyst.currentTicket) {
            analyst.isBusy = true;
        }
        
        // Ajustes para casos especiais
        if (analyst.name === "Eric" && analyst.currentTicket === "TIM") {
            analyst.isBusy = true;
            analyst.isAvailable = false;
        }
        
        if (analyst.name === "Tamiris" && analyst.currentTicket === "DPSP") {
            analyst.isBusy = true;
            analyst.isAvailable = false;
        }
        
        if (analyst.name === "André" && analyst.currentTicket === "Benoit") {
            analyst.isBusy = true;
            analyst.isAvailable = false;
        }
        
        // Atualizar timestamp da última atividade
        if (analyst.currentTicket && !analyst.lastActivity) {
            analyst.lastActivity = new Date();
        }
    });
    
    // Atualizar interface
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    // Salvar estado
    saveStateToLocalStorage();
}

// ============================================
// FUNÇÕES DA FILA
// ============================================

function updateQueueOrder() {
    // Filtrar apenas analistas N1 disponíveis (não ocupados)
    const availableAnalysts = window.analysts.filter(a => 
        a.level === "N1" && 
        a.isAvailable && 
        !a.isBusy && // Não está ocupado com atendimento
        a.inQueue
    );
    
    if (availableAnalysts.length === 0) {
        appState.queueOrder = [];
        appState.currentAnalystIndex = 0;
        return;
    }
    
    // Se a fila está vazia ou precisa ser reiniciada
    if (appState.queueOrder.length === 0 || appState.currentAnalystIndex >= availableAnalysts.length) {
        // Ordenar por menos chamados atendidos
        appState.queueOrder = [...availableAnalysts].sort((a, b) => {
            if (a.ticketsHandled !== b.ticketsHandled) {
                return a.ticketsHandled - b.ticketsHandled;
            }
            // Em caso de empate, ordenar por ID
            return a.id - b.id;
        });
        appState.currentAnalystIndex = 0;
    } else {
        // Atualizar fila mantendo ordem
        appState.queueOrder = appState.queueOrder
            .filter(a => availableAnalysts.some(av => av.id === a.id))
            .map(a => {
                const updated = availableAnalysts.find(av => av.id === a.id);
                return updated || a;
            });
        
        // Ajustar índice se necessário
        if (appState.currentAnalystIndex >= appState.queueOrder.length) {
            appState.currentAnalystIndex = 0;
        }
    }
}

function updateQueueDisplay() {
    const queueList = document.getElementById('queueList');
    if (!queueList) return;
    
    const queueAnalysts = window.analysts.filter(a => a.level === "N1" && a.inQueue);
    
    if (queueAnalysts.length === 0) {
        queueList.innerHTML = `
            <div class="analyst-card offline">
                <div class="analyst-info">
                    <div class="analyst-name">Nenhum analista configurado</div>
                    <div style="font-size: 13px; color: var(--sp-text-secondary); margin-top: 8px;">
                        Configure os horários dos analistas no sistema.
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    let queueHTML = '';
    
    // Analista atual
    if (appState.queueOrder.length > 0 && appState.currentAnalystIndex < appState.queueOrder.length) {
        const currentAnalyst = appState.queueOrder[appState.currentAnalystIndex];
        const statusClass = currentAnalyst.ticketStatus === 'aguardando-cliente' ? 'waiting-client' : 'active';
        queueHTML += createAnalystCardHTML(currentAnalyst, statusClass);
    }
    
    // Próximos analistas
    for (let i = 1; i <= 3; i++) {
        const nextIndex = (appState.currentAnalystIndex + i) % appState.queueOrder.length;
        if (nextIndex < appState.queueOrder.length && i < appState.queueOrder.length) {
            const nextAnalyst = appState.queueOrder[nextIndex];
            const statusClass = i === 1 ? 'next' : '';
            queueHTML += createAnalystCardHTML(nextAnalyst, statusClass);
        }
    }
    
    // Outros analistas
    const otherAnalysts = window.analysts.filter(a => 
        a.level === "N1" && 
        a.inQueue && 
        (a.isBusy || a.currentTicket || !a.isAvailable)
    );
    
    const displayedIds = appState.queueOrder.slice(0, 4).map(a => a.id);
    const toDisplay = otherAnalysts.filter(a => !displayedIds.includes(a.id));
    
    if (toDisplay.length > 0) {
        queueHTML += `<div class="other-analysts-header">
            <i class="fas fa-user-clock"></i> Outros Analistas
        </div>`;
        
        toDisplay.forEach(analyst => {
            let statusClass = 'offline';
            if (analyst.ticketStatus === 'aguardando-cliente') {
                statusClass = 'waiting-client';
            } else if (analyst.isBusy) {
                statusClass = 'busy';
            } else if (!analyst.isAvailable) {
                statusClass = 'offline';
            }
            queueHTML += createAnalystCardHTML(analyst, statusClass);
        });
    }
    
    // Atualizar o DOM
    queueList.innerHTML = queueHTML;
    
    // Adicionar eventos aos botões
    attachAnalystCardEvents();
}

function createAnalystCardHTML(analyst, status) {
    let statusText = '';
    let statusClass = status;
    
    // Determinar texto do status
    if (status === 'active') {
        statusText = 'ANALISTA ATUAL';
    } else if (status === 'next') {
        statusText = 'PRÓXIMO NA FILA';
    } else if (analyst.ticketStatus === 'aguardando-cliente') {
        statusText = 'AGUARDANDO CLIENTE';
        statusClass = 'waiting-client';
    } else if (analyst.ticketStatus === 'atendendo' || analyst.isBusy) {
        statusText = 'EM ATENDIMENTO';
    } else if (!analyst.isAvailable) {
        statusText = 'FORA DO HORÁRIO';
    } else {
        statusText = 'DISPONÍVEL';
    }
    
    // Informações do ticket atual
    let ticketInfo = '';
    if (analyst.currentTicket) {
        const clientName = getClientNameFromTicket(analyst.currentTicket);
        const statusBadge = analyst.ticketStatus === 'aguardando-cliente' ? 
            '<span class="ticket-status aguardando">AGUARDANDO</span>' : 
            '<span class="ticket-status atendendo">ATENDENDO</span>';
        
        ticketInfo = `
            <div class="ticket-info">
                <i class="fas fa-ticket-alt"></i> 
                <span class="ticket-number">${analyst.currentTicket}</span>
                ${statusBadge}
                ${clientName ? `<div class="client-name-info">
                    <i class="fas fa-user"></i> ${clientName}
                </div>` : ''}
                ${analyst.lastActivity ? `<div class="last-activity">
                    <i class="far fa-clock"></i> ${formatTimeSince(analyst.lastActivity)}
                </div>` : ''}
            </div>
        `;
    }
    
    // Controles do ticket
    let ticketControls = '';
    if (analyst.currentTicket) {
        ticketControls = `
            <div class="status-buttons">
                ${analyst.ticketStatus === 'aguardando-cliente' ? `
                    <button class="status-btn resume resume-ticket-btn" data-analyst-id="${analyst.id}" title="Retomar atendimento">
                        <i class="fas fa-play"></i> Retomar
                    </button>
                ` : `
                    <button class="status-btn waiting waiting-client-btn" data-analyst-id="${analyst.id}" title="Aguardar retorno do cliente">
                        <i class="fas fa-clock"></i> Aguardar
                    </button>
                `}
                <button class="status-btn finish finish-ticket-btn" data-analyst-id="${analyst.id}" title="Finalizar chamado">
                    <i class="fas fa-check"></i> Finalizar
                </button>
            </div>
        `;
    } else {
        ticketControls = `
            <input type="text" class="input-field assign-ticket-input" 
                   placeholder="Nº Chamado" 
                   data-analyst-id="${analyst.id}"
                   title="Digite o número do chamado"
                   style="font-size: 12px; padding: 6px 10px;">
            <button class="btn btn-small assign-ticket-btn" data-analyst-id="${analyst.id}" title="Atribuir chamado">
                <i class="fas fa-paperclip"></i> Atribuir
            </button>
        `;
    }
    
    // HTML final do card
    return `
        <div class="analyst-card ${statusClass}" data-analyst-id="${analyst.id}">
            <div class="analyst-info">
                <div class="analyst-name">
                    ${analyst.name}
                    <span class="analyst-level ${analyst.level.toLowerCase()}">${analyst.level}</span>
                </div>
                <div class="analyst-schedule">
                    <i class="far fa-clock"></i> 
                    ${analyst.startTime}h - ${analyst.endTime}h
                </div>
                ${ticketInfo}
                <div class="tickets-today">
                    <i class="fas fa-tasks"></i> Chamados hoje: ${analyst.ticketsHandled}
                </div>
            </div>
            
            <div class="analyst-status">
                <div class="status-indicator">
                    <span class="status-dot ${getStatusDotClass(analyst)}"></span>
                    <span>${statusText}</span>
                </div>
                ${analyst.specialClient ? `
                    <div class="special-client-badge">
                        <i class="fas fa-star"></i> ${analyst.specialClient}
                    </div>
                ` : ''}
            </div>
            
            <div class="ticket-controls">
                ${ticketControls}
            </div>
        </div>
    `;
}

function getStatusDotClass(analyst) {
    if (analyst.ticketStatus === 'aguardando-cliente') {
        return 'status-waiting';
    } else if (analyst.isBusy || analyst.currentTicket) {
        return 'status-busy';
    } else if (analyst.isAvailable) {
        return 'status-available';
    } else {
        return 'status-offline';
    }
}

function getClientNameFromTicket(ticket) {
    const specialClient = window.specialClients.find(c => 
        c.analyst === "Eric" && ticket === "TIM" ||
        c.analyst === "Tamiris" && ticket === "DPSP" ||
        c.analyst === "André" && ticket === "Benoit"
    );
    return specialClient ? specialClient.client : null;
}

function formatTimeSince(date) {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `Há ${diffHours} h`;
}

function attachAnalystCardEvents() {
    // Botões de atribuir ticket
    document.querySelectorAll('.assign-ticket-btn').forEach(button => {
        button.addEventListener('click', function() {
            const analystId = parseInt(this.getAttribute('data-analyst-id'));
            const input = document.querySelector(`.assign-ticket-input[data-analyst-id="${analystId}"]`);
            const ticketNumber = input?.value.trim();
            
            if (ticketNumber) {
                assignTicketToAnalyst(analystId, ticketNumber, 'normal', 'atendendo');
                if (input) input.value = '';
            } else {
                showNotification('Digite um número de chamado', 'warning');
            }
        });
    });
    
    // Botões de aguardar cliente
    document.querySelectorAll('.waiting-client-btn').forEach(button => {
        button.addEventListener('click', function() {
            const analystId = parseInt(this.getAttribute('data-analyst-id'));
            setTicketWaiting(analystId);
        });
    });
    
    // Botões de retomar atendimento
    document.querySelectorAll('.resume-ticket-btn').forEach(button => {
        button.addEventListener('click', function() {
            const analystId = parseInt(this.getAttribute('data-analyst-id'));
            resumeTicket(analystId);
        });
    });
    
    // Botões de finalizar ticket
    document.querySelectorAll('.finish-ticket-btn').forEach(button => {
        button.addEventListener('click', function() {
            const analystId = parseInt(this.getAttribute('data-analyst-id'));
            finishTicket(analystId);
        });
    });
}

// ============================================
// FUNÇÕES DE TICKETS
// ============================================

function handleNewTicket() {
    const ticketNumberInput = document.getElementById('newTicketNumber');
    const ticketTypeSelect = document.getElementById('ticketType');
    
    if (!ticketNumberInput || !ticketTypeSelect) {
        showNotification('Elementos do formulário não encontrados', 'error');
        return;
    }
    
    let ticketNumber = ticketNumberInput.value.trim();
    const ticketType = ticketTypeSelect.value;
    
    // Validação básica
    if (ticketNumber && ticketNumber.length < 3) {
        showNotification('Número do chamado muito curto', 'warning');
        return;
    }
    
    // Gerar número automático se não informado
    if (!ticketNumber) {
        ticketNumber = `CH-${appState.nextTicketNumber}`;
        appState.nextTicketNumber++;
    }
    
    // Verificar se ticket já existe
    if (isTicketAlreadyExists(ticketNumber)) {
        showNotification(`Chamado ${ticketNumber} já está em atendimento`, 'warning');
        return;
    }
    
    // Processar chamado
    if (ticketType !== 'normal') {
        handleSpecialTicket(ticketNumber, ticketType);
    } else {
        handleNormalTicket(ticketNumber);
    }
    
    // Limpar campo
    ticketNumberInput.value = '';
    ticketNumberInput.focus();
    
    // Salvar estado
    saveStateToLocalStorage();
}

function isTicketAlreadyExists(ticketNumber) {
    return window.analysts.some(analyst => 
        analyst.currentTicket === ticketNumber || 
        analyst.currentTicket === getClientNameFromTicket(ticketNumber)
    );
}

function handleNormalTicket(ticketNumber) {
    if (appState.queueOrder.length === 0) {
        showNotification('Nenhum analista disponível na fila!', 'warning');
        return;
    }
    
    const currentAnalyst = appState.queueOrder[appState.currentAnalystIndex];
    
    if (!currentAnalyst || !currentAnalyst.isAvailable || 
        (currentAnalyst.isBusy && currentAnalyst.ticketStatus !== 'aguardando-cliente')) {
        
        showNotification(`${currentAnalyst?.name || 'Analista'} não está disponível. Indo para o próximo...`, 'warning');
        nextAnalyst();
        
        const newCurrentAnalyst = appState.queueOrder[appState.currentAnalystIndex];
        if (newCurrentAnalyst && newCurrentAnalyst.isAvailable && !newCurrentAnalyst.isBusy) {
            assignTicketToAnalyst(newCurrentAnalyst.id, ticketNumber, 'normal', 'atendendo');
        } else {
            showNotification('Nenhum analista disponível!', 'error');
        }
        return;
    }
    
    assignTicketToAnalyst(currentAnalyst.id, ticketNumber, 'normal', 'atendendo');
    nextAnalyst();
    appState.ticketsToday++;
    
    showNotification(`Chamado ${ticketNumber} atribuído a ${currentAnalyst.name}`, 'success');
}

function handleSpecialTicket(ticketNumber, ticketType) {
    const specialClient = window.specialClients.find(c => 
        ticketType === 'TIM' ? c.client === 'TIM' :
        ticketType === 'DPSP' ? c.client === 'DPSP' :
        ticketType === 'Benoit' ? c.client === 'Benoit' : false
    );
    
    if (!specialClient) {
        showNotification(`Cliente especial não encontrado!`, 'error');
        return;
    }
    
    const analyst = window.analysts.find(a => a.name === specialClient.analyst);
    
    if (!analyst) {
        showNotification(`Analista ${specialClient.analyst} não encontrado!`, 'error');
        return;
    }
    
    if (!analyst.isAvailable || (analyst.isBusy && analyst.ticketStatus !== 'aguardando-cliente')) {
        showNotification(`${analyst.name} não está disponível!`, 'warning');
        return;
    }
    
    assignTicketToAnalyst(analyst.id, ticketNumber, ticketType, 'atendendo');
    appState.ticketsToday++;
    appState.specialTicketsToday++;
    
    showNotification(`Chamado especial ${ticketNumber} atribuído a ${analyst.name}`, 'success');
}

function assignTicketToAnalyst(analystId, ticketNumber, ticketType, ticketStatus = 'atendendo') {
    const analyst = window.analysts.find(a => a.id === analystId);
    
    if (!analyst) {
        console.error(`Analista com ID ${analystId} não encontrado`);
        return;
    }
    
    analyst.isBusy = ticketStatus === 'atendendo';
    analyst.currentTicket = ticketNumber;
    analyst.ticketStatus = ticketStatus;
    analyst.lastActivity = new Date();
    
    // Tratamento para clientes especiais
    if (ticketType !== 'normal') {
        const clientName = getClientNameFromTicket(ticketType);
        if (analyst.specialClient === clientName) {
            analyst.currentTicket = clientName;
        }
    }
    
    analyst.ticketsHandled++;
    
    // Remover da fila se for caso especial
    if (analyst.name === "Eric" && ticketType === "TIM") {
        analyst.inQueue = false;
    }
    
    if (analyst.name === "Tamiris" && ticketType === "DPSP") {
        analyst.inQueue = false;
    }
    
    // Atualizar interface
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    // Salvar no Firebase se disponível
    if (window.firebaseAppIntegration?.saveTicketToFirebase) {
        window.firebaseAppIntegration.saveTicketToFirebase(ticketNumber, analyst.name, 'iniciado');
    }
    
    // Salvar localmente
    saveStateToLocalStorage();
}

function setTicketWaiting(analystId) {
    const analyst = window.analysts.find(a => a.id === analystId);
    
    if (!analyst) return;
    
    // Colocar o chamado em espera (aguardando cliente)
    analyst.ticketStatus = 'aguardando-cliente';
    analyst.isBusy = false; // Fica disponível para nova chamada
    analyst.lastActivity = new Date();
    
    // Retornar à fila se for analista N1
    if (analyst.level === "N1" && analyst.inQueue) {
        updateQueueOrder();
    }
    
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    showNotification(`${analyst.name} está aguardando retorno do cliente`, 'info');
    saveStateToLocalStorage();
}

function resumeTicket(analystId) {
    const analyst = window.analysts.find(a => a.id === analystId);
    
    if (!analyst) return;
    
    // Retomar o atendimento do chamado em espera
    analyst.ticketStatus = 'atendendo';
    analyst.isBusy = true;
    analyst.lastActivity = new Date();
    
    // Se estiver na fila, remover temporariamente
    if (analyst.level === "N1" && analyst.inQueue) {
        updateQueueOrder();
    }
    
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    showNotification(`${analyst.name} retomou o atendimento`, 'success');
    saveStateToLocalStorage();
}

function finishTicket(analystId) {
    const analyst = window.analysts.find(a => a.id === analystId);
    
    if (!analyst) return;
    
    const ticketNumber = analyst.currentTicket;
    
    // Salvar histórico antes de limpar
    if (ticketNumber && window.firebaseAppIntegration?.saveTicketToFirebase) {
        window.firebaseAppIntegration.saveTicketToFirebase(ticketNumber, analyst.name, 'finalizado');
    }
    
    // Finalizar o chamado
    analyst.isBusy = false;
    analyst.currentTicket = null;
    analyst.ticketStatus = null;
    analyst.lastActivity = null;
    
    // Reintegrar à fila se for Eric ou Tamiris (casos especiais)
    if (analyst.name === "Eric" || analyst.name === "Tamiris") {
        analyst.inQueue = true;
    }
    
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    showNotification(`Chamado ${ticketNumber || 'desconhecido'} finalizado por ${analyst.name}`, 'success');
    saveStateToLocalStorage();
}

// ============================================
// FUNÇÕES DE CONTROLE DA FILA
// ============================================

function nextAnalyst() {
    if (appState.queueOrder.length === 0) {
        showNotification('Não há analistas na fila!', 'warning');
        return;
    }
    
    appState.currentAnalystIndex = (appState.currentAnalystIndex + 1) % appState.queueOrder.length;
    updateQueueDisplay();
    updateStatistics();
    
    const currentAnalyst = appState.queueOrder[appState.currentAnalystIndex];
    showNotification(`Próximo analista: ${currentAnalyst.name}`, 'info');
    
    saveStateToLocalStorage();
}

function resetQueue() {
    if (!confirm('Tem certeza que deseja reiniciar a fila do dia?\n\nIsso irá:\n• Zerar todos os contadores\n• Liberar todos os analistas\n• Reiniciar a ordem da fila')) {
        return;
    }
    
    appState.currentAnalystIndex = 0;
    appState.queueOrder = [];
    appState.lastReset = new Date().toLocaleDateString('pt-BR');
    appState.dailyResetDone = false;
    
    window.analysts.forEach(analyst => {
        analyst.ticketsHandled = 0;
        analyst.isBusy = false;
        analyst.currentTicket = null;
        analyst.ticketStatus = null;
        analyst.lastActivity = null;
        analyst.inQueue = analyst.level === "N1";
    });
    
    appState.ticketsToday = 0;
    appState.specialTicketsToday = 0;
    appState.waitingTicketsToday = 0;
    appState.nextTicketNumber = 1000;
    
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    showNotification('Fila reiniciada para o novo dia!', 'success');
    saveStateToLocalStorage();
}

function freeAllAnalysts() {
    if (!confirm('Liberar TODOS os analistas?\n\nIsso irá finalizar todos os atendimentos em andamento.')) {
        return;
    }
    
    let freedCount = 0;
    
    window.analysts.forEach(analyst => {
        if (analyst.isBusy || analyst.currentTicket) {
            analyst.isBusy = false;
            analyst.currentTicket = null;
            analyst.ticketStatus = null;
            analyst.lastActivity = null;
            analyst.inQueue = analyst.level === "N1";
            freedCount++;
        }
    });
    
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    showNotification(`${freedCount} analistas liberados`, 'success');
    saveStateToLocalStorage();
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
// FUNÇÕES DE INTERFACE
// ============================================

function updateSpecialCasesDisplay() {
    const specialCasesDiv = document.getElementById('specialCases');
    if (!specialCasesDiv) return;
    
    let specialCasesHTML = '';
    
    window.specialClients.forEach(special => {
        const analyst = window.analysts.find(a => a.name === special.analyst);
        const isAvailable = analyst ? analyst.isAvailable && !analyst.isBusy : false;
        const isBusy = analyst ? (analyst.isBusy && analyst.ticketStatus !== 'aguardando-cliente') || analyst.currentTicket === special.client : false;
        const isWaiting = analyst ? analyst.ticketStatus === 'aguardando-cliente' : false;
        
        specialCasesHTML += `
            <div class="special-client">
                <div class="client-info">
                    <div class="client-name">Cliente ${special.client}</div>
                    <div class="client-description">
                        Atendimento dedicado
                    </div>
                </div>
                <div>
                    <div class="assigned-analyst">${special.analyst} (${special.level})</div>
                    <div class="status-container">
                        <div class="status-indicator">
                            <span class="status-dot ${isWaiting ? 'status-waiting' : isBusy ? 'status-busy' : isAvailable ? 'status-available' : 'status-offline'}"></span>
                            <span class="status-text">
                                ${isWaiting ? 'AGUARDANDO' : isBusy ? 'ATENDENDO' : isAvailable ? 'DISPONÍVEL' : 'INDISPONÍVEL'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    specialCasesDiv.innerHTML = specialCasesHTML;
}

function updateStatistics() {
    // Chamados hoje
    updateElementText('totalTickets', appState.ticketsToday);
    
    // Analistas ativos
    const activeAnalysts = window.analysts.filter(a => a.isAvailable && !a.isBusy).length;
    updateElementText('activeAnalysts', activeAnalysts);
    
    // Próximo na fila
    let nextInQueue = '-';
    if (appState.queueOrder.length > 0) {
        const nextIndex = (appState.currentAnalystIndex + 1) % appState.queueOrder.length;
        if (nextIndex < appState.queueOrder.length) {
            nextInQueue = appState.queueOrder[nextIndex].name;
        }
    }
    updateElementText('nextInQueue', nextInQueue);
    
    // Chamados especiais
    updateElementText('specialTickets', appState.specialTicketsToday);
    
    // Chamados aguardando cliente
    const waitingTickets = window.analysts.filter(a => a.ticketStatus === 'aguardando-cliente').length;
    updateElementText('waitingTickets', waitingTickets);
    appState.waitingTicketsToday = waitingTickets;
    
    // Último reset
    updateElementText('lastResetDate', appState.lastReset);
    updateElementText('lastResetInfo', `Fila reiniciada em: ${appState.lastReset}`);
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

function updateApp() {
    updateCurrentTime();
    updateLastUpdateTime();
    checkDailyReset();
}

// ============================================
// FUNÇÕES DE SIMULAÇÃO DE HORÁRIO
// ============================================

function openTimeSimulationModal() {
    const modal = document.getElementById('timeSimulationModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeTimeSimulationModal() {
    const modal = document.getElementById('timeSimulationModal');
    if (modal) {
        modal.style.display = 'none';
    }
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

// ============================================
// FUNÇÕES DE RELATÓRIO CSV
// ============================================

function setupReportDates() {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    updateElementValue('startDate', lastWeek.toISOString().split('T')[0]);
    updateElementValue('endDate', today.toISOString().split('T')[0]);
}

function updateElementValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value;
    }
}

function openReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

async function generateCSVReport() {
    // Verificar se Firebase está disponível
    if (!window.firebaseAppIntegration || !window.firebaseAppIntegration.getTicketsByDateRange) {
        showNotification('Funcionalidade de relatórios não disponível', 'error');
        return;
    }
    
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    const includeAllTickets = document.getElementById('includeAllTickets')?.checked;
    
    if (!startDate || !endDate) {
        showNotification('Selecione as datas inicial e final', 'warning');
        return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    if (start > end) {
        showNotification('A data inicial não pode ser maior que a data final', 'error');
        return;
    }
    
    try {
        showNotification('Gerando relatório...', 'info');
        
        const tickets = await window.firebaseAppIntegration.getTicketsByDateRange(startDate, endDate, includeAllTickets);
        
        if (!tickets || tickets.length === 0) {
            showNotification('Nenhum chamado encontrado no período selecionado', 'warning');
            return;
        }
        
        const csvContent = createCSVContent(tickets);
        downloadCSV(csvContent, startDate, endDate);
        
        closeReportModal();
        showNotification(`Relatório CSV gerado com ${tickets.length} registros`, 'success');
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showNotification('Erro ao gerar relatório: ' + error.message, 'error');
    }
}

function createCSVContent(tickets) {
    let csv = 'Número do Chamado,Analista,Data de Atendimento,Status,Hora,Data Completa\n';
    
    tickets.forEach(ticket => {
        const dateObj = ticket.timestamp instanceof Date ? ticket.timestamp : new Date(ticket.timestamp);
        const dateStr = dateObj.toLocaleDateString('pt-BR');
        const timeStr = dateObj.toLocaleTimeString('pt-BR');
        const fullDate = dateObj.toISOString();
        
        const ticketNumber = `"${ticket.ticketNumber}"`;
        const analyst = `"${ticket.analyst}"`;
        const date = `"${dateStr}"`;
        const status = `"${ticket.status}"`;
        const time = `"${timeStr}"`;
        const fullDateTime = `"${fullDate}"`;
        
        csv += `${ticketNumber},${analyst},${date},${status},${time},${fullDateTime}\n`;
    });
    
    return csv;
}

function downloadCSV(csvContent, startDate, endDate) {
    const startFormatted = startDate.replace(/-/g, '');
    const endFormatted = endDate.replace(/-/g, '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `relatorio_chamados_${startFormatted}_a_${endFormatted}_${timestamp}.csv`;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// ============================================
// FUNÇÕES DE LOGIN (INTEGRAÇÃO COM FIREBASE)
// ============================================

function handleLogin() {
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const rememberMe = document.getElementById('rememberMe')?.checked;
    
    if (!email || !password) {
        showLoginError('Preencha e-mail e senha');
        return;
    }
    
    // Se Firebase estiver disponível, usar autenticação Firebase
    if (window.firebaseAppIntegration?.handleLogin) {
        window.firebaseAppIntegration.handleLogin(email, password, rememberMe);
    } else {
        // Fallback para login local (apenas para desenvolvimento)
        handleLocalLogin(email, password);
    }
}

function handleLocalLogin(email, password) {
    // Apenas para desenvolvimento - NÃO USAR EM PRODUÇÃO
    console.warn('⚠️ Usando login local (modo desenvolvimento)');
    
    if (email.includes('@payhub') && password === 'dev123') {
        showNotification('Login local bem-sucedido (modo dev)', 'success');
        hideLoginModal();
        
        // Simular usuário logado
        if (window.firebaseAppIntegration?.appState) {
            window.firebaseAppIntegration.appState.user = {
                email: email,
                name: email.split('@')[0]
            };
            updateUserInfo();
            enableAppControls();
        }
    } else {
        showLoginError('Credenciais inválidas (use: qualquer@payhub / dev123)');
    }
}

function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    const errorMessage = document.getElementById('loginErrorMessage');
    
    if (errorElement && errorMessage) {
        errorMessage.textContent = message;
        errorElement.style.display = 'block';
        
        // Esconder após 5 segundos
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement && window.firebaseAppIntegration?.appState?.user) {
        userNameElement.textContent = window.firebaseAppIntegration.appState.user.name;
    }
}

function enableAppControls() {
    const buttons = ['addTicketBtn', 'nextAnalystBtn', 'resetQueueBtn', 'freeAllBtn', 
                   'simulateTimeBtn', 'generateReportBtn', 'realTimeBtn'];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = false;
        }
    });
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function showNotification(message, type = 'success') {
    // IMPLEMENTAÇÃO LOCAL DIRETA - SEM VERIFICAÇÕES
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
    
    // Remover após 5 segundos
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

function showError(message) {
    showNotification(message, 'error');
}

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
                inQueue: a.inQueue,
                lastActivity: a.lastActivity
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
                        analyst.inQueue = savedAnalyst.inQueue !== undefined ? savedAnalyst.inQueue : true;
                        analyst.lastActivity = savedAnalyst.lastActivity ? new Date(savedAnalyst.lastActivity) : null;
                    }
                });
            }
            
            updateQueueOrder();
            updateQueueDisplay();
            updateSpecialCasesDisplay();
            updateStatistics();
            
            console.log('✅ Estado carregado do localStorage');
        }
    } catch (e) {
        console.error('❌ Erro ao carregar estado:', e);
        // Se der erro, limpar localStorage corrompido
        localStorage.removeItem('queuePortalState');
    }
}

function exportBackup() {
    const backup = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        appState: appState,
        analysts: window.analysts,
        specialClients: window.specialClients
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `backup-fila-payhub-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Backup exportado com sucesso', 'success');
}

function importBackup(file) {
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (!backup.version || !backup.appState || !backup.analysts) {
                throw new Error('Formato de backup inválido');
            }
            
            if (!confirm(`Restaurar backup de ${backup.timestamp || 'data desconhecida'}?`)) {
                return;
            }
            
            // Restaurar estado
            Object.assign(appState, backup.appState);
            
            // Restaurar analistas
            backup.analysts.forEach(backupAnalyst => {
                const analyst = window.analysts.find(a => a.id === backupAnalyst.id);
                if (analyst) {
                    Object.assign(analyst, backupAnalyst);
                }
            });
            
            // Atualizar interface
            updateCurrentTime();
            updateQueueOrder();
            updateQueueDisplay();
            updateSpecialCasesDisplay();
            updateStatistics();
            
            // Salvar no localStorage
            saveStateToLocalStorage();
            
            showNotification('Backup restaurado com sucesso', 'success');
            
        } catch (error) {
            console.error('❌ Erro ao importar backup:', error);
            showNotification('Erro ao importar backup: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

// ============================================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ============================================

window.appController = {
    // Estado
    appState: appState,
    analysts: window.analysts,
    specialClients: window.specialClients,
    
    // Funções principais
    updateCurrentTime,
    updateAnalystAvailability,
    updateQueueDisplay,
    updateStatistics,
    
    // Controles de tickets
    handleNewTicket,
    assignTicketToAnalyst,
    finishTicket,
    setTicketWaiting,
    resumeTicket,
    
    // Controles da fila
    nextAnalyst,
    resetQueue,
    freeAllAnalysts,
    
    // Simulação
    openTimeSimulationModal,
    applyTimeSimulation,
    returnToRealTime,
    
    // Relatórios
    generateCSVReport,
    exportBackup,
    importBackup,
    
    // Utilitários
    showNotification,
    saveStateToLocalStorage,
    loadStateFromLocalStorage
};

console.log('✅ app.js carregado com sucesso');


