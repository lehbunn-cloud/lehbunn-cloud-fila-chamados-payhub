// ============================================
// INTEGRAÇÃO FIREBASE - PORTAL PAYHUB
// ============================================

class FirebaseAppIntegration {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;
        this.sessionId = null;
        this.lastSaveTime = null;
        this.analysts = [];
        this.init();
    }

    async init() {
        console.log('🔧 Inicializando Firebase App Integration...');
        
        try {
            // Aguardar carregamento do Firebase
            await this.waitForFirebase();
            
            // Obter referências
            const refs = window.firebaseConfig?.getFirebaseRefs();
            if (!refs || !refs.db) {
                throw new Error('Firebase não disponível');
            }

            this.db = refs.db;
            this.auth = refs.auth;
            this.initialized = true;
            this.sessionId = this.generateSessionId();
            
            // Salvar session ID
            sessionStorage.setItem('queue_session_id', this.sessionId);
            
            console.log('✅ Firebase App Integration inicializado');
            console.log('📝 Sessão:', this.sessionId);
            
            // Testar conexão
            await this.testConnection();
            
            // Carregar analistas
            await this.loadAnalysts();
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase:', error.message);
            this.initialized = false;
            this.setupOfflineMode();
            return false;
        }
    }

    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 20;
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (window.firebaseConfig && window.firebaseConfig.getFirebaseRefs) {
                    clearInterval(checkInterval);
                    resolve();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout aguardando Firebase'));
                }
            }, 500);
        });
    }

    async testConnection() {
        if (!this.initialized || !this.db) {
            return false;
        }

        try {
            const testDoc = this.db.collection('_tests').doc('connection');
            await testDoc.set({
                test: true,
                timestamp: new Date().toISOString(),
                message: 'Teste de conexão do sistema'
            });
            
            console.log('✅ Conexão Firebase testada com sucesso');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao testar conexão:', error.message);
            return false;
        }
    }

    setupOfflineMode() {
        console.warn('⚠️ Configurando modo offline');
        this.initialized = false;
        
        // Carregar analistas padrão
        this.loadDefaultAnalysts();
        
        // Mostrar notificação
        if (typeof showNotification === 'function') {
            setTimeout(() => {
                showNotification('Sistema operando em modo offline', 'warning');
            }, 1000);
        }
    }

    generateSessionId() {
        let sessionId = sessionStorage.getItem('queue_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('queue_session_id', sessionId);
        }
        return sessionId;
    }

    // ============================================
    // GERENCIAMENTO DE ANALISTAS
    // ============================================

    async loadAnalysts() {
        if (!this.initialized || !this.db) {
            this.loadDefaultAnalysts();
            return;
        }

        try {
            const snapshot = await this.db.collection('analysts').get();
            
            if (snapshot.empty) {
                console.log('📭 Nenhum analista encontrado no Firebase, usando padrão');
                this.loadDefaultAnalysts();
                return;
            }
            
            this.analysts = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                this.analysts.push({
                    id: data.id,
                    name: data.name,
                    level: data.level,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    specialClient: data.specialClient || null,
                    isActive: data.isActive !== false,
                    shift: data.shift || 'integral',
                    isAvailable: data.isAvailable || false,
                    isBusy: data.isBusy || false,
                    currentTicket: data.currentTicket || null,
                    ticketStatus: data.ticketStatus || null,
                    ticketSpecialType: data.ticketSpecialType || null,
                    ticketsHandled: data.ticketsHandled || 0,
                    isWaitingForClient: data.isWaitingForClient || false,
                    inQueue: data.inQueue !== false,
                    lastActivity: data.lastActivity || null,
                    createdAt: data.createdAt || new Date().toISOString(),
                    updatedAt: data.updatedAt || new Date().toISOString()
                });
            });
            
            console.log(`✅ ${this.analysts.length} analistas carregados do Firebase`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar analistas:', error);
            this.loadDefaultAnalysts();
        }
    }

    loadDefaultAnalysts() {
        this.analysts = [
            {
                id: 1,
                name: "Eric",
                level: "N1",
                startTime: 8,
                endTime: 17,
                specialClient: "TIM",
                isActive: true,
                shift: "manhã",
                isAvailable: false,
                isBusy: false,
                currentTicket: null,
                ticketsHandled: 0,
                inQueue: true,
                lastActivity: null
            },
            {
                id: 2,
                name: "Carolina",
                level: "N1",
                startTime: 9,
                endTime: 18,
                specialClient: null,
                isActive: true,
                shift: "manhã",
                isAvailable: false,
                isBusy: false,
                currentTicket: null,
                ticketsHandled: 0,
                inQueue: true,
                lastActivity: null
            },
            {
                id: 3,
                name: "Tamiris",
                level: "N1",
                startTime: 9,
                endTime: 18,
                specialClient: null,
                isActive: true,
                shift: "manhã",
                isAvailable: false,
                isBusy: false,
                currentTicket: null,
                ticketsHandled: 0,
                inQueue: true,
                lastActivity: null
            },
            {
                id: 4,
                name: "Cristiane",
                level: "N1",
                startTime: 9,
                endTime: 18,
                specialClient: null,
                isActive: true,
                shift: "manhã",
                isAvailable: false,
                isBusy: false,
                currentTicket: null,
                ticketsHandled: 0,
                inQueue: true,
                lastActivity: null
            },
            {
                id: 5,
                name: "Jonathan",
                level: "N1",
                startTime: 8,
                endTime: 17,
                specialClient: null,
                isActive: true,
                shift: "manhã",
                isAvailable: false,
                isBusy: false,
                currentTicket: null,
                ticketsHandled: 0,
                inQueue: true,
                lastActivity: null
            },
            {
                id: 6,
                name: "Sander",
                level: "N1",
                startTime: 14,
                endTime: 23,
                specialClient: null,
                isActive: true,
                shift: "tarde",
                isAvailable: false,
                isBusy: false,
                currentTicket: null,
                ticketsHandled: 0,
                inQueue: true,
                lastActivity: null
            },
            {
                id: 7,
                name: "Yan",
                level: "N1",
                startTime: 14,
                endTime: 23,
                specialClient: null,
                isActive: true,
                shift: "tarde",
                isAvailable: false,
                isBusy: false,
                currentTicket: null,
                ticketsHandled: 0,
                inQueue: true,
                lastActivity: null
            },
            {
                id: 8,
                name: "André",
                level: "N1",
                startTime: 8,
                endTime: 18,
                specialClient: "Benoit",
                isActive: true,
                shift: "integral",
                isAvailable: false,
                isBusy: false,
                currentTicket: null,
                ticketsHandled: 0,
                inQueue: true,
                lastActivity: null
            },
            {
                id: 9,
                name: "Felipe",
                level: "N1",
                startTime: 8,
                endTime: 18,
                specialClient: "DPSP",
                isActive: true,
                shift: "integral",
                isAvailable: false,
                isBusy: false,
                currentTicket: null,
                ticketsHandled: 0,
                inQueue: true,
                lastActivity: null
            }
        ];
        
        console.log(`📋 ${this.analysts.length} analistas padrão carregados`);
    }

    async saveAnalysts() {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível para salvar analistas');
            return false;
        }

        try {
            const batch = this.db.batch();
            
            this.analysts.forEach(analyst => {
                const analystRef = this.db.collection('analysts').doc(`analyst_${analyst.id}`);
                batch.set(analystRef, {
                    ...analyst,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            });
            
            await batch.commit();
            console.log(`✅ ${this.analysts.length} analistas salvos no Firebase`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao salvar analistas:', error);
            return false;
        }
    }

    async updateAnalyst(analystId, updates) {
        if (!this.initialized || !this.db) {
            // Atualizar localmente
            const index = this.analysts.findIndex(a => a.id === analystId);
            if (index !== -1) {
                this.analysts[index] = { ...this.analysts[index], ...updates };
            }
            return true;
        }

        try {
            const analystRef = this.db.collection('analysts').doc(`analyst_${analystId}`);
            await analystRef.update({
                ...updates,
                updatedAt: new Date().toISOString()
            });
            
            // Atualizar localmente também
            const index = this.analysts.findIndex(a => a.id === analystId);
            if (index !== -1) {
                this.analysts[index] = { ...this.analysts[index], ...updates };
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar analista:', error);
            return false;
        }
    }

    getAnalysts() {
        return this.analysts;
    }

    getAnalystById(id) {
        return this.analysts.find(a => a.id === id);
    }

    getAnalystByName(name) {
        return this.analysts.find(a => a.name === name);
    }

    // ============================================
    // GESTÃO DE TICKETS
    // ============================================

    async saveTicket(ticketNumber, analystName, status = 'iniciado', clientType = 'normal') {
        if (!this.initialized || !this.db) {
            this.saveTicketLocal(ticketNumber, analystName, status, clientType);
            return null;
        }

        try {
            const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const ticketData = {
                ticketId: ticketId,
                ticketNumber: ticketNumber.toString(),
                analystName: analystName,
                status: status,
                clientType: clientType,
                startTime: new Date().toISOString(),
                sessionId: this.sessionId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                synced: true
            };

            const ticketRef = this.db.collection('tickets').doc(ticketId);
            await ticketRef.set(ticketData);
            
            console.log(`✅ Ticket ${ticketNumber} salvo no Firebase`);
            
            // Salvar localmente como backup
            this.saveTicketLocal(ticketNumber, analystName, status, clientType);
            
            return ticketId;
            
        } catch (error) {
            console.error('❌ Erro ao salvar ticket:', error);
            this.saveTicketLocal(ticketNumber, analystName, status, clientType);
            return null;
        }
    }

    async updateTicket(ticketNumber, status, analystName = null) {
        if (!this.initialized || !this.db) {
            return false;
        }

        try {
            const ticketsRef = this.db.collection('tickets');
            const querySnapshot = await ticketsRef
                .where('ticketNumber', '==', ticketNumber.toString())
                .where('status', '!=', 'finalizado')
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
            
            if (querySnapshot.empty) {
                return false;
            }

            const ticketDoc = querySnapshot.docs[0];
            const updateData = {
                status: status,
                updatedAt: new Date().toISOString()
            };

            if (status === 'finalizado') {
                updateData.endTime = new Date().toISOString();
                
                const ticketData = ticketDoc.data();
                if (ticketData.startTime) {
                    const startTime = new Date(ticketData.startTime);
                    const endTime = new Date();
                    updateData.duration = Math.round((endTime - startTime) / 1000);
                }
            }

            if (analystName) {
                updateData.analystName = analystName;
            }

            await ticketDoc.ref.update(updateData);
            console.log(`✅ Ticket ${ticketNumber} atualizado para: ${status}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar ticket:', error);
            return false;
        }
    }

    saveTicketLocal(ticketNumber, analystName, status, clientType) {
        try {
            const tickets = JSON.parse(localStorage.getItem('offline_tickets') || '[]');
            const ticketData = {
                ticketNumber,
                analystName,
                status,
                clientType,
                timestamp: new Date().toISOString(),
                synced: false
            };
            
            tickets.push(ticketData);
            
            if (tickets.length > 100) {
                tickets.splice(0, tickets.length - 100);
            }
            
            localStorage.setItem('offline_tickets', JSON.stringify(tickets));
            console.log(`📱 Ticket ${ticketNumber} salvo localmente`);
        } catch (error) {
            console.error('❌ Erro ao salvar ticket localmente:', error);
        }
    }

    // ============================================
    // FILA E RODÍZIO
    // ============================================

    organizeQueue() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Filtrar analistas disponíveis no horário atual
        const availableAnalysts = this.analysts.filter(analyst => {
            // Verificar horário
            const inTime = currentHour >= analyst.startTime && currentHour < analyst.endTime;
            if (!inTime) return false;
            
            // Verificar disponibilidade
            return analyst.isActive && !analyst.isBusy && analyst.inQueue;
        });
        
        // Ordenar por:
        // 1. Horário de início (mais cedo primeiro)
        // 2. Menos tickets atendidos hoje
        // 3. Nome (ordem alfabética)
        return availableAnalysts.sort((a, b) => {
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
        const queue = this.organizeQueue();
        
        if (queue.length === 0) {
            return null;
        }
        
        // Obter último índice usado
        const lastIndex = parseInt(localStorage.getItem('last_queue_index') || '0');
        let nextIndex = lastIndex % queue.length;
        
        // Verificar se o analista ainda está disponível
        const nextAnalyst = queue[nextIndex];
        if (!nextAnalyst || !nextAnalyst.isActive || nextAnalyst.isBusy) {
            // Avançar para o próximo disponível
            nextIndex = (nextIndex + 1) % queue.length;
        }
        
        // Salvar novo índice
        localStorage.setItem('last_queue_index', (nextIndex + 1).toString());
        
        return queue[nextIndex];
    }

    // ============================================
    // CLIENTES ESPECIAIS
    // ============================================

    isSpecialClient(clientType) {
        const specialClients = ['TIM', 'DPSP', 'Benoit'];
        return specialClients.includes(clientType);
    }

    getAnalystForSpecialClient(clientType) {
        const mapping = {
            'TIM': 'Eric',
            'DPSP': 'Felipe',
            'Benoit': 'André'
        };
        
        const analystName = mapping[clientType];
        return this.getAnalystByName(analystName);
    }

    // ============================================
    // RELATÓRIOS
    // ============================================

    async getTicketsByDateRange(startDate, endDate, includeAll = false) {
        if (!this.initialized || !this.db) {
            return [];
        }

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            let query = this.db.collection('tickets')
                .where('createdAt', '>=', start.toISOString())
                .where('createdAt', '<=', end.toISOString());

            if (!includeAll) {
                query = query.where('clientType', '!=', 'normal');
            }

            const querySnapshot = await query.orderBy('createdAt', 'asc').get();
            
            const tickets = [];
            querySnapshot.forEach(doc => {
                tickets.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`📊 Encontrados ${tickets.length} tickets no período`);
            return tickets;
            
        } catch (error) {
            console.error('❌ Erro ao buscar tickets:', error);
            return [];
        }
    }

    async generateReport(startDate, endDate, includeAll = false) {
        const tickets = await this.getTicketsByDateRange(startDate, endDate, includeAll);
        
        if (tickets.length === 0) {
            return null;
        }

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

        const csvRows = [headers.join(';')];
        
        tickets.forEach(ticket => {
            const row = [
                ticket.ticketNumber,
                ticket.analystName,
                ticket.status,
                ticket.clientType,
                this.formatDate(ticket.startTime),
                this.formatDate(ticket.endTime),
                ticket.duration || '',
                this.formatDate(ticket.createdAt)
            ];
            csvRows.push(row.join(';'));
        });

        return csvRows.join('\n');
    }

    downloadCSV(csvString, filename) {
        if (!csvString) {
            console.error('❌ Nenhum dado para exportar');
            return false;
        }

        try {
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao gerar CSV:', error);
            return false;
        }
    }

    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================

    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('pt-BR');
        } catch (error) {
            return dateString;
        }
    }

    isInitialized() {
        return this.initialized;
    }

    getStatus() {
        return {
            initialized: this.initialized,
            sessionId: this.sessionId,
            lastSaveTime: this.lastSaveTime,
            analystsCount: this.analysts.length
        };
    }
}

// ============================================
// INICIALIZAÇÃO GLOBAL
// ============================================

window.firebaseAppIntegration = new FirebaseAppIntegration();

// Funções globais
window.getFirebaseIntegration = () => window.firebaseAppIntegration;
window.getAnalysts = () => window.firebaseAppIntegration.getAnalysts();
window.getNextAnalyst = () => window.firebaseAppIntegration.getNextAnalyst();
window.isSpecialClient = (clientType) => window.firebaseAppIntegration.isSpecialClient(clientType);
window.getAnalystForSpecialClient = (clientType) => window.firebaseAppIntegration.getAnalystForSpecialClient(clientType);

console.log('✅ Firebase App Integration carregado');
