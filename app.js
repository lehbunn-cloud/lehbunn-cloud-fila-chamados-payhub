class FilaSistema {
    constructor() {
        this.analistas = [
            { nome: 'Eric', horarioInicio: 8, horarioFim: 17, disponivel: false },
            { nome: 'Carolina', horarioInicio: 9, horarioFim: 18, disponivel: false },
            { nome: 'Cristiane', horarioInicio: 9, horarioFim: 18, disponivel: false },
            { nome: 'Tamiris', horarioInicio: 9, horarioFim: 18, disponivel: false },
            { nome: 'André', horarioInicio: 9, horarioFim: 18, disponivel: false },
            { nome: 'Felipe', horarioInicio: 9, horarioFim: 18, disponivel: false },
            { nome: 'Sander', horarioInicio: 14, horarioFim: 23, disponivel: false },
            { nome: 'Yan', horarioInicio: 14, horarioFim: 23, disponivel: false }
        ];
        
        this.clientesEspeciais = {
            'Benoit': 'André',
            'TIM': 'Eric',
            'DPSP': 'Felipe'
        };
        
        this.fila = [];
        this.historicoRodizio = [];
        this.dataAtual = new Date().toDateString();
        this.inicializar();
    }

    inicializar() {
        this.carregarEstado();
        this.verificarDisponibilidade();
        this.atualizarRelogio();
        setInterval(() => this.atualizarRelogio(), 1000);
        setInterval(() => this.verificarDisponibilidade(), 60000);
    }

    verificarDisponibilidade() {
        const horaAtual = new Date().getHours();
        
        this.analistas.forEach(analista => {
            analista.disponivel = (horaAtual >= analista.horarioInicio && horaAtual < analista.horarioFim);
        });
        
        this.atualizarInterface();
    }

    getProximoAnalista(cliente) {
        // Verificar se é cliente especial
        if (this.clientesEspeciais[cliente]) {
            return this.analistas.find(a => a.nome === this.clientesEspeciais[cliente]);
        }

        // Carregar histórico do rodízio
        const historicoHoje = this.historicoRodizio.filter(h => 
            h.data === this.dataAtual
        );

        // Verificar quais analistas já foram hoje
        const analistasUsadosHoje = historicoHoje.map(h => h.analista);
        const analistasDisponiveis = this.analistas.filter(a => 
            a.disponivel && !analistasUsadosHoje.includes(a.nome)
        );

        if (analistasDisponiveis.length > 0) {
            // Se ainda há analistas disponíveis que não foram usados hoje
            return analistasDisponiveis[0];
        } else {
            // Reinicia o rodízio
            return this.analistas.find(a => a.disponivel);
        }
    }

    adicionarChamado(cliente) {
        const analista = this.getProximoAnalista(cliente);
        
        if (!analista) {
            alert('Nenhum analista disponível no momento!');
            return null;
        }

        const chamado = {
            id: Date.now(),
            cliente: cliente,
            analista: analista.nome,
            horarioEntrada: new Date().toLocaleTimeString(),
            status: 'na_fila',
            isEspecial: !!this.clientesEspeciais[cliente]
        };

        this.fila.push(chamado);
        
        // Registrar no rodízio
        this.historicoRodizio.push({
            data: this.dataAtual,
            analista: analista.nome,
            cliente: cliente,
            horario: new Date().toLocaleTimeString()
        });

        this.salvarEstado();
        this.atualizarInterface();
        
        return chamado;
    }

    iniciarAtendimento(idChamado) {
        const index = this.fila.findIndex(c => c.id === idChamado);
        if (index !== -1) {
            this.fila[index].status = 'em_atendimento';
            this.fila[index].inicioAtendimento = new Date();
            this.salvarEstado();
            this.atualizarInterface();
        }
    }

    aguardarRetorno(idChamado) {
        const index = this.fila.findIndex(c => c.id === idChamado);
        if (index !== -1) {
            const chamado = this.fila.splice(index, 1)[0];
            chamado.status = 'aguardando_retorno';
            this.fila.push(chamado); // Vai para o final da fila
            this.salvarEstado();
            this.atualizarInterface();
        }
    }

    finalizarAtendimento(idChamado) {
        const index = this.fila.findIndex(c => c.id === idChamado);
        if (index !== -1) {
            this.fila.splice(index, 1);
            this.salvarEstado();
            this.atualizarInterface();
        }
    }

    atualizarInterface() {
        this.atualizarFila();
        this.atualizarAnalistas();
    }

    atualizarFila() {
        const container = document.getElementById('filaList');
        container.innerHTML = '';

        this.fila.filter(c => c.status === 'na_fila').forEach((chamado, index) => {
            const div = document.createElement('div');
            div.className = `queue-item ${chamado.isEspecial ? 'special' : ''}`;
            div.innerHTML = `
                <div class="queue-number">${index + 1}</div>
                <div class="queue-client">
                    <h4>${chamado.cliente}</h4>
                    <div class="queue-analyst">
                        <i class="fas fa-user-tie"></i> ${chamado.analista}
                    </div>
                </div>
                <div class="queue-time">${chamado.horarioEntrada}</div>
            `;
            container.appendChild(div);
        });
    }

    atualizarAnalistas() {
        this.atualizarAnalistasAtendimento();
        this.atualizarAnalistasDisponiveis();
    }

    atualizarAnalistasAtendimento() {
        const container = document.getElementById('analistasAtendimento');
        container.innerHTML = '';

        const emAtendimento = this.fila.filter(c => c.status === 'em_atendimento');
        
        emAtendimento.forEach(chamado => {
            const analista = this.analistas.find(a => a.nome === chamado.analista);
            const tempoAtendimento = this.calcularTempoAtendimento(chamado.inicioAtendimento);
            
            const card = document.createElement('div');
            card.className = 'analyst-card busy';
            card.innerHTML = `
                <div class="analyst-header">
                    <div class="analyst-name">${analista.nome}</div>
                    <span class="analyst-status status-busy">Em Atendimento</span>
                </div>
                <div class="analyst-info">
                    <div class="analyst-schedule">
                        <i class="far fa-clock"></i> ${analista.horarioInicio}h - ${analista.horarioFim}h
                    </div>
                    <div class="chamado-info">
                        <div class="chamado-cliente">${chamado.cliente}</div>
                        <div class="chamado-tempo">${tempoAtendimento}</div>
                    </div>
                </div>
                <div class="analyst-controls">
                    <button class="control-btn btn-waiting" onclick="filaSistema.aguardarRetorno(${chamado.id})">
                        <i class="fas fa-hourglass-half"></i> Aguardar Retorno
                    </button>
                    <button class="control-btn btn-finish" onclick="filaSistema.finalizarAtendimento(${chamado.id})">
                        <i class="fas fa-check"></i> Finalizar
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    atualizarAnalistasDisponiveis() {
        const container = document.getElementById('analistasDisponiveis');
        container.innerHTML = '';

        this.analistas.forEach(analista => {
            // Verificar se o analista já está em atendimento
            const emAtendimento = this.fila.some(c => 
                c.analista === analista.nome && c.status === 'em_atendimento'
            );

            if (analista.disponivel && !emAtendimento) {
                const proximoNumero = this.calcularProximoNumero(analista);
                
                const card = document.createElement('div');
                card.className = 'analyst-card available';
                card.innerHTML = `
                    <div class="analyst-header">
                        <div class="analyst-name">${analista.nome}</div>
                        <span class="analyst-status status-available">Disponível</span>
                    </div>
                    <div class="analyst-info">
                        <div class="analyst-schedule">
                            <i class="far fa-clock"></i> ${analista.horarioInicio}h - ${analista.horarioFim}h
                        </div>
                        <div class="chamado-info">
                            <div class="chamado-cliente">Próximo da fila</div>
                            <div class="chamado-tempo">Nº ${proximoNumero}</div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            }
        });
    }

    calcularProximoNumero(analista) {
        // Contar quantos chamados existem antes do próximo deste analista
        const chamadosAntes = this.fila.filter(c => c.status === 'na_fila' && c.analista === analista.nome).length;
        const indexAnalista = this.analistas.findIndex(a => a.nome === analista.nome);
        
        return (chamadosAntes + indexAnalista + 1);
    }

    calcularTempoAtendimento(inicio) {
        if (!inicio) return '0 min';
        const diff = new Date() - new Date(inicio);
        const minutos = Math.floor(diff / 60000);
        return `${minutos} min`;
    }

    atualizarRelogio() {
        const now = new Date();
        document.getElementById('currentTime').textContent = 
            now.toLocaleDateString('pt-BR') + ' ' + 
            now.toLocaleTimeString('pt-BR');
    }

    async salvarEstado() {
        try {
            await db.collection('estado').doc('filaAtual').set({
                fila: this.fila,
                historicoRodizio: this.historicoRodizio,
                dataAtual: this.dataAtual,
                ultimaAtualizacao: new Date().toISOString()
            });
            console.log('Estado salvo no Firebase');
        } catch (error) {
            console.error('Erro ao salvar estado:', error);
        }
    }

    async carregarEstado() {
        try {
            const doc = await db.collection('estado').doc('filaAtual').get();
            
            if (doc.exists) {
                const data = doc.data();
                
                // Verificar se é do mesmo dia
                if (data.dataAtual === this.dataAtual) {
                    this.fila = data.fila.map(c => ({
                        ...c,
                        inicioAtendimento: c.inicioAtendimento ? new Date(c.inicioAtendimento) : null
                    }));
                    this.historicoRodizio = data.historicoRodizio;
                    console.log('Estado carregado do Firebase');
                } else {
                    // Novo dia, limpar fila mas manter histórico
                    this.fila = [];
                    console.log('Novo dia, fila reiniciada');
                }
            }
            
            this.atualizarInterface();
        } catch (error) {
            console.error('Erro ao carregar estado:', error);
        }
    }

    reiniciarFila() {
        if (confirm('Deseja realmente reiniciar a fila para hoje?')) {
            this.fila = [];
            this.salvarEstado();
            this.atualizarInterface();
            alert('Fila reiniciada com sucesso!');
        }
    }
}

// Inicializar o sistema
const filaSistema = new FilaSistema();

// Funções globais para uso no HTML
function adicionarChamado() {
    const clienteInput = document.getElementById('clienteInput');
    const cliente = clienteInput.value.trim();
    
    if (!cliente) {
        alert('Por favor, insira o nome do cliente');
        return;
    }
    
    const chamado = filaSistema.adicionarChamado(cliente);
    
    if (chamado) {
        clienteInput.value = '';
        
        // Efeito visual
        const btn = document.querySelector('.btn-add');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = '', 200);
    }
}

function iniciarAtendimento(idChamado) {
    filaSistema.iniciarAtendimento(idChamado);
}

function reiniciarFila() {
    filaSistema.reiniciarFila();
}

// Monitorar conexão Firebase
db.enablePersistence().then(() => {
    document.getElementById('statusText').textContent = 'Conectado (Offline habilitado)';
});

// Ouvir alterações em tempo real
db.collection('estado').doc('filaAtual')
    .onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            // Atualizar apenas se for diferente do estado atual
            if (data.ultimaAtualizacao) {
                filaSistema.atualizarInterface();
            }
        }
    });

// Configurar Service Worker para PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(() => console.log('Service Worker registrado'))
        .catch(err => console.log('Erro SW:', err));
}