// 游戏配置
const config = {
    gridSize: 20,      // 网格大小
    initialSpeed: 150, // 初始速度（毫秒）
    speedIncrease: 5,  // 每吃一个食物增加的速度
    initialSnakeLength: 3, // 初始蛇的长度
    obstacleCount: 10   // 障碍物数量（增加到原来的2倍）
};

// 游戏状态
let canvas, ctx;
let snake = [];
let food = {};
let obstacles = []; // 障碍物数组
let direction = 'right';
let nextDirection = 'right';
let gameInterval;
let score = 0;
let gameRunning = false;

// DOM 元素
let scoreElement;
let startButton;

// 初始化游戏
window.onload = function() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    startButton = document.getElementById('start-btn');
    
    // 设置按钮事件监听
    startButton.addEventListener('click', toggleGame);
    document.getElementById('up-btn').addEventListener('click', () => changeDirection('up'));
    document.getElementById('down-btn').addEventListener('click', () => changeDirection('down'));
    document.getElementById('left-btn').addEventListener('click', () => changeDirection('left'));
    document.getElementById('right-btn').addEventListener('click', () => changeDirection('right'));
    
    // 键盘控制
    document.addEventListener('keydown', handleKeyPress);
    
    // 初始化游戏
    resetGame();
    drawGame();
};

// 重置游戏状态
function resetGame() {
    // 停止当前游戏循环
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    // 重置游戏状态
    snake = [];
    obstacles = [];
    score = 0;
    direction = 'right';
    nextDirection = 'right';
    gameRunning = false;
    
    // 更新分数显示
    scoreElement.textContent = score;
    
    // 更新按钮文本
    startButton.textContent = '开始游戏';
    
    // 初始化蛇
    const centerX = Math.floor(canvas.width / (2 * config.gridSize));
    const centerY = Math.floor(canvas.height / (2 * config.gridSize));
    
    for (let i = 0; i < config.initialSnakeLength; i++) {
        snake.push({x: centerX - i, y: centerY});
    }
    
    // 生成第一个食物
    generateFood();
    
    // 生成障碍物
    generateObstacles();
}

// 开始/暂停游戏
function toggleGame() {
    // 如果按钮显示"重新开始"，则重置游戏
    if (startButton.textContent === '重新开始') {
        resetGame();
        // 重置后立即开始游戏
        gameRunning = true;
        startButton.textContent = '暂停游戏';
        const speed = config.initialSpeed - (score * config.speedIncrease);
        gameInterval = setInterval(gameLoop, speed);
        return;
    }
    
    if (gameRunning) {
        // 暂停游戏
        clearInterval(gameInterval);
        gameInterval = null;
        gameRunning = false;
        startButton.textContent = '继续游戏';
    } else {
        // 开始游戏
        gameRunning = true;
        startButton.textContent = '暂停游戏';
        const speed = config.initialSpeed - (score * config.speedIncrease);
        gameInterval = setInterval(gameLoop, speed);
    }
}

// 游戏主循环
function gameLoop() {
    moveSnake();
    if (checkCollision()) {
        gameOver();
        return;
    }
    checkFood();
    drawGame();
}

// 移动蛇
function moveSnake() {
    // 更新方向
    direction = nextDirection;
    
    // 获取蛇头
    const head = {x: snake[0].x, y: snake[0].y};
    
    // 根据方向移动蛇头
    switch(direction) {
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
    
    // 将新蛇头添加到蛇身前面
    snake.unshift(head);
    
    // 如果没有吃到食物，移除蛇尾
    if (head.x !== food.x || head.y !== food.y) {
        snake.pop();
    }
}

// 检查碰撞
function checkCollision() {
    const head = snake[0];
    
    // 检查是否撞墙
    if (head.x < 0 || head.x >= canvas.width / config.gridSize ||
        head.y < 0 || head.y >= canvas.height / config.gridSize) {
        return true;
    }
    
    // 检查是否撞到自己（从第二个身体部分开始检查）
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    // 检查是否撞到障碍物
    for (let i = 0; i < obstacles.length; i++) {
        if (head.x === obstacles[i].x && head.y === obstacles[i].y) {
            return true;
        }
    }
    
    return false;
}

// 检查是否吃到食物
function checkFood() {
    const head = snake[0];
    
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        score++;
        scoreElement.textContent = score;
        
        // 生成新食物
        generateFood();
        
        // 平滑增加速度，防止突变导致的屏幕晃动
        if (gameInterval) {
            clearInterval(gameInterval);
            // 限制最小速度，防止游戏过快
            const newSpeed = Math.max(50, config.initialSpeed - (score * config.speedIncrease));
            gameInterval = setInterval(gameLoop, newSpeed);
        }
    }
}

// 生成食物
function generateFood() {
    // 随机生成食物位置
    const gridWidth = canvas.width / config.gridSize;
    const gridHeight = canvas.height / config.gridSize;
    
    let newFood;
    let foodOnSnakeOrObstacle;
    
    // 确保食物不会生成在蛇身或障碍物上
    do {
        foodOnSnakeOrObstacle = false;
        newFood = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // 检查是否与蛇身重叠
        for (let i = 0; i < snake.length; i++) {
            if (newFood.x === snake[i].x && newFood.y === snake[i].y) {
                foodOnSnakeOrObstacle = true;
                break;
            }
        }
        
        // 检查是否与障碍物重叠
        if (!foodOnSnakeOrObstacle) {
            for (let i = 0; i < obstacles.length; i++) {
                if (newFood.x === obstacles[i].x && newFood.y === obstacles[i].y) {
                    foodOnSnakeOrObstacle = true;
                    break;
                }
            }
        }
    } while (foodOnSnakeOrObstacle);
    
    food = newFood;
}

// 绘制游戏
function drawGame() {
    // 使用双缓冲技术防止屏幕闪烁
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格背景（可选，增加视觉稳定性）
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制障碍物
    ctx.fillStyle = '#795548'; // 棕色
    for (let i = 0; i < obstacles.length; i++) {
        ctx.fillRect(
            obstacles[i].x * config.gridSize,
            obstacles[i].y * config.gridSize,
            config.gridSize - 1,
            config.gridSize - 1
        );
    }
    
    // 绘制蛇
    ctx.fillStyle = '#4CAF50';
    for (let i = 0; i < snake.length; i++) {
        ctx.fillRect(
            snake[i].x * config.gridSize,
            snake[i].y * config.gridSize,
            config.gridSize - 1,
            config.gridSize - 1
        );
    }
    
    // 绘制蛇头（不同颜色）
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(
        snake[0].x * config.gridSize,
        snake[0].y * config.gridSize,
        config.gridSize - 1,
        config.gridSize - 1
    );
    
    // 绘制食物
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(
        food.x * config.gridSize + config.gridSize / 2,
        food.y * config.gridSize + config.gridSize / 2,
        config.gridSize / 2 - 1,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// 处理键盘按键
function handleKeyPress(event) {
    switch(event.key) {
        case 'ArrowUp':
            changeDirection('up');
            break;
        case 'ArrowDown':
            changeDirection('down');
            break;
        case 'ArrowLeft':
            changeDirection('left');
            break;
        case 'ArrowRight':
            changeDirection('right');
            break;
        case ' ':
            // 空格键开始/暂停游戏
            toggleGame();
            break;
    }
}

// 改变方向
function changeDirection(newDirection) {
    // 防止180度转弯（蛇不能直接掉头）
    if ((newDirection === 'up' && direction !== 'down') ||
        (newDirection === 'down' && direction !== 'up') ||
        (newDirection === 'left' && direction !== 'right') ||
        (newDirection === 'right' && direction !== 'left')) {
        nextDirection = newDirection;
    }
}

// 生成障碍物
function generateObstacles() {
    // 清空现有障碍物
    obstacles = [];
    
    // 获取网格尺寸
    const gridWidth = canvas.width / config.gridSize;
    const gridHeight = canvas.height / config.gridSize;
    
    // 障碍物形状类型
    const obstacleShapes = [
        'single',   // 单个方块
        'horizontal', // 水平线
        'vertical',   // 垂直线
        'L-shape',    // L形
        'zigzag'      // Z形
    ];
    
    // 生成指定数量的障碍物组
    let obstacleGroupsCount = Math.min(config.obstacleCount, 5); // 最多生成5组障碍物，增加以适应更多的障碍物数量
    
    for (let i = 0; i < obstacleGroupsCount; i++) {
        // 随机选择一种障碍物形状
        const shapeType = obstacleShapes[Math.floor(Math.random() * obstacleShapes.length)];
        
        // 随机决定障碍物的长度/大小 (1-5个方块)
        const obstacleSize = Math.floor(Math.random() * 4) + 1; // 1到5之间的随机数
        
        // 生成障碍物的起始位置
        let startX, startY;
        let isValidPosition = false;
        let attempts = 0;
        const maxAttempts = 50; // 最大尝试次数，防止无限循环
        
        // 尝试找到一个有效的起始位置
        while (!isValidPosition && attempts < maxAttempts) {
            attempts++;
            startX = Math.floor(Math.random() * gridWidth);
            startY = Math.floor(Math.random() * gridHeight);
            
            // 检查起始位置是否有效
            isValidPosition = !isPositionOccupied(startX, startY);
        }
        
        // 如果找不到有效位置，跳过这组障碍物
        if (!isValidPosition) continue;
        
        // 根据形状类型生成障碍物
        let obstaclePositions = [];
        
        switch (shapeType) {
            case 'single':
                // 单个方块
                obstaclePositions.push({x: startX, y: startY});
                break;
                
            case 'horizontal':
                // 水平线
                for (let j = 0; j < obstacleSize && j + startX < gridWidth; j++) {
                    if (!isPositionOccupied(startX + j, startY)) {
                        obstaclePositions.push({x: startX + j, y: startY});
                    }
                }
                break;
                
            case 'vertical':
                // 垂直线
                for (let j = 0; j < obstacleSize && j + startY < gridHeight; j++) {
                    if (!isPositionOccupied(startX, startY + j)) {
                        obstaclePositions.push({x: startX, y: startY + j});
                    }
                }
                break;
                
            case 'L-shape':
                // L形 (先水平后垂直)
                const lSize = Math.min(obstacleSize, 3); // L形最多3个方块
                
                // 水平部分
                for (let j = 0; j < Math.ceil(lSize/2) && j + startX < gridWidth; j++) {
                    if (!isPositionOccupied(startX + j, startY)) {
                        obstaclePositions.push({x: startX + j, y: startY});
                    }
                }
                
                // 垂直部分
                for (let j = 1; j < Math.floor(lSize/2) + 1 && j + startY < gridHeight; j++) {
                    if (!isPositionOccupied(startX, startY + j)) {
                        obstaclePositions.push({x: startX, y: startY + j});
                    }
                }
                break;
                
            case 'zigzag':
                // Z形 (先水平，再对角，再水平)
                if (startX + 2 < gridWidth && startY + 1 < gridHeight) {
                    const positions = [
                        {x: startX, y: startY},
                        {x: startX + 1, y: startY},
                        {x: startX + 1, y: startY + 1},
                        {x: startX + 2, y: startY + 1}
                    ];
                    
                    // 只添加有效位置
                    for (const pos of positions) {
                        if (!isPositionOccupied(pos.x, pos.y)) {
                            obstaclePositions.push(pos);
                        }
                    }
                }
                break;
        }
        
        // 将生成的障碍物添加到障碍物数组
        obstacles = obstacles.concat(obstaclePositions);
    }
    
    // 如果障碍物数量不足，添加单个障碍物补充
    while (obstacles.length < config.obstacleCount) {
        let newObstacle;
        let isValid = false;
        
        // 尝试找到一个有效位置
        for (let attempts = 0; attempts < 50 && !isValid; attempts++) {
            newObstacle = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
            
            isValid = !isPositionOccupied(newObstacle.x, newObstacle.y);
        }
        
        // 如果找到有效位置，添加障碍物
        if (isValid) {
            obstacles.push(newObstacle);
        } else {
            // 如果找不到有效位置，退出循环
            break;
        }
    }
}

// 检查位置是否被占用（蛇、食物或其他障碍物）
function isPositionOccupied(x, y) {
    // 检查是否与蛇身重叠
    for (let i = 0; i < snake.length; i++) {
        if (x === snake[i].x && y === snake[i].y) {
            return true;
        }
    }
    
    // 检查是否与食物重叠
    if (food && x === food.x && y === food.y) {
        return true;
    }
    
    // 检查是否与已有障碍物重叠
    for (let i = 0; i < obstacles.length; i++) {
        if (x === obstacles[i].x && y === obstacles[i].y) {
            return true;
        }
    }
    
    return false;
}

// 游戏结束
function gameOver() {
    clearInterval(gameInterval);
    gameInterval = null;
    gameRunning = false;
    startButton.textContent = '重新开始';
    
    // 绘制游戏结束信息
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '30px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 30);
    
    ctx.font = '20px Microsoft YaHei';
    ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('点击"重新开始"按钮重玩', canvas.width / 2, canvas.height / 2 + 40);
}