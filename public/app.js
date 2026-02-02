// ============================================
// PORTAL PAYHUB - SISTEMA DE FILA
// ============================================
// Versão: 4.0.0
// Data: 2024

class PortalPayhub {
    constructor() {
        this.appState = {
            ticketsToday: 0,
            specialTicketsToday: 0,
            waitingTicketsToday: 0,
            lastReset: new Date().toLocaleDateString('pt-BR'),
            nextTicketNumber: 1000,
            simulatedTime: null,
            dailyResetDone: false,
            version: '4.0.0'
        };
        
        this.analysts = [];
        this.queue = [];
        this.specialClients = [
            { client: "Benoit", analyst: "André", level: "N1" },
            { client: "TIM", analyst: "Eric", level: "N1" },
            { client: "DPSP", analyst: "Felipe", level: "N1" }
        ];
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando Portal Payhub v4.0.0...');
        
        try {
            // Esperar Firebase carregar
            await this.waitForFirebase();
            
            // Carregar dados
            await this.loadData();
            
            // Inicializar interface
            this.initializeUI();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Configurar atualizações automáticas
            this.setupAutoUpdates();
            
            console.log('✅ Sistema inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.showNotification('Erro ao inicializar sistema', 'error');
        }
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 30;
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (window.firebaseAppIntegration && window.firebaseAppIntegration.initialized) {
                    clearInterval(checkInterval);
                    resolve();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.warn('⚠️ Firebase não inicializado, continuando offline');
                    resolve();
                }
            }, 500);
        });
    }

    async loadData() {
        console.log('📂 Carregando dados do sistema...');
        
        // Carregar analistas do Firebase
        if (window.firebaseAppIntegration) {
            this.analysts = window.firebaseAppIntegration.getAnalysts();
            console.log(`📋 ${this.analysts.length} analistas carregados`);
        }
        
        // Carregar estado do localStorage
        this.loadLocalState();
        
        // Atualizar disponibilidade dos analistas
        this.updateAnalystAvailability();
        
        // Organizar fila
        this.updateQueue();
        
        // Verificar reset diário
        this.checkDailyReset();
    }

    loadLocalState() {
        try {
            const saved = localStorage.getItem('portal_payhub_state');
            if (saved) {
                const state = JSON.parse(saved);
                
                // Carregar estado do aplicativo
                if (state.appState) {
                    this.appState.ticketsToday = state.appState.ticketsToday || 0;
                    this.appState.specialTicketsToday = state.appState.specialTicketsToday || 0;
                    this.appState.waitingTicketsToday = state.appState.waitingTicketsToday || 0;
                    this.appState.lastReset = state.appState.lastReset || new Date().toLocaleDateString('pt-BR');
                    this.appState.nextTicketNumber = state.appState.nextTicketNumber || 1000;
                    this.appState.dailyResetDone = state.appState.dailyResetDone || false;
                    
                    if (state.appState.simulatedTime) {
                        this.appState.simulatedTime = new Date(state.appState.simulatedTime);
                    }
                }
                
                // Carregar estado dos analistas
                if (state.analysts && this.analysts.length > 0) {
                    state.analysts.forEach(savedAnalyst => {
                        const index = this.analysts.findIndex(a => a.id === savedAnalyst.id);
                        if (index !== -1) {
                            this.analysts[index] = {
                                ...this.analysts[index],
                                isBusy: savedAnalyst.isBusy || false,
                                currentTicket: savedAnalyst.currentTicket || null,
                                ticketStatus: savedAnalyst.ticketStatus || null,
                                ticketSpecialType: savedAnalyst.ticketSpecialType || null,
                                ticketsHandled: savedAnalyst.ticketsHandled || 0,
                                isWaitingForClient: savedAnalyst.isWaitingForClient || false,
                                lastActivity: savedAnalyst.lastActivity ? new Date(savedAnalyst.lastActivity) : null
                            };
                        }
                    });
                }
                
                console.log('✅ Estado local carregado');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar estado local:', error);
        }
    }

    saveLocalState() {
        try {
            const state = {
                appState: {
                    ...this.appState,
                    simulatedTime: this.appState.simulatedTime ? this.appState.simulatedTime.getTime() : null
                },
                analysts: this.analysts.map(analyst => ({
                    id: analyst.id,
                    isBusy: analyst.isBusy,
                    currentTicket: analyst.currentTicket,
                    ticketStatus: analyst.ticketStatus,
                    ticketSpecialType: analyst.ticketSpecialType,
                    ticketsHandled: analyst.ticketsHandled,
                    isWaitingForClient: analyst.isWaitingForClient,
                    lastActivity: analyst.lastActivity ? analyst.lastActivity.toISOString() : null
                })),
                savedAt: new Date().toISOString(),
                version: '4.0.0'
            };
            
            localStorage.setItem('portal_payhub_state', JSON.stringify(state));
            
            // Salvar também no Firebase se disponível
            if (window.firebaseAppIntegration && window.firebaseAppIntegration.initialized) {
                // Atualizar analistas no Firebase
                this.analysts.forEach(analyst => {
                    window.firebaseAppIntegration.updateAnalyst(analyst.id, {
                        isBusy: analyst.isBusy,
                        currentTicket: analyst.currentTicket,
                        ticketStatus: analyst.ticketStatus,
                        ticketSpecialType: analyst.ticketSpecialType,
                        ticketsHandled: analyst.ticketsHandled,
                        isWaitingForClient: analyst.isWaitingForClient,
                        lastActivity: analyst.lastActivity ? analyst.lastActivity.toISOString() : null
                    });
                });
            }
            
            console.log('💾 Estado salvo');
            
        } catch (error) {
            console.error('❌ Erro ao salvar estado:', error);
        }
    }

    // ============================================
    // GERENCIAMENTO DE ANALISTAS
    // ============================================

    updateAnalystAvailability() {
        const now = this.appState.simulatedTime ? new Date(this.appState.simulatedTime) : new Date();
        const currentHour = now.getHours();
        
        this.analysts.forEach(analyst => {
            // Verificar se está no horário de trabalho
            const inTime = currentHour >= analyst.startTime && currentHour < analyst.endTime;
            
            // Atualizar disponibilidade
            analyst.isAvailable = inTime && analyst.isActive;
            
            // Se saiu do horário, liberar
            if (!analyst.isAvailable && analyst.isBusy) {
                this.freeAnalyst(analyst.id);
            }
        });
    }

    updateQueue() {
        // Organizar fila baseada no horário
        const now = this.appState.simulatedTime ? new Date(this.appState.simulatedTime) : new Date();
        const currentHour = now.getHours();
        
        this.queue = this.analysts
            .filter(analyst => {
                // Deve estar disponível, não ocupado e na fila
                return analyst.isAvailable && 
                       !analyst.isBusy && 
                       analyst.inQueue &&
                       // Verificar horário específico
                       currentHour >= analyst.startTime && 
                       currentHour < analyst.endTime;
            })
            .sort((a, b) => {
                // Ordenar por:
                // 1. Horário de início (mais cedo primeiro)
                // 2. Menos tickets atendidos
                // 3. Ordem alfabética
                if (a.startTime !== b.startTime) {
                    return a.startTime - b.startTime;
                }
                
                if (a.ticketsHandled !== b.ticketsHandled) {
                    return a.ticketsHandled - b.ticketsHandled;
                }
                
                return a.name.localeCompare(b.name);
            });
    }

    getNextAnalyst() {
        if (this.queue.length === 0) {
            return null;
        }
        
        // Obter último índice usado
        const lastIndex = parseInt(localStorage.getItem('queue_index') || '0');
        let nextIndex = lastIndex % this.queue.length;
        
        // Verificar se o analista ainda está disponível
        let attempts = 0;
        while (attempts < this.queue.length) {
            const analyst = this.queue[nextIndex];
            if (analyst.isAvailable && !analyst.isBusy) {
                // Salvar novo índice
                localStorage.setItem('queue_index', (nextIndex + 1).toString());
                return analyst;
            }
            
            // Tentar próximo
            nextIndex = (nextIndex + 1) % this.queue.length;
            attempts++;
        }
        
        return null;
    }

    // ============================================
    // ATRIBUIÇÃO DE TICKETS
    // ============================================

    async assignTicket(ticketNumber, ticketType = 'normal') {
        console.log(`🎫 Atribuindo ticket ${ticketNumber} (${ticketType})...`);
        
        // Verificar se é cliente especial
        if (this.isSpecialClient(ticketType)) {
            return await this.assignSpecialTicket(ticketNumber, ticketType);
        }
        
        // Ticket normal - usar fila
        const analyst = this.getNextAnalyst();
        if (!analyst) {
            this.showNotification('Nenhum analista disponível na fila', 'warning');
            return false;
        }
        
        return await this.assignToAnalyst(analyst.id, ticketNumber, 'normal');
    }

    async assignSpecialTicket(ticketNumber, clientType) {
        const special = this.specialClients.find(c => c.client === clientType);
        if (!special) {
            this.showNotification('Cliente especial não encontrado', 'error');
            return false;
        }
        
        const analyst = this.analysts.find(a => a.name === special.analyst);
        if (!analyst) {
            this.showNotification('Analista não encontrado', 'error');
            return false;
        }
        
        if (!analyst.isAvailable) {
            this.showNotification(`${analyst.name} não está disponível`, 'warning');
            return false;
        }
        
        if (analyst.isBusy) {
            // Se está aguardando SEU cliente especial, retomar
            if (analyst.ticketStatus === 'aguardando-cliente' && analyst.ticketSpecialType === clientType) {
                return await this.resumeTicket(analyst.id);
            }
            
            this.showNotification(`${analyst.name} já está em atendimento`, 'warning');
            return false;
        }
        
        return await this.assignToAnalyst(analyst.id, ticketNumber, clientType);
    }

    async assignToAnalyst(analystId, ticketNumber, ticketType) {
        const analyst = this.analysts.find(a => a.id === analystId);
        if (!analyst) {
            this.showNotification('Analista não encontrado', 'error');
            return false;
        }
        
        if (!analyst.isAvailable) {
            this.showNotification(`${analyst.name} não está disponível`, 'warning');
            return false;
        }
        
        if (analyst.isBusy) {
            this.showNotification(`${analyst.name} já está em atendimento`, 'warning');
            return false;
        }
        
        // Verificar se ticket já existe
        const existingTicket = this.analysts.find(a => a.currentTicket === ticketNumber);
        if (existingTicket) {
            this.showNotification(`Ticket ${ticketNumber} já está em atendimento`, 'warning');
            return false;
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
        
        // Atualizar estatísticas
        if (ticketType === 'normal') {
            this.appState.ticketsToday++;
        } else {
            this.appState.specialTicketsToday++;
        }
        
        // Salvar ticket no Firebase
        if (window.firebaseAppIntegration) {
            await window.firebaseAppIntegration.saveTicket(
                ticketNumber,
                analyst.name,
                'iniciado',
                ticketType
            );
        }
        
        // Atualizar interface
        this.updateUI();
        
        // Salvar estado
        this.saveLocalState();
        
        this.showNotification(`Ticket ${ticketNumber} atribuído a ${analyst.name}`, 'success');
        return true;
    }

    async finishTicket(analystId) {
        const analyst = this.analysts.find(a => a.id === analystId);
        if (!analyst) {
            this.showNotification('Analista não encontrado', 'error');
            return false;
        }
        
        const ticketNumber = analyst.currentTicket;
        
        // Atualizar ticket no Firebase
        if (window.firebaseAppIntegration && ticketNumber) {
            await window.firebaseAppIntegration.updateTicket(
                ticketNumber,
                'finalizado',
                analyst.name
            );
        }
        
        // Liberar analista
        analyst.isBusy = false;
        analyst.currentTicket = null;
        analyst.ticketStatus = null;
        analyst.ticketSpecialType = null;
        analyst.inQueue = analyst.isAvailable;
        analyst.isWaitingForClient = false;
        analyst.lastActivity = new Date();
        
        // Atualizar interface
        this.updateUI();
        
        // Salvar estado
        this.saveLocalState();
        
        this.showNotification(`Ticket ${ticketNumber} finalizado`, 'success');
        return true;
    }

    async setWaiting(analystId) {
        const analyst = this.analysts.find(a => a.id === analystId);
        if (!analyst) {
            this.showNotification('Analista não encontrado', 'error');
            return false;
        }
        
        const ticketNumber = analyst.currentTicket;
        
        // Atualizar ticket no Firebase
        if (window.firebaseAppIntegration && ticketNumber) {
            await window.firebaseAppIntegration.updateTicket(
                ticketNumber,
                'aguardando',
                analyst.name
            );
        }
        
        // Colocar em espera
        analyst.ticketStatus = 'aguardando-cliente';
        analyst.isBusy = false;
        analyst.isWaitingForClient = true;
        analyst.inQueue = true;
        analyst.lastActivity = new Date();
        
        // Atualizar interface
        this.updateUI();
        
        // Salvar estado
        this.saveLocalState();
        
        this.showNotification(`${analyst.name} aguardando retorno do cliente`, 'info');
        return true;
    }

    async resumeTicket(analystId) {
        const analyst = this.analysts.find(a => a.id === analystId);
        if (!analyst) {
            this.showNotification('Analista não encontrado', 'error');
            return false;
        }
        
        const ticketNumber = analyst.currentTicket;
        
        // Atualizar ticket no Firebase
        if (window.firebaseAppIntegration && ticketNumber) {
            await window.firebaseAppIntegration.updateTicket(
                ticketNumber,
                'iniciado',
                analyst.name
            );
        }
        
        // Retomar atendimento
        analyst.ticketStatus = 'atendendo';
        analyst.isBusy = true;
        analyst.isWaitingForClient = false;
        analyst.inQueue = false;
        analyst.lastActivity = new Date();
        
        // Atualizar interface
        this.updateUI();
        
        // Salvar estado
        this.saveLocalState();
        
        this.showNotification(`${analyst.name} retomou o atendimento`, 'success');
        return true;
    }

    freeAnalyst(analystId) {
        const analyst = this.analysts.find(a => a.id === analystId);
        if (!analyst) return false;
        
        analyst.isBusy = false;
        analyst.currentTicket = null;
        analyst.ticketStatus = null;
        analyst.ticketSpecialType = null;
        analyst.isWaitingForClient = false;
        analyst.inQueue = analyst.isAvailable;
        analyst.lastActivity = new Date();
        
        return true;
    }

    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================

    isSpecialClient(clientType) {
        return this.specialClients.some(c => c.client === clientType);
    }

    checkDailyReset() {
        const today = new Date().toLocaleDateString('pt-BR');
        if (today !== this.appState.lastReset && !this.appState.dailyResetDone) {
            this.resetDay();
            this.appState.dailyResetDone = true;
        }
    }

    resetDay() {
        // Resetar estatísticas
        this.appState.ticketsToday = 0;
        this.appState.specialTicketsToday = 0;
        this.appState.waitingTicketsToday = 0;
        this.appState.lastReset = new Date().toLocaleDateString('pt-BR');
        this.appState.nextTicketNumber = 1000;
        
        // Resetar índices da fila
        localStorage.removeItem('queue_index');
        localStorage.removeItem('last_queue_index');
        
        // Liberar analistas (mantendo horários)
        this.analysts.forEach(analyst => {
            analyst.isBusy = false;
            analyst.currentTicket = null;
            analyst.ticketStatus = null;
            analyst.ticketSpecialType = null;
            analyst.ticketsHandled = 0;
            analyst.isWaitingForClient = false;
            analyst.inQueue = analyst.isAvailable;
            analyst.lastActivity = null;
        });
        
        // Atualizar interface
        this.updateUI();
        
        // Salvar estado
        this.saveLocalState();
        
        this.showNotification('Dia reiniciado com sucesso!', 'success');
    }

    freeAllAnalysts() {
        this.analysts.forEach(analyst => {
            this.freeAnalyst(analyst.id);
        });
        
        this.updateUI();
        this.saveLocalState();
        
        this.showNotification('Todos os analistas foram liberados', 'success');
    }

    // ============================================
    // INTERFACE DO USUÁRIO
    // ============================================

    initializeUI() {
        // Atualizar hora atual
        this.updateCurrentTime();
        
        // Atualizar estatísticas
        this.updateStatistics();
        
        // Atualizar colunas de analistas
        this.updateAnalystColumns();
        
        // Atualizar clientes especiais
        this.updateSpecialClients();
        
        // Atualizar fila de espera
        this.updateWaitingQueue();
    }

    updateUI() {
        this.updateAnalystAvailability();
        this.updateQueue();
        this.updateStatistics();
        this.updateAnalystColumns();
        this.updateSpecialClients();
        this.updateWaitingQueue();
    }

    updateCurrentTime() {
        const now = this.appState.simulatedTime ? new Date(this.appState.simulatedTime) : new Date();
        
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
        
        // Atualizar elementos na página
        const dateElement = document.getElementById('currentDate');
        const timeElement = document.getElementById('currentTime');
        
        if (dateElement) dateElement.textContent = dateStr;
        if (timeElement) timeElement.textContent = timeStr;
        
        // Atualizar hora do último update
        const updateElement = document.getElementById('lastUpdate');
        if (updateElement) {
            updateElement.textContent = new Date().toLocaleTimeString('pt-BR');
        }
    }

    updateStatistics() {
        // Atualizar elementos na página
        const elements = {
            totalTickets: this.appState.ticketsToday,
            specialTickets: this.appState.specialTicketsToday,
            waitingTickets: this.analysts.filter(a => a.isWaitingForClient).length,
            availableAnalysts: this.analysts.filter(a => a.isAvailable && !a.isBusy).length,
            busyAnalysts: this.analysts.filter(a => a.isBusy).length,
            nextInQueue: this.queue.length > 0 ? this.queue[0].name : '-'
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
    }

    updateAnalystColumns() {
        const container = document.getElementById('analystStatusColumns');
        if (!container) return;
        
        // Analistas disponíveis
        const availableAnalysts = this.analysts.filter(a => 
            a.isAvailable && !a.isBusy && !a.isWaitingForClient
        );
        
        // Analistas ocupados
        const busyAnalysts = this.analysts.filter(a => 
            a.isAvailable && a.isBusy && !a.isWaitingForClient
        );
        
        // Analistas aguardando
        const waitingAnalysts = this.analysts.filter(a => 
            a.isWaitingForClient
        );
        
        // Analistas offline
        const offlineAnalysts = this.analysts.filter(a => 
            !a.isAvailable
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
                html += this.createAnalystCard(analyst, 'available');
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
                html += this.createAnalystCard(analyst, 'busy');
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
                        <button class="btn-small resume-btn" onclick="portal.resumeTicket(${analyst.id})">
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
    }

    createAnalystCard(analyst, status) {
        let statusText = status === 'available' ? 'DISPONÍVEL' : 'EM ATENDIMENTO';
        let statusClass = status === 'available' ? 'available' : 'busy';
        let ticketInfo = '';
        let quickAssign = '';
        
        if (status === 'available') {
            quickAssign = `
                <div class="quick-assign">
                    <input type="text" class="quick-input" data-id="${analyst.id}" 
                           placeholder="Nº chamado" value="">
                    <button class="btn-small assign-btn" onclick="portal.handleQuickAssign(${analyst.id})">
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
                        <button class="btn-small wait-btn" onclick="portal.setWaiting(${analyst.id})">
                            <i class="fas fa-clock"></i> Aguardar
                        </button>
                        <button class="btn-small finish-btn" onclick="portal.finishTicket(${analyst.id})">
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

    updateSpecialClients() {
        const container = document.getElementById('specialCases');
        if (!container) return;
        
        let html = '';
        
        this.specialClients.forEach(special => {
            const analyst = this.analysts.find(a => a.name === special.analyst);
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

    updateWaitingQueue() {
        const container = document.getElementById('waitingQueue');
        if (!container) return;
        
        // Analistas na fila de espera (disponíveis e não ocupados)
        const waitingAnalysts = this.queue.filter(analyst => 
            analyst.isAvailable && !analyst.isBusy && !analyst.isWaitingForClient
        );
        
        let html = '';
        
        if (waitingAnalysts.length > 0) {
            waitingAnalysts.forEach((analyst, index) => {
                html += `
                    <div class="waiting-item">
                        <div>
                            <strong>${index + 1}. ${analyst.name}</strong>
                            <div style="font-size: 12px; color: #6c757d;">
                                ${analyst.startTime}h-${analyst.endTime}h • 
                                ${analyst.ticketsHandled} tickets hoje
                            </div>
                        </div>
                        <button class="btn-small" onclick="portal.assignToAnalyst(${analyst.id}, prompt('Número do ticket:'))">
                            <i class="fas fa-user-check"></i> Atribuir
                        </button>
                    </div>
                `;
            });
        } else {
            html = '<div class="empty-state">Nenhum analista na fila de espera</div>';
        }
        
        container.innerHTML = html;
    }

    // ============================================
    // HANDLERS DE EVENTOS
    // ============================================

    handleQuickAssign(analystId) {
        const input = document.querySelector(`.quick-input[data-id="${analystId}"]`);
        if (!input) return;
        
        const ticketNumber = input.value.trim();
        if (!ticketNumber) {
            this.showNotification('Digite o número do ticket', 'warning');
            input.focus();
            return;
        }
        
        this.assignToAnalyst(analystId, ticketNumber, 'normal');
        input.value = '';
    }

    async handleNewTicket() {
        const ticketInput = document.getElementById('newTicketNumber');
        const typeSelect = document.getElementById('ticketType');
        
        if (!ticketInput || !typeSelect) return;
        
        const ticketNumber = ticketInput.value.trim();
        const ticketType = typeSelect.value;
        
        if (!ticketNumber) {
            this.showNotification('Digite o número do ticket', 'warning');
            ticketInput.focus();
            return;
        }
        
        // Verificar se ticket já existe
        const existing = this.analysts.find(a => a.currentTicket === ticketNumber);
        if (existing) {
            this.showNotification('Ticket já está em atendimento', 'warning');
            ticketInput.select();
            return;
        }
        
        const success = await this.assignTicket(ticketNumber, ticketType);
        
        if (success) {
            ticketInput.value = '';
            ticketInput.focus();
        }
    }

    // ============================================
    // CONFIGURAÇÃO DE EVENTOS
    // ============================================

    setupEventListeners() {
        // Botão de adicionar ticket
        const addBtn = document.getElementById('addTicketBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.handleNewTicket());
        }
        
        // Input de ticket (Enter)
        const ticketInput = document.getElementById('newTicketNumber');
        if (ticketInput) {
            ticketInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleNewTicket();
            });
        }
        
        // Botão de reiniciar dia
        const resetBtn = document.getElementById('resetQueueBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Reiniciar o dia? Isso zerará todas as estatísticas.')) {
                    this.resetDay();
                }
            });
        }
        
        // Botão de liberar todos
        const freeBtn = document.getElementById('freeAllBtn');
        if (freeBtn) {
            freeBtn.addEventListener('click', () => {
                if (confirm('Liberar todos os analistas?')) {
                    this.freeAllAnalysts();
                }
            });
        }
        
        // Botão de próximo na fila
        const nextBtn = document.getElementById('nextAnalystBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const next = this.getNextAnalyst();
                if (next) {
                    this.showNotification(`Próximo: ${next.name}`, 'info');
                } else {
                    this.showNotification('Nenhum analista disponível', 'warning');
                }
            });
        }
        
        console.log('✅ Event listeners configurados');
    }

    setupAutoUpdates() {
        // Atualizar hora a cada segundo
        setInterval(() => this.updateCurrentTime(), 1000);
        
        // Atualizar disponibilidade a cada minuto
        setInterval(() => {
            this.updateAnalystAvailability();
            this.updateQueue();
            this.updateUI();
        }, 60000);
        
        // Salvar estado a cada 30 segundos
        setInterval(() => this.saveLocalState(), 30000);
        
        // Verificar reset diário a cada hora
        setInterval(() => this.checkDailyReset(), 3600000);
        
        console.log('✅ Auto-updates configurados');
    }

    // ============================================
    // FUNÇÕES DE NOTIFICAÇÃO
    // ============================================

    showNotification(message, type = 'info') {
        // Criar elemento
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Adicionar ao body
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

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
}

// ============================================
// INICIALIZAÇÃO GLOBAL
// ============================================

// Instanciar portal
window.portal = new PortalPayhub();

// Funções globais para acesso via HTML
window.assignTicket = (ticketNumber, ticketType) => portal.assignTicket(ticketNumber, ticketType);
window.assignToAnalyst = (analystId, ticketNumber, ticketType = 'normal') => portal.assignToAnalyst(analystId, ticketNumber, ticketType);
window.finishTicket = (analystId) => portal.finishTicket(analystId);
window.setWaiting = (analystId) => portal.setWaiting(analystId);
window.resumeTicket = (analystId) => portal.resumeTicket(analystId);
window.handleQuickAssign = (analystId) => portal.handleQuickAssign(analystId);

console.log('✅ Portal Payhub v4.0.0 carregado');
