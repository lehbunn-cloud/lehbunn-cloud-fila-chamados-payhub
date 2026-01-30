// ============================================
// INTEGRAÇÃO FIREBASE - APP LOGIC
// ============================================

class FirebaseAppIntegration {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            if (!window.firebaseApp) {
                console.warn('⚠️ Firebase não inicializado. Tentando inicializar...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (!window.firebaseApp) {
                    console.error('❌ Firebase não disponível');
                    return;
                }
            }

            const refs = window.firebaseConfig?.getFirebaseRefs();
            if (!refs || !refs.db) {
                console.error('❌ Referências do Firebase não disponíveis');
                return;
            }

            this.db = refs.db;
            this.auth = refs.auth;
            this.initialized = true;
            
            console.log('✅ Firebase App Integration inicializado');
            
            // Testar conexão
            await this.testConnection();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase App Integration:', error);
        }
    }

    async testConnection() {
        try {
            const testRef = this.db.collection('_test').doc('connection');
            await testRef.set({
                test: true,
                timestamp: new Date().toISOString()
            });
            console.log('✅ Conexão com Firebase testada com sucesso');
        } catch (error) {
            console.error('❌ Erro ao testar conexão Firebase:', error);
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
            console.error('❌ Erro ao salvar ticket no Firebase:', error);
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
            // Buscar ticket mais recente com este número
            const ticketsRef = this.db.collection('tickets')
                .where('ticketNumber', '==', ticketNumber.toString())
                .where('status', '!=', 'finalizado')
                .orderBy('createdAt', 'desc')
                .limit(1);

            const querySnapshot = await ticketsRef.get();
            
            if (querySnapshot.empty) {
                console.warn(`⚠️ Ticket ${ticketNumber} não encontrado para atualização`);
                return false;
            }

            const ticketDoc = querySnapshot.docs[0];
            const updateData = {
                status: status,
                updatedAt: new Date().toISOString()
            };

            if (status === 'finalizado') {
                updateData.endTime = new Date().toISOString();
                
                // Calcular duração
                const ticketData = ticketDoc.data();
                if (ticketData.startTime) {
                    const startTime = new Date(ticketData.startTime);
                    const endTime = new Date();
                    const durationMs = endTime - startTime;
                    updateData.duration = Math.round(durationMs / 1000); // Em segundos
                }
            }

            if (analystName) {
                updateData.analystName = analystName;
            }

            await ticketDoc.ref.update(updateData);
            console.log(`✅ Ticket ${ticketNumber} atualizado para status: ${status}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar ticket:', error);
            return false;
        }
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
            let query = this.db.collection('tickets')
                .where('createdAt', '>=', startDate)
                .where('createdAt', '<=', endDate);

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
            console.error('❌ Erro ao buscar tickets:', error);
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
            'Ticket Number',
            'Analyst',
            'Status',
            'Client Type',
            'Start Time',
            'End Time',
            'Duration (seconds)',
            'Created At'
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
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    }

    downloadCSV(csvString, filename = 'relatorio_chamados.csv') {
        if (!csvString) {
            console.error('❌ Nenhum dado para exportar');
            return false;
        }

        try {
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
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
                await this.saveTicketToFirebase(
                    ticket.ticketNumber,
                    ticket.analystName,
                    ticket.status,
                    ticket.clientType
                );
                ticket.synced = true;
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
}

// ============================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ============================================

// Criar instância global
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

console.log('✅ Firebase App Integration carregado');