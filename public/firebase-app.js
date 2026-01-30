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
            
            // Aguardar um pouco para garantir carregamento
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verificar se Firebase está disponível
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK não carregado');
            }
            
            // Aguardar configuração
            if (!window.firebaseConfig) {
                await this.waitForConfig();
            }
            
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
            
            // Testar conexão
            await this.testConnection();
            
            // Sincronizar tickets offline
            await this.syncOfflineTickets();
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error.message);
            this.initialized = false;
            this.setupOfflineMode();
            return false;
        }
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
        
        // Mostrar notificação
        if (typeof showNotification === 'function') {
            setTimeout(() => {
                showNotification('Sistema operando em modo offline', 'warning');
            }, 1000);
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
    // FUNÇÕES PARA TICKETS - CORRIGIDAS!
    // ============================================

    async saveTicketToFirebase(ticketNumber, analystName, status = 'iniciado', clientType = 'normal') {
        if (!this.initialized || !this.db) {
            console.warn('⚠️ Firebase não disponível, salvando localmente');
            this.saveTicketLocally(ticketNumber, analystName, status, clientType);
            return null;
        }

        try {
            // Criar ID único para o ticket
            const ticketId = `ticket_${ticketNumber}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
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

            // SALVAR no Firebase - usando set() em vez de add()
            const ticketRef = this.db.collection('tickets').doc(ticketId);
            await ticketRef.set(ticketData);
            
            console.log(`✅ Ticket ${ticketNumber} salvo no Firebase (ID: ${ticketId})`);
            
            // Também salvar localmente como backup
            this.saveTicketLocally(ticketNumber, analystName, status, clientType);
            
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
            console.log(`🔄 Atualizando ticket ${ticketNumber} para status: ${status}`);
            
            // Buscar o ticket mais recente com este número
            const ticketsRef = this.db.collection('tickets');
            const querySnapshot = await ticketsRef
                .where('ticketNumber', '==', ticketNumber.toString())
                .where('status', '!=', 'finalizado')
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
            
            if (querySnapshot.empty) {
                console.warn(`⚠️ Ticket ${ticketNumber} não encontrado. Buscando qualquer ticket com este número...`);
                
                // Buscar qualquer ticket com este número (fallback)
                const fallbackSnapshot = await ticketsRef
                    .where('ticketNumber', '==', ticketNumber.toString())
                    .orderBy('createdAt', 'desc')
                    .limit(1)
                    .get();
                
                if (fallbackSnapshot.empty) {
                    console.error(`❌ Ticket ${ticketNumber} não encontrado em nenhum status`);
                    return false;
                }
                
                const ticketDoc = fallbackSnapshot.docs[0];
                return await this.updateTicketDoc(ticketDoc, status, analystName);
            }

            const ticketDoc = querySnapshot.docs[0];
            return await this.updateTicketDoc(ticketDoc, status, analystName);
            
        } catch (error) {
            console.error('❌ Erro ao atualizar ticket:', error);
            return false;
        }
    }

    async updateTicketDoc(ticketDoc, status, analystName = null) {
        try {
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
                    updateData.duration = Math.round((endTime - startTime) / 1000); // segundos
                }
            }

            if (analystName) {
                updateData.analystName = analystName;
            }

            await ticketDoc.ref.update(updateData);
            console.log(`✅ Ticket ${ticketDoc.data().ticketNumber} atualizado para status: ${status}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar documento:', error);
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
            console.warn('⚠️ Firebase não disponível para consulta');
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
            const ticketData = {
                ticketNumber,
                analystName,
                status,
                clientType,
                timestamp: new Date().toISOString(),
                synced: false
            };
            
            // Verificar se já existe (para evitar duplicação)
            const exists = tickets.some(t => 
                t.ticketNumber === ticketNumber && 
                t.status === status && 
                Math.abs(new Date(t.timestamp) - new Date(ticketData.timestamp)) < 60000 // 1 minuto
            );
            
            if (!exists) {
                tickets.push(ticketData);
                
                if (tickets.length > 100) {
                    tickets.splice(0, tickets.length - 100);
                }
                
                localStorage.setItem('offline_tickets', JSON.stringify(tickets));
                console.log(`📱 Ticket ${ticketNumber} salvo localmente`);
            }
        } catch (error) {
            console.error('❌ Erro ao salvar ticket localmente:', error);
        }
    }

    async syncOfflineTickets() {
        if (!this.initialized || !this.db) return;
        
        try {
            const offlineTickets = JSON.parse(localStorage.getItem('offline_tickets') || '[]');
            const pendingTickets = offlineTickets.filter(t => !t.synced);
            
            if (pendingTickets.length === 0) return;
            
            console.log(`🔄 Sincronizando ${pendingTickets.length} tickets offline...`);
            
            let syncedCount = 0;
            for (const ticket of pendingTickets) {
                try {
                    const ticketId = `offline_${ticket.ticketNumber}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    await this.db.collection('tickets').doc(ticketId).set({
                        ticketId: ticketId,
                        ticketNumber: ticket.ticketNumber,
                        analystName: ticket.analystName,
                        status: ticket.status,
                        clientType: ticket.clientType,
                        startTime: ticket.timestamp,
                        createdAt: ticket.timestamp,
                        updatedAt: new Date().toISOString(),
                        synced: true,
                        source: 'offline_sync'
                    });
                    
                    ticket.synced = true;
                    syncedCount++;
                    
                } catch (error) {
                    console.error(`❌ Erro ao sincronizar ticket ${ticket.ticketNumber}:`, error);
                }
            }
            
            localStorage.setItem('offline_tickets', JSON.stringify(offlineTickets));
            
            if (syncedCount > 0) {
                console.log(`✅ ${syncedCount} tickets offline sincronizados`);
            }
            
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

// Função de teste aprimorada
window.testFirebaseIntegration = async function() {
    console.log('🧪 Testando Firebase Integration...');
    
    const integration = window.firebaseAppIntegration;
    if (!integration.initialized) {
        console.error('❌ Firebase não inicializado');
        return false;
    }

    try {
        // Teste 1: Salvar ticket de teste
        const testTicketNumber = 'TEST_' + Date.now();
        const testId = await integration.saveTicketToFirebase(
            testTicketNumber,
            'Test Analyst',
            'iniciado',
            'test'
        );
        
        if (!testId) {
            console.error('❌ Falha ao salvar ticket de teste');
            return false;
        }
        
        console.log('✅ Ticket de teste salvo:', testId);
        
        // Teste 2: Atualizar status
        const updateSuccess = await integration.updateTicketStatus(
            testTicketNumber,
            'finalizado',
            'Test Analyst'
        );
        
        if (!updateSuccess) {
            console.warn('⚠️ Falha ao atualizar ticket de teste');
        } else {
            console.log('✅ Ticket de teste atualizado');
        }
        
        // Teste 3: Consultar tickets
        const tickets = await integration.getTicketsByDateRange(
            new Date().toISOString().split('T')[0],
            new Date().toISOString().split('T')[0],
            true
        );
        
        console.log('📊 Tickets encontrados:', tickets.length);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return false;
    }
};

console.log('✅ Firebase App Integration CORRIGIDO carregado');
