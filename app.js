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
        this.ultimoNumeroChamado = 0;
        this.ordemAnalistas = this.criarOrdemAnalistas();
        this.inicializar();
    }

    criarOrdemAnalistas() {
        // Ordem de rodízio baseada nos horários
        const ordem = [];
        
        // Primeiro os que começam mais cedo
        ordem.push('Eric'); // 8h
        
        // Depois os de 9h em ordem específica
        const analistas9h = ['Carolina', 'Cristiane', 'Tamiris', 'André', 'Felipe'];
        ordem.push(...analistas9h);
        
        // Por último os de 14h
        ordem.push('Sander', 'Yan');
        
        return ordem;
    }

    async inicializar() {
        await this.carregarContador();
        await this.carregarEstado();
        this.verificarDisponibilidade();
        this.atualizarRelogio();
        this.atualizarNumeroChamado();
        
        setInterval(() => this.atualizarRelogio(), 1000);
        setInterval(() => this.verificarDisponibilidade(), 60000);
    }

    async carregarContador() {
        try {
            const doc = await db.collection('config').doc('contadorChamados').get();
            if (doc.exists) {
                const data = doc.data();
                if (data.data === this.dataAtual) {
                    this.ultimoNumeroChamado = data.ultimoNumero || 0;
                } else {
                    // Novo dia, reiniciar contador
                    this.ultimoNumeroChamado = 0;
                    await this.salvarContador();
                }
            }
            this.atualizarNumeroChamado();
        } catch (error) {
            console.error('Erro ao carregar contador:', error);
        }
    }

    async salvarContador() {
        try {
            await db.collection('config').doc('contadorChamados').set({
                ultimoNumero: this.ultimoNumeroChamado,
                data: this.dataAtual,
                atualizadoEm: new Date().toISOString()
            });
            this.atualizarNumeroChamado();
        } catch (error) {
            console.error('Erro ao salvar contador:', error);
        }
    }

    atualizarNumeroChamado() {
        document.getElementById('numeroChamado').value = this.ultimoNumeroChamado + 1;
        document.getElementById('contadorNumero').textContent = this.ultimoNumeroChamado;
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

        // Carregar histórico do rodízio de hoje
        const historicoHoje = this.historicoRodizio.filter(h => h.data === this.dataAtual);
        const analistasUsadosHoje = historicoHoje.map(h => h.analista);
        
        // Encontrar próximo analista disponível na ordem de rodízio
        for (const nomeAnalista of this.ordemAnalistas) {
            const analista = this.analistas.find(a => a.nome === nomeAnalista);
            
            if (analista.disponivel && !analistasUsadosHoje.includes(analista.nome)) {
                return analista;
            }
        }
        
        // Se todos já foram usados hoje, reinicia o rodízio
        const analistaDisponivel = this.analistas.find(a => a.disponivel);
        return analistaDisponivel;
    }

    async adicionarChamado() {
        const clienteInput = document.getElementById('clienteInput');
        const cliente = clienteInput.value.trim();
        
        if (!cliente) {
            alert('Por favor, insira o nome do cliente');
            return;
        }
        
        // Gerar novo número
        this.ultimoNumeroChamado++;
        await this.salvarContador();
        const numeroChamado = this.ultimoNumeroChamado;
        
        // Encontrar analista
        const analista = this.getProximoAnalista(cliente);
        
        if (!analista) {
            alert('Nenhum analista disponível no momento!');
            // Reverter contador
            this.ultimoNumeroChamado--;
            await this.salvarContador();
            return;
        }

        const chamado = {
            id: Date.now(),
            numero: numeroChamado,
            cliente: cliente,
            analista: analista.nome,
            horarioEntrada: new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            dataEntrada: new Date().toLocaleDateString('pt-BR'),
            status: 'na_fila',
            isEspecial: !!this.clientesEspeciais[cliente]
        };

        this.fila.push(chamado);
        
        // Registrar no rodízio
        this.historicoRodizio.push({
            data: this.dataAtual,
            analista: analista.nome,
            cliente: cliente,
            numeroChamado: numeroChamado,
            horario: new Date().toLocaleTimeString()
        });

        await this.salvarEstado();
        
        // Limpar campo e atualizar
        clienteInput.value = '';
        this.atualizarInterface();
        
        // Mostrar notificação
        this.mostrarNotificacao(`Chamado #${numeroChamado} criado!`, `${cliente} → ${analista.nome}`);
        
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

    async finalizarAtendimento(idChamado) {
        const index = this.fila.findIndex(c => c.id === idChamado);
        if (index !== -1) {
            const chamado = this.fila[index];
            
            // Salvar no histórico local
            this.salvarNoHistorico(chamado);
            
            this.fila.splice(index, 1);
            await this.salvarEstado();
            this.atualizarInterface();
        }
    }

    salvarNoHistorico(chamado) {
        // Salvar no localStorage para histórico do dia
        let historico = JSON.parse(localStorage.getItem('chamadosFinalizados') || '[]');
        const horarioSaida = new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        historico.push({
            ...chamado,
            horarioSaida: horarioSaida,
            dataSaida: new Date().toLocaleDateString('pt-BR')
        });
        
        localStorage.setItem('chamadosFinalizados', JSON.stringify(historico));
    }

    atualizarInterface() {
        this.atualizarFila();
        this.atualizarAnalistas();
        this.atualizarProximoAnalista();
    }

    atualizarFila() {
        const container = document.getElementById('filaList');
        container.innerHTML = '';

        const chamadosNaFila = this.fila.filter(c => c.status === 'na_fila');
        
        if (chamadosNaFila.length === 0) {
            container.innerHTML = `
                <div class="queue-item">
                    <div class="queue-posicao">-</div>
                    <div class="queue-numero">-</div>
                    <div class="queue-cliente">Nenhum chamado na fila</div>
                    <div class="queue-analyst">-</div>
                </div>
            `;
            return;
        }

        chamadosNaFila.forEach((chamado, index) => {
            const div = document.createElement('div');
            div.className = `queue-item ${chamado.isEspecial ? 'special' : ''}`;
            div.innerHTML = `
                <div class="queue-posicao">${index + 1}</div>
                <div class="queue-numero">#${chamado.numero}</div>
                <div class="queue-cliente">${chamado.cliente}</div>
                <div class="queue-analyst">${chamado.analista}</div>
            `;
            container.appendChild(div);
        });
    }

    atualizarProximoAnalista() {
        const chamadosNaFila = this.fila.filter(c => c.status === 'na_fila');
        
        if (chamadosNaFila.length > 0) {
            const proximoChamado = chamadosNaFila[0];
            document.getElementById('proximoAnalistaNome').textContent = proximoChamado.analista;
        } else {
            document.getElementById('proximoAnalistaNome').textContent = '-';
        }
    }

    atualizarAnalistas() {
        this.atualizarAnalistasAtendimento();
        this.atualizarAnalistasDisponiveis();
    }

    atualizarAnalistasAtendimento() {
        const container = document.getElementById('analistasAtendimento');
        container.innerHTML = '';

        const emAtendimento = this.fila.filter(c => c.status === 'em_atendimento');
        
        if (emAtendimento.length === 0) {
            container.innerHTML = `
                <div class="analyst-card">
                    <div class="analyst-header">
                        <div class="analyst-name">Nenhum analista em atendimento</div>
                        <span class="analyst-status status-available">Disponível</span>
                    </div>
                </div>
            `;
            return;
        }

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
                        <div class="chamado-header">
                            <span class="chamado-numero">#${chamado.numero}</span>
                            <span class="chamado-horario">${chamado.horarioEntrada}</span>
                        </div>
                        <div class="chamado-cliente">${chamado.cliente}</div>
                        <div class="chamado-tempo">
                            <i class="fas fa-clock"></i> ${tempoAtendimento}
                        </div>
                    </div>
                </div>
                <div class="analyst-controls">
                    <button class="control-btn btn-waiting" onclick="filaSistema.aguardarRetorno(${chamado.id})">
                        <i class="fas fa-hourglass-half"></i> Aguardar
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

        // Filtrar analistas disponíveis (no horário) e não em atendimento
        const analistasDisponiveis = this.analistas.filter(analista => {
            const emAtendimento = this.fila.some(c => 
                c.analista === analista.nome && c.status === 'em_atendimento'
            );
            return analista.disponivel && !emAtendimento;
        });

        if (analistasDisponiveis.length === 0) {
            container.innerHTML = `
                <div class="analyst-card">
                    <div class="analyst-header">
                        <div class="analyst-name">Nenhum analista disponível</div>
                        <span class="analyst-status status-busy">Indisponível</span>
                    </div>
                    <div class="analyst-info">
                        <div class="analyst-schedule">
                            <i class="far fa-clock"></i> Aguarde o próximo horário
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        analistasDisponiveis.forEach(analista => {
            // Encontrar próximo chamado deste analista
            const proximoChamado = this.fila.find(c => 
                c.analista === analista.nome && c.status === 'na_fila'
            );
            
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
                    ${proximoChamado ? `
                        <div class="chamado-info">
                            <div class="chamado-header">
                                <span class="chamado-numero">#${proximoChamado.numero}</span>
                                <span class="chamado-horario">${proximoChamado.horarioEntrada}</span>
                            </div>
                            <div class="chamado-cliente">${proximoChamado.cliente}</div>
                            <button class="control-btn btn-waiting" style="margin-top: 10px; background: var(--success-color);" onclick="filaSistema.iniciarAtendimento(${proximoChamado.id})">
                                <i class="fas fa-play"></i> Iniciar Atendimento
                            </button>
                        </div>
                    ` : `
                        <div class="chamado-info">
                            <div class="chamado-cliente">Aguardando próximo chamado</div>
                        </div>
                    `}
                </div>
            `;
            container.appendChild(card);
        });
    }

    calcularTempoAtendimento(inicio) {
        if (!inicio) return '0 min';
        const diff = new Date() - new Date(inicio);
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;
        
        if (horas > 0) {
            return `${horas}h ${minutosRestantes}min`;
        }
        return `${minutos} min`;
    }

    atualizarRelogio() {
        const now = new Date();
        document.getElementById('currentTime').textContent = 
            now.toLocaleDateString('pt-BR') + ' ' + 
            now.toLocaleTimeString('pt-BR');
    }

    mostrarNotificacao(titulo, mensagem) {
        // Criar notificação visual
        const notification = document.createElement('div');
        notification.className = 'notification-popup';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-bell"></i>
                <div>
                    <strong>${titulo}</strong>
                    <p>${mensagem}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animação de entrada
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remover após 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
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
                    // Novo dia, limpar fila
                    this.fila = [];
                    console.log('Novo dia, fila reiniciada');
                }
            }
            
            this.atualizarInterface();
        } catch (error) {
            console.error('Erro ao carregar estado:', error);
        }
    }

    async reiniciarFila() {
        if (confirm('Deseja realmente reiniciar a fila para hoje?')) {
            this.fila = [];
            this.historicoRodizio = this.historicoRodizio.filter(h => h.data !== this.dataAtual);
            await this.salvarEstado();
            this.atualizarInterface();
            this.mostrarNotificacao('Fila Reiniciada', 'A fila foi reiniciada com sucesso!');
        }
    }

    async resetarContador() {
        if (confirm('Deseja resetar o contador de chamados para hoje?')) {
            this.ultimoNumeroChamado = 0;
            await this.salvarContador();
            this.mostrarNotificacao('Contador Resetado', 'O contador foi resetado para 0');
        }
    }
}

// Inicializar o sistema
const filaSistema = new FilaSistema();

// Funções globais
function adicionarChamado() {
    filaSistema.adicionarChamado();
}

function iniciarAtendimento(idChamado) {
    filaSistema.iniciarAtendimento(idChamado);
}

function reiniciarFila() {
    filaSistema.reiniciarFila();
}

function resetarContador() {
    filaSistema.resetarContador();
}

function exibirConfiguracoes() {
    document.getElementById('configModal').classList.add('active');
}

function fecharConfiguracoes() {
    document.getElementById('configModal').classList.remove('active');
}

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fecharConfiguracoes();
    }
});

// Monitorar conexão Firebase
db.enablePersistence().then(() => {
    document.getElementById('statusText').textContent = 'Conectado';
}).catch((err) => {
    document.getElementById('statusText').textContent = 'Offline';
});

// Ouvir alterações em tempo real
db.collection('estado').doc('filaAtual')
    .onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.ultimaAtualizacao) {
                filaSistema.atualizarInterface();
            }
        }
    });
