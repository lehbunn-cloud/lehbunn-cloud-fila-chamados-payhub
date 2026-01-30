// ============================================
// INTEGRAÇÃO FIREBASE - APP LOGIC
// ============================================

class FirebaseAppIntegration {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
    }

    async init() {
        try {
            console.log('🔧 Inicializando Firebase App Integration...');
            
            // Aguardar um pouco para garantir que firebase-config.js foi carregado
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verificar se firebaseConfig está disponível
            if (!window.firebaseConfig) {
                console.warn('⚠️ window.firebaseConfig não encontrado. Aguardando...');
                await this.waitForFirebaseConfig();
            }
            
            // Obter referências do Firebase
            const refs = window.firebaseConfig?.getFirebaseRefs();
            if (!refs || !refs.db) {
                console.error('❌ Referências do Firebase não disponíveis');
                await this.retryInitialization();
                return;
            }

            this.db = refs.db;
            this.auth = refs.auth;
            this.initialized = true;
            this.retryCount = 0;
            
            console.log('✅ Firebase App Integration inicializado');
            
            // Testar conexão em segundo plano
            setTimeout(() => this.testConnection(), 1000);
            
            // Sincronizar tickets offline se houver
            setTimeout(() => this.syncOfflineTickets(), 2000);
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase App Integration:', error);
            await this.retryInitialization();
        }
    }

    async waitForFirebaseConfig() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (window.firebaseConfig) {
                    clearInterval(checkInterval);
                    console.log('✅ firebaseConfig carregado após', attempts, 'tentativas');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.error('❌ Timeout aguardando firebaseConfig');
                    reject(new Error('Firebase config não carregado'));
                }
            }, 300);
        });
    }

    async retryInitialization() {
        if (this.retryCount >= this.maxRetries) {
            console.error('❌ Máximo de tentativas de inicialização excedido');
            this.setupOfflineMode();
            return;
        }
        
        this.retryCount++;
        console.log(`🔄 Tentativa ${this.retryCount}/${this.maxRetries} de inicialização...`);
        
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        await this.init();
    }

    setupOfflineMode() {
        console.warn('⚠️ Configurando modo offline');
        this.initialized = false;
        
        // Mostrar notificação de modo offline
        if (typeof showNotification === 'function') {
            setTimeout(() => {
                showNotification('Sistema operando em modo offline', 'warning');
            }, 1000);
        }
    }

    async testConnection() {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível para teste de conexão');
            return;
        }

        try {
            const testRef = this.db.collection('_test').doc('connection');
            await testRef.set({
                test: true,
                timestamp: new Date().toISOString(),
                app: 'Payhub Queue Portal'
            });
            console.log('✅ Conexão com Firebase testada com sucesso');
        } catch (error) {
            console.error('❌ Erro ao testar conexão Firebase:', error.code, error.message);
        }
    }

    // ============================================
    // FUNÇÕES PARA TICKETS/CHAMADOS
    // ============================================

    async saveTicketToFirebase(ticketNumber, analystName, status = 'iniciado', clientType = 'normal') {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível. Salvando localmente...');
            this.saveToLocalStorage(ticketNumber, analystName, status, clientType);
            return null;
        }

        try {
            const ticketData = {
                ticketNumber: ticketNumber.toString(),
                analystName: analystName,
                status: status, // 'iniciado', 'aguardando', 'finalizado'
                clientType: clientType,
                startTime: new Date().toISOString(),
                endTime: status === 'finalizado' ? new Date().toISOString() : null,
                duration: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Gerar ID único para o ticket
            const ticketId = `ticket_${ticketNumber}_${Date.now()}`;
            
            // Salvar na coleção 'tickets'
            await this.db.collection('tickets').doc(ticketId).set(ticketData);
            
            console.log(`✅ Ticket ${ticketNumber} salvo no Firebase`);
            return ticketId;
            
        } catch (error) {
            console.error('❌ Erro ao salvar ticket no Firebase:', error.code, error.message);
            this.saveToLocalStorage(ticketNumber, analystName, status, clientType);
            return null;
        }
    }

    async updateTicketStatus(ticketNumber, status, analystName = null) {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível para atualização');
            return false;
        }

        try {
            console.log(`🔍 Buscando ticket ${ticketNumber} para atualizar para: ${status}`);
            
            // BUSCA SIMPLIFICADA - Não usa ordem para evitar necessidade de índice
            const ticketsRef = this.db.collection('tickets');
            const querySnapshot = await ticketsRef
                .where('ticketNumber', '==', ticketNumber.toString())
                .get();
            
            if (querySnapshot.empty) {
                console.warn(`⚠️ Ticket ${ticketNumber} não encontrado`);
                return false;
            }

            // Encontrar o ticket mais recente NÃO finalizado
            let latestTicket = null;
            let latestDoc = null;
            
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.status !== 'finalizado') {
                    if (!latestTicket || new Date(data.createdAt) > new Date(latestTicket.createdAt)) {
                        latestTicket = data;
                        latestDoc = doc;
                    }
                }
            });

            if (!latestDoc) {
                console.warn(`⚠️ Ticket ${ticketNumber} não encontrado para atualização`);
                return false;
            }

            const updateData = {
                status: status,
                updatedAt: new Date().toISOString()
            };

            if (status === 'finalizado') {
                updateData.endTime = new Date().toISOString();
                
                // Calcular duração
                if (latestTicket.startTime) {
                    const startTime = new Date(latestTicket.startTime);
                    const endTime = new Date();
                    const durationMs = endTime - startTime;
                    updateData.duration = Math.round(durationMs / 1000);
                }
            }

            if (analystName) {
                updateData.analystName = analystName;
            }

            await latestDoc.ref.update(updateData);
            console.log(`✅ Ticket ${ticketNumber} atualizado para: ${status}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar ticket:', error.code, error.message);
            
            // Fallback: Criar novo registro se não conseguir atualizar
            if (error.code === 'failed-precondition') {
                console.log('🔄 Usando fallback para ticket:', ticketNumber);
                return await this.saveTicketToFirebase(
                    ticketNumber,
                    analystName || 'Unknown',
                    status,
                    'normal'
                ).then(id => !!id);
            }
            
            return false;
        }
    }

    // ============================================
    // FUNÇÕES PARA PERSISTÊNCIA DE ESTADO
    // ============================================

    async saveAnalystsState(analystsData) {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível para salvar estado');
            return false;
        }

        try {
            const batch = this.db.batch();
            const timestamp = new Date().toISOString();
            
            // Limpar coleção anterior
            const existingSnapshot = await this.db.collection('analysts_state').get();
            existingSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Salvar novos dados
            analystsData.forEach(analyst => {
                const analystRef = this.db.collection('analysts_state').doc(`analyst_${analyst.id}`);
                const analystData = {
                    ...analyst,
                    savedAt: timestamp,
                    sessionId: this.getSessionId()
                };
                batch.set(analystRef, analystData);
            });
            
            await batch.commit();
            console.log(`✅ Estado de ${analystsData.length} analistas salvo no Firebase`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao salvar estado dos analistas:', error);
            return false;
        }
    }

    async loadAnalystsState() {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível para carregar estado');
            return null;
        }

        try {
            const snapshot = await this.db.collection('analysts_state')
                .orderBy('savedAt', 'desc')
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                console.log('ℹ️ Nenhum estado salvo encontrado no Firebase');
                return null;
            }
            
            const latestState = snapshot.docs[0].data();
            console.log(`✅ Estado carregado do Firebase (salvo em: ${latestState.savedAt})`);
            
            return latestState;
            
        } catch (error) {
            console.error('❌ Erro ao carregar estado do Firebase:', error);
            return null;
        }
    }

    async loadAnalystsStateFull() {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível para carregar estado');
            return [];
        }

        try {
            const snapshot = await this.db.collection('analysts_state').get();
            
            if (snapshot.empty) {
                console.log('ℹ️ Nenhum estado de analistas encontrado');
                return [];
            }
            
            const analystsData = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.id && data.name) {
                    analystsData.push(data);
                }
            });
            
            console.log(`✅ ${analystsData.length} analistas carregados do Firebase`);
            return analystsData;
            
        } catch (error) {
            console.error('❌ Erro ao carregar estado dos analistas:', error);
            return [];
        }
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('queue_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('queue_session_id', sessionId);
        }
        return sessionId;
    }

    // ============================================
    // FUNÇÕES PARA RELATÓRIOS
    // ============================================

    async getTicketsByDateRange(startDate, endDate, includeAll = false) {
        if (!this.initialized || !this.db) {
            console.error('❌ Firebase não disponível para gerar relatório');
            return [];
        }

        try {
            // Converter strings de data para objetos Date
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Fim do dia
            
            let query = this.db.collection('tickets')
                .where('createdAt', '>=', start.toISOString())
                .where('createdAt', '<=', end.toISOString());

            // Se não for para incluir todos, filtrar apenas especiais
            if (!includeAll) {
                query = query.where('clientType', '!=', 'normal');
            }

            const querySnapshot = await query.orderBy('createdAt', 'asc').get();
            
            const tickets = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                tickets.push({
                    id: doc.id,
                    ...data
                });
            });

            console.log(`✅ ${tickets.length} tickets encontrados para o período`);
            return tickets;
            
        } catch (error) {
            console.error('❌ Erro ao buscar tickets:', error.code, error.message);
            return [];
        }
    }

    async generateCSVReport(startDate, endDate, includeAll = false) {
        const tickets = await this.getTicketsByDateRange(startDate, endDate, includeAll);
        
        if (tickets.length === 0) {
            return null;
        }

        // Cabeçalho do CSV
        const headers = [
            'Número do Ticket',
            'Analista',
            'Status',
            'Tipo de Cliente',
            'Horário Início',
            'Horário Fim',
            'Duração (segundos)',
            'Data Criação'
        ];

        // Converter dados para CSV
        const csvRows = [];
        
        // Adicionar cabeçalho
        csvRows.push(headers.join(';'));
        
        // Adicionar dados
        tickets.forEach(ticket => {
            const row = [
                ticket.ticketNumber,
                ticket.analystName,
                ticket.status,
                ticket.clientType,
                this.formatDateForCSV(ticket.startTime),
                this.formatDateForCSV(ticket.endTime),
                ticket.duration || '',
                this.formatDateForCSV(ticket.createdAt)
            ];
            csvRows.push(row.join(';'));
        });

        const csvString = csvRows.join('\n');
        return csvString;
    }

    formatDateForCSV(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('pt-BR');
        } catch (error) {
            return dateString;
        }
    }

    downloadCSV(csvString, filename = 'relatorio_chamados.csv') {
        if (!csvString) {
            console.error('❌ Nenhum dado para exportar');
            return false;
        }

        try {
            // Adicionar BOM para UTF-8
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Liberar memória
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
            
            console.log(`✅ Relatório CSV gerado: ${filename}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao gerar CSV:', error);
            return false;
        }
    }

    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================

    saveToLocalStorage(ticketNumber, analystName, status, clientType) {
        try {
            const tickets = JSON.parse(localStorage.getItem('offlineTickets') || '[]');
            tickets.push({
                ticketNumber,
                analystName,
                status,
                clientType,
                timestamp: new Date().toISOString(),
                synced: false
            });
            
            // Manter apenas os últimos 100 tickets offline
            if (tickets.length > 100) {
                tickets.splice(0, tickets.length - 100);
            }
            
            localStorage.setItem('offlineTickets', JSON.stringify(tickets));
            console.log(`📱 Ticket ${ticketNumber} salvo localmente (aguardando sincronização)`);
        } catch (error) {
            console.error('❌ Erro ao salvar localmente:', error);
        }
    }

    async syncOfflineTickets() {
        try {
            const offlineTickets = JSON.parse(localStorage.getItem('offlineTickets') || '[]');
            const pendingTickets = offlineTickets.filter(t => !t.synced);
            
            if (pendingTickets.length === 0) return;
            
            console.log(`🔄 Sincronizando ${pendingTickets.length} tickets offline...`);
            
            for (const ticket of pendingTickets) {
                try {
                    await this.saveTicketToFirebase(
                        ticket.ticketNumber,
                        ticket.analystName,
                        ticket.status,
                        ticket.clientType
                    );
                    ticket.synced = true;
                } catch (error) {
                    console.error(`❌ Erro ao sincronizar ticket ${ticket.ticketNumber}:`, error);
                    // Continua com os próximos tickets
                }
            }
            
            localStorage.setItem('offlineTickets', JSON.stringify(offlineTickets));
            console.log('✅ Tickets offline sincronizados');
            
        } catch (error) {
            console.error('❌ Erro ao sincronizar tickets offline:', error);
        }
    }

    // ============================================
    // FUNÇÕES PARA ANALISTAS
    // ============================================

    async saveAnalystStatus(analystId, analystData) {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível para salvar status do analista');
            return false;
        }

        try {
            const analystRef = this.db.collection('analysts').doc(`analyst_${analystId}`);
            
            await analystRef.set({
                ...analystData,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar status do analista:', error);
            return false;
        }
    }

    async getDailyStatistics(date) {
        if (!this.initialized || !this.db) {
            return null;
        }

        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const ticketsRef = this.db.collection('tickets')
                .where('createdAt', '>=', startOfDay.toISOString())
                .where('createdAt', '<=', endOfDay.toISOString());

            const querySnapshot = await ticketsRef.get();
            
            const statistics = {
                totalTickets: 0,
                specialTickets: 0,
                normalTickets: 0,
                averageDuration: 0,
                byAnalyst: {},
                byStatus: {},
                byClientType: {}
            };

            let totalDuration = 0;
            let completedTickets = 0;

            querySnapshot.forEach(doc => {
                const data = doc.data();
                
                statistics.totalTickets++;
                
                // Contar por tipo de cliente
                if (data.clientType && data.clientType !== 'normal') {
                    statistics.specialTickets++;
                    
                    if (!statistics.byClientType[data.clientType]) {
                        statistics.byClientType[data.clientType] = 0;
                    }
                    statistics.byClientType[data.clientType]++;
                } else {
                    statistics.normalTickets++;
                }

                // Contar por analista
                if (data.analystName) {
                    if (!statistics.byAnalyst[data.analystName]) {
                        statistics.byAnalyst[data.analystName] = 0;
                    }
                    statistics.byAnalyst[data.analystName]++;
                }

                // Contar por status
                if (data.status) {
                    if (!statistics.byStatus[data.status]) {
                        statistics.byStatus[data.status] = 0;
                    }
                    statistics.byStatus[data.status]++;
                }

                // Calcular duração média
                if (data.duration && data.status === 'finalizado') {
                    totalDuration += data.duration;
                    completedTickets++;
                }
            });

            if (completedTickets > 0) {
                statistics.averageDuration = Math.round(totalDuration / completedTickets);
            }

            return statistics;
            
        } catch (error) {
            console.error('❌ Erro ao buscar estatísticas:', error);
            return null;
        }
    }

    // ============================================
    // FUNÇÕES DE UTILIDADE
    // ============================================

    isInitialized() {
        return this.initialized;
    }

    getStatus() {
        return {
            initialized: this.initialized,
            db: !!this.db,
            auth: !!this.auth,
            retryCount: this.retryCount
        };
    }

    // ============================================
    // SINCRONIZAÇÃO EM TEMPO REAL
    // ============================================

    setupRealtimeSync(callback) {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível para sincronização em tempo real');
            return null;
        }

        try {
            // Ouvir mudanças na coleção de estado dos analistas
            const unsubscribe = this.db.collection('analysts_state')
                .onSnapshot(snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'modified' || change.type === 'added') {
                            const data = change.doc.data();
                            console.log(`🔄 Estado atualizado: ${data.name}`);
                            if (callback) {
                                callback(data);
                            }
                        }
                    });
                }, error => {
                    console.error('❌ Erro na sincronização em tempo real:', error);
                });
            
            return unsubscribe;
            
        } catch (error) {
            console.error('❌ Erro ao configurar sincronização:', error);
            return null;
        }
    }
}

// ============================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ============================================

// Criar instância global imediatamente
window.firebaseAppIntegration = new FirebaseAppIntegration();

// Adicionar função global para testar
window.testFirebaseIntegration = async function() {
    console.log('🧪 Testando integração Firebase...');
    
    if (!window.firebaseAppIntegration.initialized) {
        console.error('❌ Firebase não inicializado');
        return false;
    }

    try {
        // Teste simples
        const testResult = await window.firebaseAppIntegration.saveTicketToFirebase(
            'TEST_' + Date.now(),
            'Test Analyst',
            'iniciado',
            'test'
        );
        
        if (testResult) {
            console.log('✅ Teste de integração bem-sucedido');
            return true;
        } else {
            console.error('❌ Teste de integração falhou');
            return false;
        }
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return false;
    }
};

// Função para exibir status do Firebase
window.showFirebaseStatus = function() {
    if (!window.firebaseAppIntegration) {
        return '❌ Firebase App Integration não carregado';
    }
    
    const status = window.firebaseAppIntegration.getStatus();
    return `🔧 Firebase Status: ${status.initialized ? '✅ Inicializado' : '❌ Não inicializado'} | Retries: ${status.retryCount}`;
};

// Função para salvar estado dos analistas
window.saveAnalystsState = function(analysts) {
    if (!window.firebaseAppIntegration) {
        console.error('❌ Firebase não disponível');
        return false;
    }
    
    const analystsData = analysts.map(analyst => ({
        id: analyst.id,
        name: analyst.name,
        isAvailable: analyst.isAvailable,
        isBusy: analyst.isBusy,
        currentTicket: analyst.currentTicket,
        ticketStatus: analyst.ticketStatus,
        ticketSpecialType: analyst.ticketSpecialType,
        ticketsHandled: analyst.ticketsHandled,
        isWaitingForClient: analyst.isWaitingForClient,
        inQueue: analyst.inQueue,
        lastActivity: analyst.lastActivity,
        specialClient: analyst.specialClient,
        level: analyst.level,
        startTime: analyst.startTime,
        endTime: analyst.endTime
    }));
    
    return window.firebaseAppIntegration.saveAnalystsState(analystsData);
};

// Função para carregar estado dos analistas
window.loadAnalystsState = function() {
    if (!window.firebaseAppIntegration) {
        console.error('❌ Firebase não disponível');
        return null;
    }
    
    return window.firebaseAppIntegration.loadAnalystsStateFull();
};

console.log('✅ Firebase App Integration carregado (versão com persistência)');
