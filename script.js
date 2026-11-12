document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // 1. MENU MOBILE RESPONSIVO
    // =========================================
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');

    menuToggle.addEventListener('click', () => {
        const aberto = navLinks.classList.toggle('aberto');
        menuToggle.setAttribute('aria-expanded', aberto);
    });

    // =========================================
    // 2. RECURSOS DE ACESSIBILIDADE
    // =========================================
    const body = document.body;
    const btnContraste = document.getElementById('btn-contraste');
    const btnDislexia = document.getElementById('btn-dislexia');
    const btnFonteMais = document.getElementById('btn-fonte-mais');
    const btnFonteMenos = document.getElementById('btn-fonte-menos');
    const btnEspacamento = document.getElementById('btn-espacamento');
    const btnLerPagina = document.getElementById('btn-ler-pagina');

    let tamanhoFonte = 16;

    btnContraste.addEventListener('click', () => {
        const ativo = body.classList.toggle('alto-contraste');
        btnContraste.setAttribute('aria-pressed', ativo);
    });

    btnDislexia.addEventListener('click', () => {
        const ativo = body.classList.toggle('fonte-dislexia');
        btnDislexia.setAttribute('aria-pressed', ativo);
    });

    btnEspacamento.addEventListener('click', () => {
        const ativo = body.classList.toggle('espacamento-amplo');
        btnEspacamento.setAttribute('aria-pressed', ativo);
    });

    btnFonteMais.addEventListener('click', () => {
        if (tamanhoFonte < 22) {
            tamanhoFonte += 2;
            document.documentElement.style.setProperty('--tamanho-base', `${tamanhoFonte}px`);
        }
    });

    btnFonteMenos.addEventListener('click', () => {
        if (tamanhoFonte > 14) {
            tamanhoFonte -= 2;
            document.documentElement.style.setProperty('--tamanho-base', `${tamanhoFonte}px`);
        }
    });

    btnLerPagina.addEventListener('click', () => {
        if ('speechSynthesis' in window) {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                btnLerPagina.setAttribute('aria-pressed', 'false');
                btnLerPagina.textContent = '🔊 Ouvir Resumo';
            } else {
                const textoResumo = "Projeto TermoPool. Radiação infravermelha e perda de energia da piscina escolar. Objetos aquecidos emitem radiação infravermelha pela agitação térmica das partículas, crescendo com a quarta potência da temperatura. Mesmo quando o ar está parado, a piscina perde calor por radiação infravermelha, evaporação e convecção natural. O uso de uma cobertura térmica automatizada bloqueia a evaporação e reduz perdas radiativas, tornando o aquecimento econômico.";
                const fala = new SpeechSynthesisUtterance(textoResumo);
                fala.lang = 'pt-BR';
                fala.onend = () => {
                    btnLerPagina.setAttribute('aria-pressed', 'false');
                    btnLerPagina.textContent = '🔊 Ouvir Resumo';
                };
                window.speechSynthesis.speak(fala);
                btnLerPagina.setAttribute('aria-pressed', 'true');
                btnLerPagina.textContent = '⏹️ Parar Áudio';
            }
        } else {
            alert('Seu navegador não suporta leitura de voz nativa.');
        }
    });

    // =========================================
    // 3. SIMULADOR FÍSICO E GRÁFICO INTERATIVO
    // =========================================
    const sliderAgua = document.getElementById('temp-agua');
    const sliderAmbiente = document.getElementById('temp-ambiente');
    const selectAr = document.getElementById('condicao-ar');
    const selectCobertura = document.getElementById('tipo-cobertura');

    const valTempAgua = document.getElementById('val-temp-agua');
    const valTempAmbiente = document.getElementById('val-temp-ambiente');
    const resIv = document.getElementById('res-iv');
    const resTotalKwh = document.getElementById('res-total-kwh');
    const resEconomia = document.getElementById('res-economia');
    const resDiagnostico = document.getElementById('res-diagnostico');

    // Estado compartilhado entre simulador e gráfico
    let dadosPerdas = {
        evaporacao: 0,
        radiacao: 0,
        conveccao: 0,
        conducao: 0
    };

    function atualizarSimulador() {
        const tAguaC = parseFloat(sliderAgua.value);
        const tAmbC = parseFloat(sliderAmbiente.value);
        const condicaoAr = selectAr.value;
        const tipoCobertura = selectCobertura.value;

        valTempAgua.textContent = `${tAguaC}°C`;
        valTempAmbiente.textContent = `${tAmbC}°C`;

        // Lei de Stefan-Boltzmann: P = ε * σ * (T_agua^4 - T_amb^4)
        const tAguaK = tAguaC + 273.15;
        const tAmbK = tAmbC + 273.15;
        const sigma = 5.67e-8;
        const emissividadeAgua = 0.95;
        const areaPiscina = 125; // 125m² (piscina escolar)

        let perdaIvBaseWm2 = emissividadeAgua * sigma * (Math.pow(tAguaK, 4) - Math.pow(tAmbK, 4));
        if (perdaIvBaseWm2 < 0) perdaIvBaseWm2 = 0;

        // Perdas base em 12h noturnas (kWh) sem cobertura
        const fatorVento = (condicaoAr === 'vento') ? 1.4 : 1.0;
        const kwhRadiacaoBase = (perdaIvBaseWm2 * areaPiscina * 12) / 1000;
        // Evaporação representa ~70% das perdas em condições de referência
        const kwhEvaporacaoBase = (kwhRadiacaoBase * 2.8) * fatorVento;
        const kwhConveccaoBase = (kwhRadiacaoBase * 0.45) * fatorVento;
        const kwhConducaoBase = kwhRadiacaoBase * 0.15; // Parcela menor (paredes/solo)

        const totalSemCapa = kwhRadiacaoBase + kwhEvaporacaoBase + kwhConveccaoBase + kwhConducaoBase;

        // Fatores de redução conforme tipo de cobertura
        let fEvap = 1.0, fRad = 1.0, fConv = 1.0, fCond = 1.0;

        if (tipoCobertura === 'simples') {
            fEvap = 0.10; // Bloqueia 90% da evaporação
            fRad = 0.75;  // Lona simples ainda irradia boa parte do IV
            fConv = 0.30; // Reduz contato direto com ar
        } else if (tipoCobertura === 'termica') {
            fEvap = 0.05; // Bloqueia 95% da evaporação
            fRad = 0.25;  // Superfície intermediária isolante e refletiva
            fConv = 0.15; // Isola do vento e convecção
        }

        dadosPerdas.evaporacao = kwhEvaporacaoBase * fEvap;
        dadosPerdas.radiacao = kwhRadiacaoBase * fRad;
        dadosPerdas.conveccao = kwhConveccaoBase * fConv;
        dadosPerdas.conducao = kwhConducaoBase * fCond;

        const totalAtual = dadosPerdas.evaporacao + dadosPerdas.radiacao + dadosPerdas.conveccao + dadosPerdas.conducao;
        const ivEfetivoWm2 = perdaIvBaseWm2 * fRad;
        const economia = totalSemCapa > 0 ? Math.round(((totalSemCapa - totalAtual) / totalSemCapa) * 100) : 0;

        resIv.textContent = `${ivEfetivoWm2.toFixed(1)} W/m²`;
        resTotalKwh.textContent = `${totalAtual.toFixed(1)} kWh`;
        resEconomia.textContent = `${economia}%`;

        if (tipoCobertura === 'nenhuma') {
            resDiagnostico.textContent = condicaoAr === 'parado'
                ? '⚠️ Mesmo com ar parado, há forte perda por evaporação, radiação IV e convecção natural!'
                : '🚨 Perda máxima! O vento acelera a evaporação e a convecção forçada.';
            resDiagnostico.style.color = '#D9534F';
        } else if (tipoCobertura === 'simples') {
            resDiagnostico.textContent = '🟡 Evaporação controlada, mas ainda há perda relevante por radiação IV para o céu frio.';
            resDiagnostico.style.color = '#B45309';
        } else {
            resDiagnostico.textContent = '✅ Alta eficiência! Cobertura reduz evaporação, convecção e perda líquida por radiação IV.';
            resDiagnostico.style.color = '#2E7D32';
        }

        desenharGraficoBarras();
    }

    // =========================================
    // 4. GRÁFICO INTERATIVO DE BARRAS (CANVAS)
    // =========================================
    const canvasGrafico = document.getElementById('canvas-grafico');
    const ctxGraf = canvasGrafico.getContext('2d');

    function desenharGraficoBarras() {
        const w = canvasGrafico.width;
        const h = canvasGrafico.height;
        ctxGraf.clearRect(0, 0, w, h);

        // Fundo escuro de alto contraste
        ctxGraf.fillStyle = '#0F172A';
        ctxGraf.fillRect(0, 0, w, h);

        const categorias = [
            { nome: 'Evaporação (~70% ref.)', valor: dadosPerdas.evaporacao, cor: '#38BDF8' },
            { nome: 'Radiação Infravermelha', valor: dadosPerdas.radiacao, cor: '#FF7A00' },
            { nome: 'Convecção (Ar)', valor: dadosPerdas.conveccao, cor: '#FACC15' },
            { nome: 'Condução (Paredes/Solo)', valor: dadosPerdas.conducao, cor: '#A78BFA' }
        ];

        const maxEscala = 220; // Escala máxima em kWh para visualização comparativa
        const margemEsq = 230;
        const areaBarra = w - margemEsq - 90;

        categorias.forEach((cat, idx) => {
            const y = 35 + idx * 58;
            const larguraBarra = Math.min((cat.valor / maxEscala) * areaBarra, areaBarra);

            // Rótulo da categoria
            ctxGraf.fillStyle = '#F8FAFC';
            ctxGraf.font = 'bold 15px sans-serif';
            ctxGraf.fillText(cat.nome, 20, y + 22);

            // Trilha de fundo da barra
            ctxGraf.fillStyle = '#1E293B';
            ctxGraf.fillRect(margemEsq, y, areaBarra, 30);

            // Barra preenchida
            ctxGraf.fillStyle = cat.cor;
            ctxGraf.fillRect(margemEsq, y, Math.max(larguraBarra, 4), 30);

            // Valor numérico em kWh
            ctxGraf.fillStyle = '#FFFFFF';
            ctxGraf.font = 'bold 14px sans-serif';
            ctxGraf.fillText(`${cat.valor.toFixed(1)} kWh`, margemEsq + areaBarra + 12, y + 21);
        });
    }

    sliderAgua.addEventListener('input', atualizarSimulador);
    sliderAmbiente.addEventListener('input', atualizarSimulador);
    selectAr.addEventListener('change', atualizarSimulador);
    selectCobertura.addEventListener('change', atualizarSimulador);
    atualizarSimulador();

    // =========================================
    // 5. ANIMAÇÃO FLUXO DE RADIAÇÃO IV (CANVAS)
    // =========================================
    const canvasTermico = document.getElementById('canvas-termico');
    const ctxTerm = canvasTermico.getContext('2d');
    let frame = 0;

    function animarFluxoIV() {
        ctxTerm.clearRect(0, 0, canvasTermico.width, canvasTermico.height);
        const cobertura = selectCobertura.value;

        // Céu noturno / Ambiente
        ctxTerm.fillStyle = '#0F172A';
        ctxTerm.fillRect(0, 0, canvasTermico.width, 190);

        // Água aquecida
        ctxTerm.fillStyle = '#0284C7';
        ctxTerm.fillRect(0, 190, canvasTermico.width, 140);

        ctxTerm.fillStyle = '#FFFFFF';
        ctxTerm.font = 'bold 14px sans-serif';
        ctxTerm.fillText(`Água da Piscina (${sliderAgua.value}°C)`, 20, 275);
        ctxTerm.fillStyle = '#94A3B8';
        ctxTerm.fillText(`Céu / Ambiente (${sliderAmbiente.value}°C)`, 20, 26);

        // Desenho da Cobertura selecionada
        if (cobertura === 'simples') {
            ctxTerm.fillStyle = '#38BDF8';
            ctxTerm.fillRect(0, 184, canvasTermico.width, 6);
            ctxTerm.fillStyle = '#E0F2FE';
            ctxTerm.fillText('LONA SIMPLES (Bloqueia vapor, deixa passar parte do IV)', 75, 175);
        } else if (cobertura === 'termica') {
            ctxTerm.fillStyle = '#F59E0B';
            ctxTerm.fillRect(0, 182, canvasTermico.width, 10);
            ctxTerm.fillStyle = '#FEF3C7';
            ctxTerm.fillText('MANTA TÉRMICA (Barreira física + isolamento de radiação IV)', 65, 173);
        }

        // Ondas de Radiação IV emitidas pela água (Laranja) e refletidas (Verde)
        for (let i = 1; i <= 5; i++) {
            const x = i * 85;
            const ciclo = (frame + i * 22) % 135;
            const ySubindo = 180 - ciclo;

            if (cobertura === 'termica' && ySubindo < 182) {
                desenharSeta(x, 196 + (ciclo % 35), '#34D399', true);
            } else if (cobertura === 'simples' && i % 2 === 0 && ySubindo < 184) {
                desenharSeta(x, 196 + (ciclo % 35), '#34D399', true);
            } else {
                desenharSeta(x, ySubindo, '#FF7A00', false);
            }
        }

        // Ondas de Radiação IV absorvidas do ambiente (Azul)
        for (let i = 1; i <= 3; i++) {
            const x = i * 130 + 30;
            const yDescendo = 40 + ((frame + i * 35) % 125);
            desenharSeta(x, yDescendo, '#38BDF8', true);
        }

        frame += 1.2;
        requestAnimationFrame(animarFluxoIV);
    }

    function desenharSeta(x, y, cor, paraBaixo) {
        ctxTerm.strokeStyle = cor;
        ctxTerm.lineWidth = 3;
        ctxTerm.beginPath();
        ctxTerm.moveTo(x, y);
        ctxTerm.lineTo(x, y + 18);
        ctxTerm.stroke();

        ctxTerm.fillStyle = cor;
        ctxTerm.beginPath();
        if (paraBaixo) {
            ctxTerm.moveTo(x - 5, y + 13);
            ctxTerm.lineTo(x + 5, y + 13);
            ctxTerm.lineTo(x, y + 21);
        } else {
            ctxTerm.moveTo(x - 5, y + 5);
            ctxTerm.lineTo(x + 5, y + 5);
            ctxTerm.lineTo(x, y - 3);
        }
        ctxTerm.fill();
    }

    animarFluxoIV();

    // =========================================
    // 6. SIMULADOR DE ROBÓTICA (LÓGICA ESP32)
    // =========================================
    const botoesCenario = document.querySelectorAll('.btn-cenario');
    const terminalRobo = document.getElementById('terminal-robo');

    const logsCenarios = {
        'dia-sol': `
            <p>> [LDR]: Radiação solar alta detectada (Período Diurno).</p>
            <p>> [MLX90614]: Temp. Água = 28.0°C | Temp. Ar = 29.5°C.</p>
            <p>> [DECISÃO ESP32]: Ganho térmico solar ativo + Horário de aulas.</p>
            <p>> [ATUADOR]: Enrolando manta térmica para absorção solar.</p>
        `,
        'noite-limpa': `
            <p>> [LDR]: Escuridão detectada (Período Noturno).</p>
            <p>> [MLX90614]: Temp. Água = 28.0°C | Céu limpo radiativo frio.</p>
            <p>> [ALERTA]: Alta emissão líquida de radiação IV e evaporação!</p>
            <p>> [ATUADOR]: Acionando Motor DC -> Piscina COBERTA automaticamente.</p>
        `,
        'ar-parado': `
            <p>> [ANEMÔMETRO]: Vento = 0 km/h (Ar relativamente parado).</p>
            <p>> [DHT22 / MLX90614]: Água = 27.5°C | Ar = 16.5°C.</p>
            <p>> [DECISÃO ESP32]: Perda ativa por radiação IV, evaporação e convecção natural.</p>
            <p>> [ATUADOR]: Sem aulas no momento -> Manta térmica ESTENDIDA.</p>
        `
    };

    botoesCenario.forEach(botao => {
        botao.addEventListener('click', () => {
            const cenario = botao.getAttribute('data-cenario');
            terminalRobo.innerHTML = logsCenarios[cenario];
        });
    });

    // =========================================
    // 7. QUIZ INTERATIVO COM PONTUAÇÃO
    // =========================================
    const questoesQuiz = [
        {
            pergunta: "1. Por que a água aquecida de uma piscina emite radiação infravermelha?",
            opcoes: [
                "Apenas quando o vento sopra sobre a superfície da água.",
                "Porque suas partículas possuem energia térmica e estão em constante agitação, gerando ondas eletromagnéticas.",
                "Somente durante o dia, enquanto recebe luz solar direta."
            ],
            correta: 1,
            explicacao: "Correto! Todo corpo acima do zero absoluto possui partículas agitadas que emitem radiação eletromagnética (na faixa do infravermelho em temperaturas comuns), sem precisar de contato ou meio material."
        },
        {
            pergunta: "2. De acordo com a Lei de Stefan-Boltzmann, como a temperatura influencia a emissão de radiação?",
            opcoes: [
                "A potência emitida cresce proporcionalmente à quarta potência da temperatura absoluta (T⁴).",
                "A temperatura não altera a emissão de radiação infravermelha.",
                "Quanto maior a temperatura da água, menor é a radiação emitida."
            ],
            correta: 0,
            explicacao: "Exato! Na equação P = ε·σ·A·T⁴, a temperatura absoluta (em Kelvin) está elevada à quarta potência, fazendo a emissão crescer rapidamente quando a água aquece."
        },
        {
            pergunta: "3. Por que a piscina continua perdendo calor mesmo quando o ar está relativamente parado (sem vento)?",
            opcoes: [
                "Porque sem vento a condução pelo fundo da piscina aumenta 10 vezes.",
                "Porque radiação infravermelha, evaporação e convecção natural continuam ocorrendo sem depender do vento.",
                "Na verdade, sem vento a piscina não perde nenhuma energia térmica."
            ],
            correta: 1,
            explicacao: "Muito bem! A radiação IV propaga-se sem meio material, moléculas continuam evaporando da superfície e a diferença de temperatura gera correntes espontâneas de convecção natural."
        },
        {
            pergunta: "4. Segundo dados do Departamento de Energia dos EUA citados na pesquisa, qual processo responde por cerca de 70% das perdas térmicas em piscinas?",
            opcoes: [
                "Condução térmica pelas paredes de azulejo.",
                "Evaporação da água na superfície.",
                "Reflexão da luz azul."
            ],
            correta: 1,
            explicacao: "Isso mesmo! A evaporação retira grande quantidade de energia térmica quando as moléculas passam do estado líquido para o gasoso."
        },
        {
            pergunta: "5. Como uma cobertura térmica automatizada torna o aquecimento da piscina escolar mais econômico?",
            opcoes: [
                "Bloqueando a evaporação, reduzindo a convecção com o ar e atuando como barreira intermediária contra perdas por radiação IV.",
                "Aumentando a velocidade do vento sobre a superfície durante a madrugada.",
                "Resfriando a água para impedir a agitação das moléculas."
            ],
            correta: 0,
            explicacao: "Perfeito! Ao conservar o calor acumulado durante o dia, a cobertura reduz drasticamente a necessidade de gastar energia para reaquecer a piscina."
        }
    ];

    let indiceAtual = 0;
    let pontuacao = 0;

    const quizContador = document.getElementById('quiz-contador');
    const quizPlacar = document.getElementById('quiz-placar-parcial');
    const quizPergunta = document.getElementById('quiz-pergunta');
    const quizOpcoes = document.getElementById('quiz-opcoes');
    const quizFeedback = document.getElementById('quiz-feedback');
    const btnProxima = document.getElementById('btn-proxima-pergunta');
    const btnReiniciar = document.getElementById('btn-reiniciar-quiz');

    function carregarPergunta() {
        const q = questoesQuiz[indiceAtual];
        quizContador.textContent = `Pergunta ${indiceAtual + 1} de ${questoesQuiz.length}`;
        quizPlacar.textContent = `Pontuação: ${pontuacao}`;
        quizPergunta.textContent = q.pergunta;
        quizOpcoes.innerHTML = '';
        quizFeedback.className = 'quiz-feedback';
        quizFeedback.textContent = '';
        btnProxima.disabled = true;

        q.opcoes.forEach((textoOpcao, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'opcao-btn';
            btn.textContent = textoOpcao;
            btn.addEventListener('click', () => verificarResposta(index, btn));
            quizOpcoes.appendChild(btn);
        });
    }

    function verificarResposta(indiceEscolhido, botaoClicado) {
        const q = questoesQuiz[indiceAtual];
        const todosBotoes = quizOpcoes.querySelectorAll('.opcao-btn');

        todosBotoes.forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === q.correta) {
                btn.classList.add('correta');
            }
        });

        if (indiceEscolhido === q.correta) {
            pontuacao++;
            quizPlacar.textContent = `Pontuação: ${pontuacao}`;
            quizFeedback.textContent = `✅ ${q.explicacao}`;
        } else {
            botaoClicado.classList.add('errada');
            quizFeedback.textContent = `❌ Resposta incorreta. ${q.explicacao}`;
        }

        quizFeedback.classList.add('visivel');
        btnProxima.disabled = false;
        btnProxima.focus();
    }

    btnProxima.addEventListener('click', () => {
        indiceAtual++;
        if (indiceAtual < questoesQuiz.length) {
            carregarPergunta();
        } else {
            mostrarResultadoFinal();
        }
    });

    function mostrarResultadoFinal() {
        quizContador.textContent = 'Quiz Concluído!';
        quizPergunta.textContent = `Você acertou ${pontuacao} de ${questoesQuiz.length} questões (${Math.round((pontuacao / questoesQuiz.length) * 100)}%)!`;
        quizOpcoes.innerHTML = '';
        quizFeedback.className = 'quiz-feedback visivel';

        if (pontuacao === questoesQuiz.length) {
            quizFeedback.textContent = '🏆 Excelente! Você domina os conceitos de radiação infravermelha, transferência de calor e eficiência energética na piscina escolar.';
        } else if (pontuacao >= 3) {
            quizFeedback.textContent = '👏 Muito bom! Você compreendeu os principais mecanismos térmicos. Revise o simulador para gabaritar na próxima tentativa.';
        } else {
            quizFeedback.textContent = '📚 Continue explorando as seções de Física e o Simulador acima para reforçar os conceitos e tente novamente!';
        }

        btnProxima.style.display = 'none';
        btnReiniciar.style.display = 'inline-block';
    }

    btnReiniciar.addEventListener('click', () => {
        indiceAtual = 0;
        pontuacao = 0;
        btnProxima.style.display = 'inline-block';
        btnReiniciar.style.display = 'none';
        carregarPergunta();
    });

    carregarPergunta();
});
