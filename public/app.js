// ============================================
// CONFIGURAÇÃO DOS ANALISTAS
// ============================================

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
        ticketsHandled: 0
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
        ticketsHandled: 0
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
        ticketsHandled: 0
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
        ticketsHandled: 0
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
        ticketsHandled: 0
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
        ticketsHandled: 0
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
        ticketsHandled: 0
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
        ticketsHandled: 0
    }
];

// Clientes especiais
const specialClients = [
    { client: "Benoit", analyst: "André", level: "N2" },
    { client: "TIM", analyst: "Eric", level: "N1" },
    { client: "DPSP", analyst: "Tamiris", level: "N1" }
];

// Estado da aplicação
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
    dailyResetDone: false
};

// ============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    
    // Atualizar a cada minuto
    setInterval(updateApp, 60000);
});

function initializeApp() {
    updateCurrentTime();
    updateAnalystAvailability();
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    updateLastUpdateTime();
    
    // Carregar estado salvo
    loadState();
    
    // Verificar reset diário
    checkDailyReset();
}

function setupEventListeners() {
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
// FUNÇÕES PRINCIPAIS
// ============================================

function updateCurrentTime() {
    const now = state.simulatedTime ? new Date(state.simulatedTime) : new Date();
    
    // Formatar data
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('pt-BR', dateOptions);
    
    // Formatar hora
    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Atualizar elementos
    document.getElementById('currentDate').textContent = dateString;
    document.getElementById('currentTime').textContent = timeString;
    
    // Mostrar/ocultar indicador de simulação
    const simulationIndicator = document.getElementById('simulationIndicator');
    const realTimeBtn = document.getElementById('realTimeBtn');
    
    if (state.simulatedTime) {
        simulationIndicator.style.display = 'inline-flex';
        realTimeBtn.style.display = 'block';
    } else {
        simulationIndicator.style.display = 'none';
        realTimeBtn.style.display = 'none';
    }
    
    updateAnalystAvailability();
}

function updateAnalystAvailability() {
    const now = state.simulatedTime ? new Date(state.simulatedTime) : new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes / 100;
    
    analysts.forEach(analyst => {
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
    });
    
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    saveState();
}

function updateQueueOrder() {
    // Filtrar apenas analistas N1 disponíveis (não ocupados)
    const availableAnalysts = analysts.filter(a => 
        a.level === "N1" && 
        a.isAvailable && 
        !a.isBusy && // Não está ocupado com atendimento
        a.inQueue
    );
    
    if (availableAnalysts.length === 0) {
        state.queueOrder = [];
        state.currentAnalystIndex = 0;
        return;
    }
    
    // Se a fila está vazia ou precisa ser reiniciada
    if (state.queueOrder.length === 0 || state.currentAnalystIndex >= availableAnalysts.length) {
        // Ordenar por menos chamados atendidos
        state.queueOrder = [...availableAnalysts].sort((a, b) => {
            if (a.ticketsHandled !== b.ticketsHandled) {
                return a.ticketsHandled - b.ticketsHandled;
            }
            return a.id - b.id;
        });
        state.currentAnalystIndex = 0;
    } else {
        // Atualizar fila mantendo ordem
        state.queueOrder = state.queueOrder
            .filter(a => availableAnalysts.some(av => av.id === a.id))
            .map(a => {
                const updated = availableAnalysts.find(av => av.id === a.id);
                return updated || a;
            });
        
        // Ajustar índice se necessário
        if (state.currentAnalystIndex >= state.queueOrder.length) {
            state.currentAnalystIndex = 0;
        }
    }
}

function updateQueueDisplay() {
    const queueList = document.getElementById('queueList');
    const queueAnalysts = analysts.filter(a => a.level === "N1" && a.inQueue);
    
    if (queueAnalysts.length === 0) {
        queueList.innerHTML = `
            <div class="analyst-card offline">
                <div class="analyst-info">
                    <div class="analyst-name">Nenhum analista configurado</div>
                </div>
            </div>
        `;
        return;
    }
    
    let queueHTML = '';
    
    // Analista atual
    if (state.queueOrder.length > 0 && state.currentAnalystIndex < state.queueOrder.length) {
        const currentAnalyst = state.queueOrder[state.currentAnalystIndex];
        const statusClass = currentAnalyst.ticketStatus === 'aguardando-cliente' ? 'waiting-client' : 'active';
        queueHTML += createAnalystCardHTML(currentAnalyst, statusClass);
    }
    
    // Próximos analistas
    for (let i = 1; i <= 3; i++) {
        const nextIndex = (state.currentAnalystIndex + i) % state.queueOrder.length;
        if (nextIndex < state.queueOrder.length && i < state.queueOrder.length) {
            const nextAnalyst = state.queueOrder[nextIndex];
            const statusClass = i === 1 ? 'next' : '';
            queueHTML += createAnalystCardHTML(nextAnalyst, statusClass);
        }
    }
    
    // Outros analistas
    const otherAnalysts = analysts.filter(a => 
        a.level === "N1" && 
        a.inQueue && 
        (a.isBusy || a.currentTicket || !a.isAvailable)
    );
    
    const displayedIds = state.queueOrder.slice(0, 4).map(a => a.id);
    const toDisplay = otherAnalysts.filter(a => !displayedIds.includes(a.id));
    
    if (toDisplay.length > 0) {
        queueHTML += `<div style="margin-top: 20px; color: var(--sp-text-secondary); font-size: 14px; font-weight: 600;">
            <i class="fas fa-user-clock"></i> Outros Analistas
        </div>`;
        
        toDisplay.forEach(analyst => {
            let statusClass = 'offline';
            if (analyst.ticketStatus === 'aguardando-cliente') {
                statusClass = 'waiting-client';
            } else if (analyst.isBusy) {
                statusClass = 'busy';
            }
            queueHTML += createAnalystCardHTML(analyst, statusClass);
        });
    }
    
    queueList.innerHTML = queueHTML;
    
    // Adicionar eventos aos botões
    attachAnalystCardEvents();
}

function createAnalystCardHTML(analyst, status) {
    let statusText = '';
    let statusClass = status;
    
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
                ${clientName ? `<div style="font-size: 12px; color: var(--sp-text-secondary); margin-top: 4px;">
                    <i class="fas fa-user"></i> ${clientName}
                </div>` : ''}
            </div>
        `;
    }
    
    let ticketControls = '';
    if (analyst.currentTicket) {
        ticketControls = `
            <div class="status-buttons">
                ${analyst.ticketStatus === 'aguardando-cliente' ? `
                    <button class="status-btn resume resume-ticket-btn" data-analyst-id="${analyst.id}">
                        <i class="fas fa-play"></i> Retomar
                    </button>
                ` : `
                    <button class="status-btn waiting waiting-client-btn" data-analyst-id="${analyst.id}">
                        <i class="fas fa-clock"></i> Aguardar
                    </button>
                `}
                <button class="status-btn finish finish-ticket-btn" data-analyst-id="${analyst.id}">
                    <i class="fas fa-check"></i> Finalizar
                </button>
            </div>
        `;
    } else {
        ticketControls = `
            <input type="text" class="input-field assign-ticket-input" 
                   placeholder="Nº Chamado" 
                   data-analyst-id="${analyst.id}"
                   style="font-size: 12px; padding: 6px 10px;">
            <button class="btn btn-small assign-ticket-btn" data-analyst-id="${analyst.id}">
                <i class="fas fa-paperclip"></i> Atribuir
            </button>
        `;
    }
    
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
                <div style="font-size: 12px; color: var(--sp-text-secondary); margin-top: 6px;">
                    <i class="fas fa-tasks"></i> Chamados hoje: ${analyst.ticketsHandled}
                </div>
            </div>
            
            <div class="analyst-status">
                <div class="status-indicator">
                    <span class="status-dot ${getStatusDotClass(analyst)}"></span>
                    <span>${statusText}</span>
                </div>
                ${analyst.specialClient ? `
                    <div style="font-size: 11px; color: var(--sp-purple); margin-top: 4px;">
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
    const specialClient = specialClients.find(c => 
        c.analyst === "Eric" && ticket === "TIM" ||
        c.analyst === "Tamiris" && ticket === "DPSP" ||
        c.analyst === "André" && ticket === "Benoit"
    );
    return specialClient ? specialClient.client : null;
}

function attachAnalystCardEvents() {
    // Botões de atribuir ticket
    document.querySelectorAll('.assign-ticket-btn').forEach(button => {
        button.addEventListener('click', function() {
            const analystId = parseInt(this.getAttribute('data-analyst-id'));
            const input = document.querySelector(`.assign-ticket-input[data-analyst-id="${analystId}"]`);
            const ticketNumber = input.value.trim();
            
            if (ticketNumber) {
                assignTicketToAnalyst(analystId, ticketNumber, 'normal', 'atendendo');
                input.value = '';
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

function updateSpecialCasesDisplay() {
    const specialCasesDiv = document.getElementById('specialCases');
    let specialCasesHTML = '';
    
    specialClients.forEach(special => {
        const analyst = analysts.find(a => a.name === special.analyst);
        const isAvailable = analyst ? analyst.isAvailable && !analyst.isBusy : false;
        const isBusy = analyst ? (analyst.isBusy && analyst.ticketStatus !== 'aguardando-cliente') || analyst.currentTicket === special.client : false;
        const isWaiting = analyst ? analyst.ticketStatus === 'aguardando-cliente' : false;
        
        specialCasesHTML += `
            <div class="special-client">
                <div class="client-info">
                    <div class="client-name">Cliente ${special.client}</div>
                    <div style="font-size: 13px; color: var(--sp-text-secondary); margin-top: 4px;">
                        Atendimento dedicado
                    </div>
                </div>
                <div>
                    <div class="assigned-analyst">${special.analyst} (${special.level})</div>
                    <div style="margin-top: 12px; text-align: center;">
                        <div class="status-indicator">
                            <span class="status-dot ${isWaiting ? 'status-waiting' : isBusy ? 'status-busy' : isAvailable ? 'status-available' : 'status-offline'}"></span>
                            <span style="font-size: 12px;">
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
    document.getElementById('totalTickets').textContent = state.ticketsToday;
    
    // Analistas ativos
    const activeAnalysts = analysts.filter(a => a.isAvailable && !a.isBusy).length;
    document.getElementById('activeAnalysts').textContent = activeAnalysts;
    
    // Próximo na fila
    let nextInQueue = '-';
    if (state.queueOrder.length > 0) {
        const nextIndex = (state.currentAnalystIndex + 1) % state.queueOrder.length;
        if (nextIndex < state.queueOrder.length) {
            nextInQueue = state.queueOrder[nextIndex].name;
        }
    }
    document.getElementById('nextInQueue').textContent = nextInQueue;
    
    // Chamados especiais
    document.getElementById('specialTickets').textContent = state.specialTicketsToday;
    
    // Chamados aguardando cliente
    const waitingTickets = analysts.filter(a => a.ticketStatus === 'aguardando-cliente').length;
    document.getElementById('waitingTickets').textContent = waitingTickets;
    state.waitingTicketsToday = waitingTickets;
    
    // Último reset
    document.getElementById('lastResetDate').textContent = state.lastReset;
    document.getElementById('lastResetInfo').textContent = `Fila reiniciada em: ${state.lastReset}`;
}

function handleNewTicket() {
    const ticketNumberInput = document.getElementById('newTicketNumber');
    const ticketTypeSelect = document.getElementById('ticketType');
    
    let ticketNumber = ticketNumberInput.value.trim();
    const ticketType = ticketTypeSelect.value;
    
    // Gerar número automático se não informado
    if (!ticketNumber) {
        ticketNumber = `CH-${state.nextTicketNumber}`;
        state.nextTicketNumber++;
    }
    
    // Processar chamado
    if (ticketType !== 'normal') {
        handleSpecialTicket(ticketNumber, ticketType);
    } else {
        handleNormalTicket(ticketNumber);
    }
    
    // Limpar campo
    ticketNumberInput.value = '';
    saveState();
}

function handleNormalTicket(ticketNumber) {
    if (state.queueOrder.length === 0) {
        showNotification('Nenhum analista disponível na fila!', 'warning');
        return;
    }
    
    const currentAnalyst = state.queueOrder[state.currentAnalystIndex];
    
    if (!currentAnalyst.isAvailable || (currentAnalyst.isBusy && currentAnalyst.ticketStatus !== 'aguardando-cliente')) {
        showNotification(`${currentAnalyst.name} não está disponível. Indo para o próximo...`, 'warning');
        nextAnalyst();
        
        const newCurrentAnalyst = state.queueOrder[state.currentAnalystIndex];
        if (newCurrentAnalyst && newCurrentAnalyst.isAvailable && !newCurrentAnalyst.isBusy) {
            assignTicketToAnalyst(newCurrentAnalyst.id, ticketNumber, 'normal', 'atendendo');
        } else {
            showNotification('Nenhum analista disponível!', 'error');
        }
        return;
    }
    
    assignTicketToAnalyst(currentAnalyst.id, ticketNumber, 'normal', 'atendendo');
    nextAnalyst();
    state.ticketsToday++;
    
    showNotification(`Chamado ${ticketNumber} atribuído a ${currentAnalyst.name}`, 'success');
}

function handleSpecialTicket(ticketNumber, ticketType) {
    const specialClient = specialClients.find(c => 
        ticketType === 'TIM' ? c.client === 'TIM' :
        ticketType === 'DPSP' ? c.client === 'DPSP' :
        ticketType === 'Benoit' ? c.client === 'Benoit' : false
    );
    
    if (!specialClient) {
        showNotification(`Cliente especial não encontrado!`, 'error');
        return;
    }
    
    const analyst = analysts.find(a => a.name === specialClient.analyst);
    
    if (!analyst) {
        showNotification(`Analista ${specialClient.analyst} não encontrado!`, 'error');
        return;
    }
    
    if (!analyst.isAvailable || (analyst.isBusy && analyst.ticketStatus !== 'aguardando-cliente')) {
        showNotification(`${analyst.name} não está disponível!`, 'warning');
        return;
    }
    
    assignTicketToAnalyst(analyst.id, ticketNumber, ticketType, 'atendendo');
    state.ticketsToday++;
    state.specialTicketsToday++;
    
    showNotification(`Chamado especial ${ticketNumber} atribuído a ${analyst.name}`, 'success');
}

function assignTicketToAnalyst(analystId, ticketNumber, ticketType, ticketStatus = 'atendendo') {
    const analyst = analysts.find(a => a.id === analystId);
    
    if (!analyst) return;
    
    analyst.isBusy = ticketStatus === 'atendendo';
    analyst.currentTicket = ticketNumber;
    analyst.ticketStatus = ticketStatus;
    
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
    
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
}

function setTicketWaiting(analystId) {
    const analyst = analysts.find(a => a.id === analystId);
    
    if (!analyst) return;
    
    // Colocar o chamado em espera (aguardando cliente)
    analyst.ticketStatus = 'aguardando-cliente';
    analyst.isBusy = false; // Fica disponível para nova chamada
    
    // Retornar à fila se for analista N1
    if (analyst.level === "N1" && analyst.inQueue) {
        updateQueueOrder();
    }
    
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    showNotification(`${analyst.name} está aguardando retorno do cliente`, 'info');
    saveState();
}

function resumeTicket(analystId) {
    const analyst = analysts.find(a => a.id === analystId);
    
    if (!analyst) return;
    
    // Retomar o atendimento do chamado em espera
    analyst.ticketStatus = 'atendendo';
    analyst.isBusy = true;
    
    // Se estiver na fila, remover temporariamente
    if (analyst.level === "N1" && analyst.inQueue) {
        updateQueueOrder();
    }
    
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    showNotification(`${analyst.name} retomou o atendimento`, 'success');
    saveState();
}

function finishTicket(analystId) {
    const analyst = analysts.find(a => a.id === analystId);
    
    if (!analyst) return;
    
    const ticketNumber = analyst.currentTicket;
    
    // Finalizar o chamado
    analyst.isBusy = false;
    analyst.currentTicket = null;
    analyst.ticketStatus = null;
    
    // Reintegrar à fila se for Eric ou Tamiris (casos especiais)
    if (analyst.name === "Eric" || analyst.name === "Tamiris") {
        analyst.inQueue = true;
    }
    
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    showNotification(`Chamado ${ticketNumber} finalizado por ${analyst.name}`, 'success');
    saveState();
}

function freeAllAnalysts() {
    let freedCount = 0;
    
    analysts.forEach(analyst => {
        if (analyst.isBusy || analyst.currentTicket) {
            analyst.isBusy = false;
            analyst.currentTicket = null;
            analyst.ticketStatus = null;
            analyst.inQueue = analyst.level === "N1";
            freedCount++;
        }
    });
    
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    showNotification(`${freedCount} analistas liberados`, 'success');
    saveState();
}

function nextAnalyst() {
    if (state.queueOrder.length === 0) {
        showNotification('Não há analistas na fila!', 'warning');
        return;
    }
    
    state.currentAnalystIndex = (state.currentAnalystIndex + 1) % state.queueOrder.length;
    updateQueueDisplay();
    updateStatistics();
    
    const currentAnalyst = state.queueOrder[state.currentAnalystIndex];
    showNotification(`Próximo analista: ${currentAnalyst.name}`, 'info');
    
    saveState();
}

function resetQueue() {
    if (!confirm('Tem certeza que deseja reiniciar a fila do dia?')) {
        return;
    }
    
    state.currentAnalystIndex = 0;
    state.queueOrder = [];
    state.lastReset = new Date().toLocaleDateString('pt-BR');
    state.dailyResetDone = false;
    
    analysts.forEach(analyst => {
        analyst.ticketsHandled = 0;
        analyst.isBusy = false;
        analyst.currentTicket = null;
        analyst.ticketStatus = null;
        analyst.inQueue = analyst.level === "N1";
    });
    
    state.ticketsToday = 0;
    state.specialTicketsToday = 0;
    state.waitingTicketsToday = 0;
    state.nextTicketNumber = 1000;
    
    updateQueueOrder();
    updateQueueDisplay();
    updateSpecialCasesDisplay();
    updateStatistics();
    
    showNotification('Fila reiniciada para o novo dia!', 'success');
    saveState();
}

function checkDailyReset() {
    const now = new Date();
    const today = now.toLocaleDateString('pt-BR');
    
    if (today !== state.lastReset && !state.dailyResetDone) {
        resetQueue();
        state.dailyResetDone = true;
    }
}

// ============================================
// FUNÇÕES DE SIMULAÇÃO DE HORÁRIO
// ============================================

function openTimeSimulationModal() {
    document.getElementById('timeSimulationModal').style.display = 'flex';
}

function closeTimeSimulationModal() {
    document.getElementById('timeSimulationModal').style.display = 'none';
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
    state.simulatedTime = simulatedDate;
    
    closeTimeSimulationModal();
    updateCurrentTime();
    
    showNotification(`Horário simulado: ${hour}:00`, 'success');
}

function returnToRealTime() {
    state.simulatedTime = null;
    updateCurrentTime();
    showNotification('Voltando ao horário real', 'info');
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function updateApp() {
    updateCurrentTime();
    updateLastUpdateTime();
    checkDailyReset();
}

function updateLastUpdateTime() {
    state.lastUpdate = new Date().toLocaleTimeString('pt-BR');
    document.getElementById('lastUpdate').textContent = state.lastUpdate;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
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

function saveState() {
    try {
        const stateToSave = {
            ...state,
            simulatedTime: state.simulatedTime ? state.simulatedTime.getTime() : null,
            analysts: analysts.map(a => ({
                id: a.id,
                ticketsHandled: a.ticketsHandled,
                isBusy: a.isBusy,
                currentTicket: a.currentTicket,
                ticketStatus: a.ticketStatus,
                inQueue: a.inQueue
            }))
        };
        
        localStorage.setItem('queuePortalState', JSON.stringify(stateToSave));
    } catch (e) {
        console.error('Erro ao salvar estado:', e);
    }
}

function loadState() {
    try {
        const savedState = localStorage.getItem('queuePortalState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            state.ticketsToday = parsedState.ticketsToday || 0;
            state.specialTicketsToday = parsedState.specialTicketsToday || 0;
            state.waitingTicketsToday = parsedState.waitingTicketsToday || 0;
            state.lastReset = parsedState.lastReset || new Date().toLocaleDateString('pt-BR');
            state.currentAnalystIndex = parsedState.currentAnalystIndex || 0;
            state.nextTicketNumber = parsedState.nextTicketNumber || 1000;
            state.dailyResetDone = parsedState.dailyResetDone || false;
            
            if (parsedState.simulatedTime) {
                state.simulatedTime = new Date(parsedState.simulatedTime);
            }
            
            if (parsedState.analysts) {
                parsedState.analysts.forEach(savedAnalyst => {
                    const analyst = analysts.find(a => a.id === savedAnalyst.id);
                    if (analyst) {
                        analyst.ticketsHandled = savedAnalyst.ticketsHandled || 0;
                        analyst.isBusy = savedAnalyst.isBusy || false;
                        analyst.currentTicket = savedAnalyst.currentTicket || null;
                        analyst.ticketStatus = savedAnalyst.ticketStatus || null;
                        analyst.inQueue = savedAnalyst.inQueue !== undefined ? savedAnalyst.inQueue : true;
                    }
                });
            }
            
            updateQueueOrder();
            updateQueueDisplay();
            updateSpecialCasesDisplay();
            updateStatistics();
            
            showNotification('Estado anterior restaurado', 'info');
        }
    } catch (e) {
        console.error('Erro ao carregar estado:', e);
    }
}

// Exportar para uso global (se necessário)
window.appState = state;
window.analysts = analysts;
