


// script.js
// Lógica principal do jogo de plataforma 'Crystal Quest' com múltiplos níveis, progressão automática e coletáveis.

// --- VARIÁVEIS DE ESTADO DO JOGO ---
let isGameRunning = false;
let isTransitioning = false; // Sinaliza que o nível terminou e está em transição
let score = 0;
let lives = 3;
let currentLevel = 1; 
let playerName = "Piloto X";
let gameLoopId; 
let lastTime = 0;
const CANVAS_WIDTH = 800; 
const CANVAS_HEIGHT = 400; 

// --- CONTROLE DE ENTRADA ---
const keys = {
    left: false,
    right: false,
    up: false 
};

// --- ELEMENTOS DO DOM (Definidos no HTML) ---
let menuScreen, gameScreen, endGameScreen, pauseScreen;
let startBtn, resumeBtn;
let canvas, ctx;
let hudScore, hudLives, hudPlayerName; 

// --- OBJETOS DE JOGO ---
const player = { 
    x: 50, 
    y: CANVAS_HEIGHT - 30, 
    width: 20, 
    height: 20, 
    // A velocidade base será aplicada pelo loadLevel
    color: '#fcd34d', 
    speed: 5, // Valor padrão, será sobrescrito pelo nível
    jumpPower: 12, 
    isJumping: false, 
    yVelocity: 0, 
    gravity: 0.8 
};

// Arrays que serão populados dinamicamente com base no nível
let platforms = [];
let enemies = [];
let crystals = []; // Estrelas coletáveis
let exitGate = null; // Portal de saída do nível

// --- DADOS DO NÍVEL ---
const levelData = [
    // Índice 0 é ignorado. Níveis reais começam no Índice 1
    null,
    // ====================================================================
    // NÍVEL 1: Introdução (Fácil - Plataformas Mais Próximas)
    // ====================================================================
    {
        playerStart: { x: 50, y: CANVAS_HEIGHT - 30 },
        playerSpeed: 5, // Velocidade normal
        platforms: [
            { x: 0, y: CANVAS_HEIGHT - 20, width: CANVAS_WIDTH, height: 20, color: '#475569' }, // Chão
            { x: 80, y: CANVAS_HEIGHT - 60, width: 120, height: 10, color: '#475569' }, 
            { x: 280, y: CANVAS_HEIGHT - 100, width: 150, height: 10, color: '#475569' }, 
            { x: 500, y: CANVAS_HEIGHT - 80, width: 100, height: 10, color: '#475569' }, 
        ],
        enemies: [
            // Inimigo de chão lento e com patrulha curta
            { type: 'ground', x: 500, y: CANVAS_HEIGHT - 40, width: 20, height: 20, color: '#ef4444', direction: 1, travelDistance: 100, originalX: 500, speed: 1.5 }
        ],
        crystals: [
            { x: 140, y: CANVAS_HEIGHT - 75, width: 10, height: 10, value: 10 },
            { x: 350, y: CANVAS_HEIGHT - 115, width: 10, height: 10, value: 10 }
        ],
        // Portal de Saída (maior altura para parecer uma porta)
        exitGate: { x: CANVAS_WIDTH - 50, y: CANVAS_HEIGHT - 70, width: 20, height: 50, color: '#6d28d9' } 
    },
    // ====================================================================
    // NÍVEL 2: Médio - Velocidade do Jogador Diminuída (2)
    // ====================================================================
    {
        playerStart: { x: 50, y: CANVAS_HEIGHT - 30 },
        playerSpeed: 2, // Velocidade reduzida para 2
        platforms: [
            { x: 0, y: CANVAS_HEIGHT - 20, width: CANVAS_WIDTH, height: 20, color: '#475569' }, // Chão
            { x: 150, y: CANVAS_HEIGHT - 100, width: 150, height: 10, color: '#475569' }, 
            { x: 400, y: CANVAS_HEIGHT - 180, width: 100, height: 10, color: '#475569' }, 
            // Plataforma final
            { x: 650, y: CANVAS_HEIGHT - 150, width: 80, height: 10, color: '#475569' }, 
        ],
        enemies: [
            // Inimigo 1: Patrulha pequena e rápida no chão.
            { type: 'ground', x: 350, y: CANVAS_HEIGHT - 40, width: 20, height: 20, color: '#ef4444', direction: 1, travelDistance: 100, originalX: 350, speed: 2.5 },
            // Inimigo 2: Aéreo
            { type: 'air', x: 400, y: CANVAS_HEIGHT - 220, width: 15, height: 15, color: '#f97316', direction: -1, travelDistance: 80, originalX: 400, speed: 2 }, 
        ],
        crystals: [
            { x: 220, y: CANVAS_HEIGHT - 115, width: 10, height: 10, value: 10 },
            { x: 445, y: CANVAS_HEIGHT - 195, width: 10, height: 10, value: 10 },
            { x: 700, y: CANVAS_HEIGHT - 165, width: 10, height: 10, value: 10 }
        ],
        // Portal de Saída no alto
        exitGate: { x: CANVAS_WIDTH - 50, y: CANVAS_HEIGHT - 200, width: 20, height: 50, color: '#6d28d9' }
    },
    // ====================================================================
    // NÍVEL 3: Difícil - Inimigos com Patrulha Longa e Múltiplos Inimigos
    // ====================================================================
    {
        playerStart: { x: 30, y: CANVAS_HEIGHT - 30 }, // Ponto de spawn seguro
        playerSpeed: 5, // Velocidade normal
        platforms: [
            { x: 0, y: CANVAS_HEIGHT - 20, width: CANVAS_WIDTH, height: 20, color: '#475569' },
            { x: 100, y: CANVAS_HEIGHT - 100, width: 50, height: 10, color: '#475569' },
            { x: 200, y: CANVAS_HEIGHT - 180, width: 50, height: 10, color: '#475569' },
            { x: 350, y: CANVAS_HEIGHT - 260, width: 100, height: 10, color: '#475569' },
            { x: 550, y: CANVAS_HEIGHT - 150, width: 50, height: 10, color: '#475569' },
        ],
        enemies: [
            // Inimigo 1 (Chão): Afastado do spawn do jogador (originalX: 150)
            { type: 'ground', x: 150, y: CANVAS_HEIGHT - 40, width: 20, height: 20, color: '#ef4444', direction: 1, travelDistance: 150, originalX: 150, speed: 3.5 },
            // Inimigo 2 (Chão): Patrulha longa e rápida (início diferente)
            { type: 'ground', x: 500, y: CANVAS_HEIGHT - 40, width: 20, height: 20, color: '#ef4444', direction: -1, travelDistance: 250, originalX: 500, speed: 3.5 },
            // Inimigo 3 (Aéreo): Patrulha longa e lenta no topo
            { type: 'air', x: 250, y: 100, width: 15, height: 15, color: '#f97316', direction: 1, travelDistance: 300, originalX: 250, speed: 2.2 },
            // Inimigo 4 (Aéreo): Patrulha curta e rápida perto da plataforma 5
            { type: 'air', x: 500, y: 180, width: 15, height: 15, color: '#f97316', direction: -1, travelDistance: 80, originalX: 500, speed: 3 },
            // NOVO INIMIGO 5 (Aéreo): Aumentando a dificuldade
            { type: 'air', x: 750, y: CANVAS_HEIGHT - 100, width: 15, height: 15, color: '#f97316', direction: -1, travelDistance: 100, originalX: 750, speed: 2.8 },
        ],
        crystals: [
            { x: 125, y: CANVAS_HEIGHT - 115, width: 10, height: 10, value: 10 },
            { x: 225, y: CANVAS_HEIGHT - 195, width: 10, height: 10, value: 10 },
            { x: 400, y: CANVAS_HEIGHT - 275, width: 10, height: 10, value: 10 },
            { x: 575, y: CANVAS_HEIGHT - 165, width: 10, height: 10, value: 10 }
        ],
        // Portal de Saída no alto
        exitGate: { x: 750, y: CANVAS_HEIGHT - 190, width: 20, height: 50, color: '#6d28d9' }
    }
];

// --- FUNÇÕES DE CONTROLE DE TELA ---

/**
 * Esconde todas as telas principais e mostra a tela desejada.
 * @param {HTMLElement} screenToShow - O elemento de tela que deve ser exibido.
 */
function showScreen(screenToShow) {
    [menuScreen, gameScreen, endGameScreen, pauseScreen].forEach(screen => {
        if (screen) {
            screen.classList.add('hidden');
        }
    });

    if (screenToShow) {
        screenToShow.classList.remove('hidden');
    }

    const pauseBtn = document.getElementById('pauseBtn');
    const touchControls = document.getElementById('touchControls');

    if (screenToShow === gameScreen) {
        pauseBtn?.classList.remove('hidden');
        touchControls?.classList.remove('hidden');
    } else {
        pauseBtn?.classList.add('hidden');
        touchControls?.classList.add('hidden');
        document.getElementById('menuBtn')?.classList.add('hidden');
    }
}

/**
 * Carrega a configuração de plataformas, inimigos, cristais e ponto de partida do nível especificado.
 * @param {number} levelNum - O número do nível a carregar.
 */
function loadLevel(levelNum) {
    if (levelNum > levelData.length - 1) {
        // Fim do Jogo / Conclusão
        endGame("Missão Completa!");
        return;
    }

    currentLevel = levelNum;
    const data = levelData[currentLevel];

    // 1. Reseta o Jogador para a posição inicial do Nível
    const startPos = data.playerStart;
    player.x = startPos.x;
    player.y = startPos.y;
    player.yVelocity = 0;
    player.isJumping = false;
    
    // APLICAÇÃO DA VELOCIDADE ESPECÍFICA DO NÍVEL
    player.speed = data.playerSpeed;

    // 2. Carrega Plataformas, Inimigos e Cristais
    // Usamos JSON.parse(JSON.stringify()) para criar cópias independentes
    platforms = JSON.parse(JSON.stringify(data.platforms));
    enemies = JSON.parse(JSON.stringify(data.enemies));
    crystals = JSON.parse(JSON.stringify(data.crystals)); // Carrega estrelas/cristais
    exitGate = JSON.parse(JSON.stringify(data.exitGate));
    
    // 3. Atualiza o HUD
    updateHUD();
    console.log(`Nível ${currentLevel} carregado. Inimigos: ${enemies.length}`);
}

/**
 * Prepara o próximo nível (com progressão automática e delay).
 */
function nextLevel() {
    // 1. Sinaliza o início da transição e para o jogo
    isTransitioning = true;
    isGameRunning = false; 
    cancelAnimationFrame(gameLoopId); 
    
    // Desenha a tela de transição imediatamente
    draw(); 
    
    // 2. Inicia o Timer para carregar o próximo nível
    setTimeout(() => {
        isTransitioning = false; 
        
        // Tenta carregar o próximo nível (chama endGame se for o último)
        loadLevel(currentLevel + 1); 

        // 3. Verifica se o jogo deve ser retomado (se não foi chamado endGame)
        if (currentLevel < levelData.length) {
            isGameRunning = true; // REINICIA O JOGO AQUI
            lastTime = 0; // Resetar lastTime para a próxima execução limpa
            // Garantir que o loop comece
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    }, 2000); // Pausa de 2 segundos
}

/**
 * Finaliza o jogo.
 * @param {string} message - A mensagem a ser exibida.
 */
function endGame(message) {
    // ESSENCIAL: Parar o loop do jogo imediatamente
    isGameRunning = false;
    cancelAnimationFrame(gameLoopId);
    
    document.getElementById('endGameMessage').textContent = message;
    document.getElementById('endGameScore').textContent = `Pontuação: ${score}`;

    // ESSENCIAL: Exibir a tela de Game Over
    showScreen(endGameScreen); 
}


/**
 * Inicializa o jogo: carrega dados, reseta o estado e inicia o loop.
 */
function startGame() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    
    const playerNameInput = document.getElementById('playerName');
    playerName = playerNameInput ? playerName.value || "Piloto X" : "Piloto X";

    score = 0;
    lives = 3;
    isGameRunning = true;
    isTransitioning = false;
    
    loadLevel(1); 

    showScreen(gameScreen);
    
    // Resetar lastTime ANTES de iniciar o loop principal para evitar grande deltaTime na primeira execução
    lastTime = 0;
    gameLoopId = requestAnimationFrame(gameLoop);
}

/**
 * Pausa o jogo.
 */
function pauseGame() {
    isGameRunning = false;
    cancelAnimationFrame(gameLoopId);
    if (pauseScreen) {
        pauseScreen.classList.remove('hidden');
        document.getElementById('pauseBtn')?.classList.add('hidden');
    }
}

/**
 * Retoma o jogo.
 */
function resumeGame() {
    if (pauseScreen) {
        pauseScreen.classList.add('hidden');
    }
    isGameRunning = true;
    lastTime = 0; // Resetar lastTime para garantir que o loop recomece suavemente
    document.getElementById('pauseBtn')?.classList.remove('hidden');
    gameLoopId = requestAnimationFrame(gameLoop);
}

/**
 * Atualiza o HUD (Heads-Up Display).
 */
function updateHUD() {
    if (hudScore) hudScore.textContent = score; 
    if (hudLives) hudLives.textContent = lives; 
    if (hudPlayerName) hudPlayerName.textContent = `${playerName} | Nível: ${currentLevel}`;
}

// --- FUNÇÕES DE LÓGICA DO JOGO (FÍSICA & ATUALIZAÇÃO) ---

/**
 * Lida com o pressionamento e soltura das teclas do teclado.
 */
function handleKey(event) {
    if (!isGameRunning || isTransitioning) return; 

    const key = event.key.toLowerCase();
    const isDown = event.type === 'keydown';

    switch (key) {
        case 'a':
        case 'arrowleft':
            keys.left = isDown;
            break;
        case 'd':
        case 'arrowright':
            keys.right = isDown;
            break;
        case 'w':
        case 'arrowup':
        case ' ': 
            keys.up = isDown;
            if (isDown) event.preventDefault(); 
            break;
    }
}

/**
 * Processa a entrada do usuário (teclado e toque) para mover o jogador.
 */
function handleInput() {
    // A velocidade horizontal é constante
    if (keys.left) {
        player.x -= player.speed;
    }
    if (keys.right) {
        player.x += player.speed;
    }

    if (keys.up && !player.isJumping) {
        player.isJumping = true;
        player.yVelocity = -player.jumpPower;
    }
    if (player.isJumping) {
        keys.up = false; 
    }
}

/**
 * Verifica se dois retângulos estão se sobrepondo (colisão AABB).
 */
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * Reseta a posição do jogador para o ponto inicial do nível atual.
 */
function resetPlayerPosition() {
    const startPos = levelData[currentLevel].playerStart;
    player.x = startPos.x;
    player.y = startPos.y;
    player.yVelocity = 0;
    player.isJumping = false;
}

/**
 * Atualiza o estado do jogador (gravidade, movimento horizontal, colisão).
 * @param {number} deltaTime - Tempo decorrido desde o último quadro (em milissegundos).
 */
function updatePlayer(deltaTime) {
    // Fator de escala para garantir movimento consistente, independentemente do framerate
    const factor = deltaTime / 16.67; // 16.67ms é o tempo de um frame a 60FPS
    
    // 1. Aplica a Gravidade
    player.yVelocity += player.gravity * factor;
    player.y += player.yVelocity * factor;

    let standingOnPlatform = false;

    platforms.forEach(p => {
        // Colisão de topo
        if (player.y + player.height > p.y && 
            player.y + player.height < p.y + p.height + 5 && 
            player.x < p.x + p.width && 
            player.x + player.width > p.x &&
            player.yVelocity >= 0 
        ) {
            player.y = p.y - player.height; 
            player.yVelocity = 0; 
            player.isJumping = false;
            standingOnPlatform = true;
        }

        // Colisão de fundo (caso o jogador pule por baixo)
        if (player.y < p.y + p.height && 
            player.y + player.height > p.y + p.height && 
            player.x < p.x + p.width && 
            player.x + player.width > p.x &&
            player.yVelocity < 0 
        ) {
            player.y = p.y + p.height; 
            player.yVelocity = 0; 
        }
    });

    // 3. Colisão com o chão (se não estiver em outra plataforma)
    if (!standingOnPlatform && player.y + player.height >= CANVAS_HEIGHT) {
        player.y = CANVAS_HEIGHT - player.height;
        player.yVelocity = 0;
        player.isJumping = false;
    }
    
    // 4. Limites do Canvas 
    player.x = Math.max(0, Math.min(player.x, CANVAS_WIDTH - player.width));
}

/**
 * Atualiza a posição e o estado dos inimigos.
 * @param {number} deltaTime - Tempo decorrido desde o último quadro (em milissegundos).
 */
function updateEnemies(deltaTime) {
    const factor = deltaTime / 16.67;

    enemies.forEach(enemy => {
        enemy.x += enemy.speed * enemy.direction * factor;

        // Verifica o limite de patrulha
        const maxLimit = enemy.originalX + enemy.travelDistance;
        const minLimit = enemy.originalX - enemy.travelDistance;

        if (enemy.direction === 1 && enemy.x >= maxLimit) {
            enemy.direction = -1; 
        } else if (enemy.direction === -1 && enemy.x <= minLimit) {
            enemy.direction = 1; 
        }
    });
}

/**
 * Verifica colisões entre o jogador e outros objetos (dano, coleta e transição de nível).
 */
function checkCollisions() {
    // 1. Colisão Jogador vs Estrelas (Coleta)
    const collectedCrystals = [];
    crystals = crystals.filter(crystal => {
        if (isColliding(player, crystal)) {
            collectedCrystals.push(crystal);
            return false; // Remove a estrela do array
        }
        return true; // Mantém a estrela
    });

    collectedCrystals.forEach(crystal => {
        score += crystal.value;
        updateHUD();
    });

    // 2. Colisão Jogador vs Inimigos (Dano)
    enemies.forEach(enemy => {
        if (isColliding(player, enemy)) {
            lives--;
            updateHUD();
            resetPlayerPosition();

            // Lógica de Game Over quando as vidas acabam
            if (lives <= 0) {
                // CHAMA ENDGAME AQUI!
                endGame("Missão Fracassada!");
            }
        }
    });

    // 3. Colisão Jogador vs Portal de Saída (Transição de Nível AUTOMÁTICA)
    if (!isTransitioning && exitGate && isColliding(player, exitGate)) {
        nextLevel();
    }
}

/**
 * Desenha todos os elementos na tela.
 */
function draw() {
    if (!ctx) return;
    
    // 1. Limpa o canvas e desenha o fundo
    ctx.fillStyle = '#1e293b'; // Azul escuro
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Desenha plataformas
    platforms.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // 3. Desenha Estrelas (usando emoji)
    ctx.font = '18px Inter, sans-serif'; 
    ctx.textAlign = 'center';
    crystals.forEach(c => {
        // Desenha o emoji da estrela no centro do retângulo de colisão (10x10)
        ctx.fillText('⭐', c.x + c.width / 2, c.y + c.height); 
    });

    // 4. Desenha Inimigos
    enemies.forEach(enemy => {
        // Desenha o corpo do inimigo
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        // Marcador visual (para diferenciar tipo: 'air' ou 'ground')
        ctx.fillStyle = enemy.type === 'air' ? '#fde047' : 'white';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, 5, 5); 
    });

    // 5. Desenha o Portal de Saída (Door/Gate - Retângulo alto roxo)
    if (exitGate) {
        ctx.fillStyle = exitGate.color; // Roxo Profundo
        ctx.fillRect(exitGate.x, exitGate.y, exitGate.width, exitGate.height);
        
        // Adiciona um visual de entrada/portal (opcional)
        ctx.fillStyle = '#8b5cf6'; // Roxo mais claro
        ctx.fillRect(exitGate.x + 5, exitGate.y + 5, exitGate.width - 10, exitGate.height - 10);
    }
    
    // 6. Desenha o jogador (Usando emoji de Caveira)
    ctx.font = '24px Inter, sans-serif'; // Tamanho maior para o personagem
    ctx.textAlign = 'center';
    // Desenha o emoji no centro do retângulo de colisão (20x20)
    ctx.fillText('💀', player.x + player.width / 2, player.y + player.height - 2); 
    
    // 7. Mensagem de Transição de Nível
    if (isTransitioning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Fundo escuro
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = 'white';
        ctx.font = '30px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("NÍVEL CONCLUÍDO!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = '18px Inter, sans-serif';
        ctx.fillText("Preparando próximo desafio...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }
}

/**
 * O Loop Principal do Jogo (Game Loop).
 */
function gameLoop(currentTime) {
    if (!isGameRunning) {
        // Se o jogo não está rodando, mas está em transição, desenhe o quadro de transição
        if (isTransitioning) {
            draw();
            gameLoopId = requestAnimationFrame(gameLoop); // Continua chamando o draw durante a transição
        }
        return;
    }

    if (lastTime === 0) {
        lastTime = currentTime;
    }
    
    // Calcula o tempo decorrido para movimento consistente (resolvendo o "lagado")
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime; 

    // Atualiza lógica e desenha o quadro
    handleInput();
    updatePlayer(deltaTime);
    updateEnemies(deltaTime); 
    checkCollisions();
    draw();

    gameLoopId = requestAnimationFrame(gameLoop);
}

/**
 * Configura os listeners para os botões táteis (mobile).
 */
function setupTouchControls() {
    const touchLeft = document.getElementById('touchLeft');
    const touchRight = document.getElementById('touchRight');
    const touchJump = document.getElementById('touchJump');

    const createTouchHandler = (keyName, isJump = false) => (event) => {
        if (!isGameRunning || isTransitioning) return;
        event.preventDefault(); 
        const isStart = event.type === 'touchstart';
        
        if (isJump) {
            if (isStart) keys.up = true;
            else keys.up = false;
        } else {
            keys[keyName] = isStart;
        }
    };

    if (touchLeft) {
        touchLeft.addEventListener('touchstart', createTouchHandler('left'));
        touchLeft.addEventListener('touchend', createTouchHandler('left'));
    }
    if (touchRight) {
        touchRight.addEventListener('touchstart', createTouchHandler('right'));
        touchRight.addEventListener('touchend', createTouchHandler('right'));
    }
    if (touchJump) {
        touchJump.addEventListener('touchstart', createTouchHandler('up', true));
        touchJump.addEventListener('touchend', createTouchHandler('up', true));
    }
}


// --- FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mapeamento de Elementos do DOM
    menuScreen = document.getElementById('menuScreen');
    gameScreen = document.getElementById('gameScreen');
    endGameScreen = document.getElementById('endGameScreen');
    pauseScreen = document.getElementById('pauseScreen');
    startBtn = document.getElementById('startBtn');
    resumeBtn = document.getElementById('resumeBtn');
    
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
    }

    // Mapeamento do HUD
    hudScore = document.getElementById('hudScore');
    hudLives = document.getElementById('hudLives');
    hudPlayerName = document.getElementById('hudPlayerName'); 

    // 2. Verificação de Canvas
    if (!canvas || !ctx) {
        console.error('Erro Fatal: O elemento <canvas> ou o contexto 2D não foi encontrado.');
        showScreen(menuScreen); 
        return;
    }

    // 3. Adicionar Listeners de Evento
    document.addEventListener('keydown', handleKey);
    document.addEventListener('keyup', handleKey);
    setupTouchControls();

    // Botões de Tela
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }
    
    document.getElementById('pauseBtn')?.addEventListener('click', pauseGame);
    
    if (resumeBtn) {
        resumeBtn.addEventListener('click', resumeGame);
    }

    // Botões de Voltar para o Menu
    document.getElementById('pauseMenuBtn')?.addEventListener('click', () => {
        cancelAnimationFrame(gameLoopId); 
        isGameRunning = false;
        if (pauseScreen) pauseScreen.classList.add('hidden'); 
        showScreen(menuScreen); 
    });
    
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        cancelAnimationFrame(gameLoopId); 
        isGameRunning = false;
        if (pauseScreen) pauseScreen.classList.add('hidden'); 
        showScreen(menuScreen); 
    });

    // Botão de Reiniciar na tela de Fim de Jogo
    document.getElementById('restartBtn')?.addEventListener('click', () => {
        showScreen(menuScreen); // Volta ao menu para reiniciar o jogo do zero
    });


    // 4. Inicialização: Exibe o Menu Principal
    showScreen(menuScreen);
});
