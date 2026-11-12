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
                const textoResumo = "Projeto TermoPool. Radiação infravermelha e perda de energia da piscina escolar. Mesmo com o ar parado, a piscina perde calor por radiação infravermelha, evaporação e convecção natural. A emissão térmica cresce com a quarta potência da temperatura. O uso de uma cobertura térmica automatizada bloqueia a evaporação e reduz as perdas radiativas para o céu noturno.";
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
    // 3. SIMULADOR TÉRMICO BASEADO NO PDF
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
    const barraAtual = document.getElementById('barra-atual');

    function atualizarSimulador() {
        const tAguaC = parseFloat(sliderAgua.value);
        const tAmbC = parseFloat(sliderAmbiente.value);
        const condicaoAr = selectAr.value;
        const tipoCobertura = selectCobertura.value;

        valTempAgua.textContent = `${tAguaC}°C`;
        valTempAmbiente.textContent = `${tAmbC}°C`;

        // Conversão para Kelvin (Lei de Stefan-Boltzmann)
        const tAguaK = tAguaC + 273.15;
        const tAmbK = tAmbC + 273.15;

        const sigma = 5.67e-8; // Constante de Stefan-Boltzmann
        const emissividadeAgua = 0.95;
        const areaPiscina = 125; // 125 m² (piscina escolar)

        // Perda líquida por radiação infravermelha (W/m²)
        let perdaIvBruta = emissividadeAgua * sigma * (Math.pow(tAguaK, 4) - Math.pow(tAmbK, 4));
        if (perdaIvBruta < 0) perdaIvBruta = 0;

        // Fator de vento (convecção forçada + aumento de evaporação)
        const fatorVento = (condicaoAr === 'vento') ? 1.35 : 1.0;

        // Perda total sem cobertura (IV + Evaporação ~70% + Convecção + Condução)
        const perdaTotalSemCapaWm2 = (perdaIvBruta * 3.3) * fatorVento;

        // Eficiência conforme o tipo de cobertura (Seção 8 do PDF)
        let fatorRetencaoIv = 1.0;
        let fatorRetencaoTotal = 1.0;

        if (tipoCobertura === 'simples') {
            fatorRetencaoIv = 0.75;    // Reduz parcialmente IV
            fatorRetencaoTotal = 0.35; // Bloqueia evaporação, mas ainda irradia
        } else if (tipoCobertura === 'termica') {
            fatorRetencaoIv = 0.25;    // Superfície intermediária isolante e refletiva
            fatorRetencaoTotal = 0.20; // Reduz evaporação, convecção e radiação IV
        }

        const perdaIvEfetiva = perdaIvBruta * fatorRetencaoIv;
        const perdaTotalEfetivaWm2 = perdaTotalSemCapaWm2 * fatorRetencaoTotal;

        // Energia perdida em 12h noturnas (kWh)
        const kwhNoite = (perdaTotalEfetivaWm2 * areaPiscina * 12) / 1000;
        const percentualPerda = Math.round(fatorRetencaoTotal * 100);
        const economia = 100 - percentualPerda;

        resIv.textContent = `${perdaIvEfetiva.toFixed(1)} W/m²`;
        resTotalKwh.textContent = `${kwhNoite.toFixed(1)} kWh / noite`;
        resEconomia.textContent = `${economia}%`;

        // Atualiza barra comparativa
        barraAtual.style.width = `${Math.max(percentualPerda, 15)}%`;
        barraAtual.textContent = `${percentualPerda}% da perda (${economia}% economizado)`;
        barraAtual.style.backgroundColor = (economia >= 60) ? '#2E7D32' : (economia > 0 ? '#D97706' : '#D9534F');

        // Diagnóstico pedagógico
        if (tipoCobertura === 'nenhuma') {
            resDiagnostico.textContent = condicaoAr === 'parado'
                ? '⚠️ Mesmo com ar parado, a piscina perde calor por radiação IV, evaporação e convecção natural!'
                : '🚨 Perda crítica! O vento acelera a evaporação e a convecção forçada somadas à radiação IV.';
            resDiagnostico.style.color = '#D9534F';
        } else if (tipoCobertura === 'simples') {
            resDiagnostico.textContent = '🟡 Evaporação bloqueada, mas a lona simples ainda permite perda moderada por radiação IV para o céu.';
            resDiagnostico.style.color = '#B45309';
        } else {
            resDiagnostico.textContent = '✅ Máxima eficiência! A manta térmica bloqueia evaporação, convecção e reduz perdas por radiação IV.';
            resDiagnostico.style.color = '#2E7D32';
        }
    }

    sliderAgua.addEventListener('input', atualizarSimulador);
    sliderAmbiente.addEventListener('input', atualizarSimulador);
    selectAr.addEventListener('change', atualizarSimulador);
    selectCobertura.addEventListener('change', atualizarSimulador);
    atualizarSimulador();

    // =========================================
    // 4. ANIMAÇÃO GRÁFICA NO CANVAS (TROCA IV)
    // =========================================
    const canvas = document.getElementById('canvas-termico');
    const ctx = canvas.getContext('2d');
    let frame = 0;

    function desenharAnimacao() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cobertura = selectCobertura.value;

        // Céu / Atmosfera
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, canvas.width, 200);

        // Água da Piscina
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(0, 200, canvas.width, 150);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`Água (${sliderAgua.value}°C) • Emissão Contínua de IV`, 20, 280);
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Atmosfera / Céu (${sliderAmbiente.value}°C)`, 20, 28);

        // Desenho da Cobertura
        if (cobertura === 'simples') {
            ctx.fillStyle = '#38BDF8';
            ctx.fillRect(0, 193, canvas.width, 7);
            ctx.fillStyle = '#E0F2FE';
            ctx.fillText('LONA SIMPLES (Bloqueia vapor, permite parte do IV)', 95, 184);
        } else if (cobertura === 'termica') {
            ctx.fillStyle = '#F59E0B';
            ctx.fillRect(0, 191, canvas.width, 10);
            ctx.fillStyle = '#FEF3C7';
            ctx.fillText('MANTA TÉRMICA (Barreira física + isolamento radiativo)', 85, 182);
        }

        // Setas de IV emitido pela água (Laranja) e retido (Verde)
        for (let i = 1; i <= 5; i++) {
            const x = i * 85;
            const ciclo = (frame + i * 20) % 140;
            const ySubindo = 190 - ciclo;

            if (cobertura === 'termica' && ySubindo < 191) {
                // Onda retida/devolvida para a água
                desenharSeta(x, 205 + (ciclo % 35), '#34D399', true);
            } else if (cobertura === 'simples' && i % 2 === 0 && ySubindo < 193) {
                desenharSeta(x, 205 + (ciclo % 35), '#34D399', true);
            } else {
                desenharSeta(x, ySubindo, '#FF7A00', false);
            }
        }

        // Setas de IV absorvido da atmosfera (Azul claro)
        for (let i = 1; i <= 3; i++) {
            const x = i * 130 + 30;
            const yDescendo = 45 + ((frame + i * 30) % 130);
            desenharSeta(x, yDescendo, '#38BDF8', true);
        }

        frame += 1.2;
        requestAnimationFrame(desenharAnimacao);
    }

    function desenharSeta(x, y, cor, paraBaixo) {
        ctx.strokeStyle = cor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 18);
        ctx.stroke();

        ctx.fillStyle = cor;
        ctx.beginPath();
        if (paraBaixo) {
            ctx.moveTo(x - 5, y + 13);
            ctx.lineTo(x + 5, y + 13);
            ctx.lineTo(x, y + 21);
        } else {
            ctx.moveTo(x - 5, y + 5);
            ctx.lineTo(x + 5, y + 5);
            ctx.lineTo(x, y - 3);
        }
        ctx.fill();
    }

    desenharAnimacao();

    // =========================================
    // 5. SIMULADOR DE ROBÓTICA (LÓGICA ESP32)
    // =========================================
    const botoesCenario = document.querySelectorAll('.btn-cenario');
    const terminalRobo = document.getElementById('terminal-robo');

    const logsCenarios = {
        'dia-sol': `
            <p>> [SENSOR LDR]: Radiação solar intensa detectada.</p>
            <p>> [MLX90614]: Água = 28.0°C | Ar = 29.5°C.</p>
            <p>> [DECISÃO ESP32]: Ganho solar positivo + Horário de aulas.</p>
            <p>> [ATUADOR]: Enrolando manta térmica para absorção solar.</p>
        `,
        'noite-limpa': `
            <p>> [SENSOR LDR]: Ausência de luz solar (Período noturno).</p>
            <p>> [MLX90614]: Água = 28.0°C | Céu limpo radiativo frio.</p>
            <p>> [ALERTA TÉRMICO]: Perda líquida elevada por radiação IV e evaporação!</p>
            <p>> [ATUADOR]: Acionando motor DC -> Manta térmica ESTENDIDA.</p>
        `,
        'ar-parado': `
            <p>> [ANEMÔMETRO]: Velocidade do vento = 0 km/h (Ar parado).</p>
            <p>> [DHT22 / MLX90614]: Água = 27.5°C | Ar = 17.0°C.</p>
            <p>> [DECISÃO ESP32]: Perda ativa por radiação IV, evaporação e convecção natural.</p>
            <p>> [ATUADOR]: Como não há aulas agora, manta térmica ESTENDIDA.</p>
        `
    };

    botoesCenario.forEach(botao => {
        botao.addEventListener('click', () => {
            const cenario = botao.getAttribute('data-cenario');
            terminalRobo.innerHTML = logsCenarios[cenario];
        });
    });
});
