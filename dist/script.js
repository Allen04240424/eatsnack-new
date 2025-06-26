const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const historyList = document.getElementById('historyList');

const gridSize = 20; // 蛇和食物的大小
let snake = [{ x: 10, y: 10 }]; // 蛇的初始位置
let food = {}; // 食物位置
let direction = 'right'; // 初始方向
let score = 0;
let gameInterval;
let gameSpeed = 150; // 遊戲速度 (毫秒)
let isPaused = false;
let gameStarted = false;

// 載入歷史紀錄
loadHistory();

// 繪製遊戲元素
function draw() {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // 清空畫布

    // 繪製蛇
    snake.forEach(segment => {
        ctx.fillStyle = '#4CAF50'; // 蛇的顏色
        ctx.strokeStyle = '#388E3C';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });

    // 繪製食物
    ctx.fillStyle = '#FF5733'; // 食物的顏色
    ctx.strokeStyle = '#C70039';
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

// 生成隨機食物
function generateFood() {
    food = {
        x: Math.floor(Math.random() * (gameCanvas.width / gridSize)),
        y: Math.floor(Math.random() * (gameCanvas.height / gridSize))
    };

    // 確保食物不會生成在蛇的身體上
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === food.x && snake[i].y === food.y) {
            generateFood(); // 重新生成
            return;
        }
    }
}

// 更新遊戲狀態
function update() {
    if (isPaused || !gameStarted) return;

    // 獲取蛇頭
    const head = { x: snake[0].x, y: snake[0].y };

    // 根據方向移動蛇頭
    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }

    // 檢查碰撞
    if (
        head.x < 0 ||
        head.x >= gameCanvas.width / gridSize ||
        head.y < 0 ||
        head.y >= gameCanvas.height / gridSize ||
        checkCollision(head)
    ) {
        endGame();
        return;
    }

    // 將新蛇頭添加到蛇的身體前面
    snake.unshift(head);

    // 檢查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreDisplay.textContent = score;
        generateFood(); // 重新生成食物
        // 加速遊戲 (可選)
        gameSpeed = Math.max(50, gameSpeed - 5); // 最低速度50ms
        clearInterval(gameInterval);
        gameInterval = setInterval(update, gameSpeed);
    } else {
        snake.pop(); // 移除蛇尾
    }

    draw();
}

// 檢查蛇是否撞到自己
function checkCollision(head) {
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    return false;
}

// 遊戲結束
function endGame() {
    clearInterval(gameInterval);
    gameStarted = false;
    alert(`遊戲結束！你的分數是：${score}`);
    saveHistory(score); // 儲存歷史紀錄
    resetGame();
}

// 重置遊戲
function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = 'right';
    score = 0;
    scoreDisplay.textContent = score;
    gameSpeed = 150;
    isPaused = false;
    startButton.style.display = 'inline-block';
    pauseButton.style.display = 'none';
    startButton.textContent = '重新開始';
    generateFood();
    draw();
}

// 儲存歷史紀錄
function saveHistory(currentScore) {
    let history = JSON.parse(localStorage.getItem('snakeHistory')) || [];
    const now = new Date();
    const dateString = now.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    history.push({ score: currentScore, date: dateString });
    // 只保留最近的10條紀錄
    if (history.length > 10) {
        history = history.slice(history.length - 10);
    }
    localStorage.setItem('snakeHistory', JSON.stringify(history));
    loadHistory(); // 更新顯示
}

// 載入並顯示歷史紀錄
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('snakeHistory')) || [];
    historyList.innerHTML = ''; // 清空現有列表
    if (history.length === 0) {
        const li = document.createElement('li');
        li.textContent = '暫無紀錄';
        historyList.appendChild(li);
    } else {
        history.forEach((record, index) => {
            const li = document.createElement('li');
            li.innerHTML = `第 ${index + 1} 名：<span>${record.score} 分</span> - ${record.date}`;
            historyList.appendChild(li);
        });
    }
}

// 開始遊戲按鈕事件
startButton.addEventListener('click', () => {
    if (!gameStarted) {
        resetGame(); // 確保遊戲狀態重置
        generateFood();
        gameInterval = setInterval(update, gameSpeed);
        gameStarted = true;
        startButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
    } else {
        resetGame();
    }
});

// 暫停/繼續按鈕事件
pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameInterval);
        pauseButton.textContent = '繼續';
    } else {
        gameInterval = setInterval(update, gameSpeed);
        pauseButton.textContent = '暫停';
    }
});

// 鍵盤事件監聽
document.addEventListener('keydown', e => {
    if (!gameStarted && e.key !== 'Enter') return; // 遊戲未開始時只允許按Enter啟動

    const newDirection = e.key.toLowerCase();
    // 防止蛇立即反向
    switch (newDirection) {
        case 'arrowup':
        case 'w':
            if (direction !== 'down') direction = 'up';
            break;
        case 'arrowdown':
        case 's':
            if (direction !== 'up') direction = 'down';
            break;
        case 'arrowleft':
        case 'a':
            if (direction !== 'right') direction = 'left';
            break;
        case 'arrowright':
        case 'd':
            if (direction !== 'left') direction = 'right';
            break;
        case 'escape': // Esc 鍵暫停
            if (gameStarted) {
                pauseButton.click();
            }
            break;
        case 'enter': // Enter 鍵開始/重新開始
            if (!gameStarted || confirm('確定要重新開始遊戲嗎？')) {
                startButton.click();
            }
            break;
    }
});

// 初始繪製一次
resetGame();