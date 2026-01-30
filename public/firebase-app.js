// ============================================
// INTEGRAÇÃO FIREBASE - PERSISTÊNCIA COMPLETA
// ============================================

class FirebaseAppIntegration {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;
        this.sessionId = null;
        this.lastSaveTime = null;
        this.init();
    }

    async init() {
        try {
            console.log('🔧 Inicializando Firebase App Integration...');
            
            // Aguardar configuração
            await this.waitForConfig();
            
            const refs = window.firebaseConfig?.getFirebaseRefs();
            if (!refs || !refs.db) {
                throw new Error('Firebase não disponível');
            }

            this.db = refs.db;
            this.auth = refs.auth;
            this.initialized = true;
            this.sessionId = this.getSessionId();
            
            console.log('✅ Firebase App Integration inicializado');
            console.log('📝 Sessão:', this.sessionId);
            
            // Configurar persistência offline
            this.setupPersistence();
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
            this.initialized = false;
            return false;
        }
    }

    async waitForConfig() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 30;
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (window.firebaseConfig && window.firebaseConfig.getFirebaseRefs) {
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout aguardando Firebase'));
                }
            }, 100);
        });
    }

    setupPersistence() {
        if (!this.db) return;
        
        this.db.enablePersistence()
            .then(() => console.log('✅ Persistência offline configurada'))
            .catch(err => {
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Múltiplas abas abertas');
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ Persistência não suportada');
                }
            });
    }

    // ============================================
    // PERSISTÊNCIA DE ESTADO COMPLETO
    // ============================================

    async saveFullState(stateData) {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível, salvando localmente');
            this.saveToLocalStorage('full_state', stateData);
            return false;
        }

        try {
            const stateRef = this.db.collection('queue_states').doc(this.sessionId);
            
            const saveData = {
                ...stateData,
                sessionId: this.sessionId,
                savedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await stateRef.set(saveData, { merge: true });
            
            this.lastSaveTime = new Date();
            console.log('✅ Estado salvo no Firebase');
            
            // Atualizar UI
            this.updateLastSavedUI();
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao salvar estado:', error);
            this.saveToLocalStorage('full_state', stateData);
            return false;
        }
    }

    async loadFullState() {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível, carregando localmente');
            return this.loadFromLocalStorage('full_state');
        }

        try {
            // Tentar carregar pela sessão atual
            let stateRef = this.db.collection('queue_states').doc(this.sessionId);
            let doc = await stateRef.get();
            
            if (!doc.exists) {
                // Buscar estado mais recente
                console.log('ℹ️ Buscando estado mais recente...');
                const snapshot = await this.db.collection('queue_states')
                    .orderBy('savedAt', 'desc')
                    .limit(1)
                    .get();
                
                if (snapshot.empty) {
                    console.log('ℹ️ Nenhum estado encontrado');
                    return null;
                }
                
                doc = snapshot.docs[0];
                console.log('✅ Estado mais recente encontrado');
            }
            
            const stateData = doc.data();
            console.log('📂 Estado carregado do Firebase');
            
            return stateData;
            
        } catch (error) {
            console.error('❌ Erro ao carregar estado:', error);
            return this.loadFromLocalStorage('full_state');
        }
    }

    // ============================================
    // FUNÇÕES PARA TICKETS
    // ============================================

    async saveTicketToFirebase(ticketNumber, analystName, status = 'iniciado', clientType = 'normal') {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Salvando ticket localmente');
            this.saveTicketLocally(ticketNumber, analystName, status, clientType);
            return null;
        }

        try {
            const ticketData = {
                ticketNumber: ticketNumber.toString(),
                analystName: analystName,
                status: status,
                clientType: clientType,
                startTime: new Date().toISOString(),
                sessionId: this.sessionId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const ticketId = `ticket_${ticketNumber}_${Date.now()}`;
            
            await this.db.collection('tickets').doc(ticketId).set(ticketData);
            
            console.log(`✅ Ticket ${ticketNumber} salvo`);
            return ticketId;
            
        } catch (error) {
            console.error('❌ Erro ao salvar ticket:', error);
            this.saveTicketLocally(ticketNumber, analystName, status, clientType);
            return null;
        }
    }

    async updateTicketStatus(ticketNumber, status, analystName = null) {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível');
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
                console.warn(`⚠️ Ticket ${ticketNumber} não encontrado`);
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
            console.log(`✅ Ticket ${ticketNumber} atualizado`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar ticket:', error);
            return false;
        }
    }

    // ============================================
    // FUNÇÕES DE RELATÓRIO
    // ============================================

    async generateCSVReport(startDate, endDate, includeAll = false) {
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

            return tickets;
            
        } catch (error) {
            console.error('❌ Erro ao buscar tickets:', error);
            return [];
        }
    }

    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================

    getSessionId() {
        let sessionId = sessionStorage.getItem('queue_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('queue_session_id', sessionId);
        }
        return sessionId;
    }

    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(`firebase_${key}`, JSON.stringify({
                data: data,
                timestamp: new Date().toISOString(),
                synced: false
            }));
        } catch (error) {
            console.error('❌ Erro ao salvar localmente:', error);
        }
    }

    loadFromLocalStorage(key) {
        try {
            const saved = localStorage.getItem(`firebase_${key}`);
            if (!saved) return null;
            
            const parsed = JSON.parse(saved);
            return parsed.data;
        } catch (error) {
            console.error('❌ Erro ao carregar localmente:', error);
            return null;
        }
    }

    saveTicketLocally(ticketNumber, analystName, status, clientType) {
        try {
            const tickets = JSON.parse(localStorage.getItem('offline_tickets') || '[]');
            tickets.push({
                ticketNumber,
                analystName,
                status,
                clientType,
                timestamp: new Date().toISOString(),
                synced: false
            });
            
            if (tickets.length > 100) {
                tickets.splice(0, tickets.length - 100);
            }
            
            localStorage.setItem('offline_tickets', JSON.stringify(tickets));
        } catch (error) {
            console.error('❌ Erro ao salvar ticket localmente:', error);
        }
    }

    async syncOfflineTickets() {
        if (!this.initialized) return;
        
        try {
            const offlineTickets = JSON.parse(localStorage.getItem('offline_tickets') || '[]');
            const pendingTickets = offlineTickets.filter(t => !t.synced);
            
            if (pendingTickets.length === 0) return;
            
            console.log(`🔄 Sincronizando ${pendingTickets.length} tickets...`);
            
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
                    console.error(`❌ Erro ao sincronizar:`, error);
                }
            }
            
            localStorage.setItem('offline_tickets', JSON.stringify(offlineTickets));
            
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
        }
    }

    formatDate(dateString) {
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

    updateLastSavedUI() {
        const element = document.getElementById('lastSaved');
        if (!element) return;
        
        element.style.display = 'inline-block';
        const time = new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        element.querySelector('span').textContent = `Salvo: ${time}`;
        
        // Esconder após 5 segundos
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    isInitialized() {
        return this.initialized;
    }

    getStatus() {
        return {
            initialized: this.initialized,
            sessionId: this.sessionId,
            lastSaveTime: this.lastSaveTime
        };
    }
}

// ============================================
// INICIALIZAÇÃO GLOBAL
// ============================================

window.firebaseAppIntegration = new FirebaseAppIntegration();

// Função de teste
window.testFirebaseIntegration = async function() {
    console.log('🧪 Testando Firebase...');
    
    const integration = window.firebaseAppIntegration;
    if (!integration.initialized) {
        console.error('❌ Firebase não inicializado');
        return false;
    }

    try {
        const testId = await integration.saveTicketToFirebase(
            'TEST_' + Date.now(),
            'Test Analyst',
            'iniciado',
            'test'
        );
        
        if (testId) {
            console.log('✅ Teste bem-sucedido');
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return false;
    }
};

console.log('✅ Firebase App Integration carregado');
