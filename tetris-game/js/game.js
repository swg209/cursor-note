/**
 * game.js - 俄罗斯方块游戏主逻辑
 */

class Game {
  /**
   * 创建游戏实例
   */
  constructor() {
    this.canvas = document.getElementById('game-board');
    this.ctx = this.canvas.getContext('2d');
    
    // 游戏状态
    this.gameOver = false;
    this.paused = false;
    this.isRunning = false;
    
    // 游戏计时器
    this.dropInterval = 1000; // 默认下落间隔（毫秒）
    this.lastDropTime = 0;
    this.animationId = null;
    
    // 游戏数据
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    
    // 游戏设置
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.currentMusicTrack = 'classic';
    this.currentTheme = 'classic';
    this.difficulty = 'normal';
    
    // 游戏组件
    this.board = new Board();
    this.currentTetromino = null;
    this.nextTetrominos = [];
    this.holdTetromino = null;
    this.hasSwapped = false; // 是否已经在本轮使用过保存功能
    
    // 生成预览方块
    for (let i = 0; i < 3; i++) {
      this.nextTetrominos.push(Tetromino.randomTetromino());
    }
    
    // 游戏配置
    this.cellSize = this.canvas.width / this.board.width;
    this.scorePerLine = [100, 300, 500, 800]; // 1, 2, 3, 4行的得分
    
    // 游戏音效
    this.sounds = {
      move: document.getElementById('move-sound'),
      rotate: document.getElementById('rotate-sound'),
      drop: document.getElementById('drop-sound'),
      clear: document.getElementById('clear-sound'),
      gameover: document.getElementById('gameover-sound')
    };
    
    this.music = document.getElementById('background-music');
    
    // 初始化控制器
    this.controller = new Controller(this);
    
    // 初始化本地存储
    this.initLocalStorage();
    
    // 显示开始界面
    this.showScreen('start-screen');
  }
  
  /**
   * 初始化本地存储
   */
  initLocalStorage() {
    if (!localStorage.getItem('tetris-highscores')) {
      localStorage.setItem('tetris-highscores', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('tetris-settings')) {
      const defaultSettings = {
        soundEnabled: true,
        musicEnabled: true,
        musicTrack: 'classic',
        theme: 'classic',
        difficulty: 'normal'
      };
      localStorage.setItem('tetris-settings', JSON.stringify(defaultSettings));
    } else {
      // 加载保存的设置
      const settings = JSON.parse(localStorage.getItem('tetris-settings'));
      this.soundEnabled = settings.soundEnabled;
      this.musicEnabled = settings.musicEnabled;
      this.currentMusicTrack = settings.musicTrack;
      this.currentTheme = settings.theme;
      this.difficulty = settings.difficulty;
      
      // 更新设置界面
      document.getElementById('sound-toggle').checked = this.soundEnabled;
      document.getElementById('music-toggle').checked = this.musicEnabled;
      document.getElementById('music-select').value = this.currentMusicTrack;
      document.getElementById('theme-select').value = this.currentTheme;
      document.getElementById('difficulty-select').value = this.difficulty;
    }
  }
  
  /**
   * 显示指定屏幕并隐藏其他屏幕
   * @param {string} screenId - 要显示的屏幕ID
   */
  showScreen(screenId) {
    const screens = ['start-screen', 'game-screen', 'game-over-screen', 'settings-screen', 'leaderboard-screen'];
    screens.forEach(screen => {
      const element = document.getElementById(screen);
      if (screen === screenId) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    });
  }
  
  /**
   * 开始游戏
   */
  startGame() {
    // 重置游戏状态
    this.board.reset();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.paused = false;
    this.isRunning = true;
    this.hasSwapped = false;
    this.holdTetromino = null;
    
    // 更新UI
    this.updateScore();
    this.updateLevel();
    this.updateLines();
    
    // 清空保存的方块显示
    document.getElementById('hold-piece').innerHTML = '';
    
    // 生成第一个方块
    this.getNextTetromino();
    
    // 显示游戏界面
    this.showScreen('game-screen');
    
    // 设置难度
    this.setDropInterval();
    
    // 开始背景音乐
    if (this.musicEnabled) {
      this.music.play();
    }
    
    // 开始游戏循环
    this.lastDropTime = performance.now();
    this.gameLoop();
  }
  
  /**
   * 游戏主循环
   * @param {number} currentTime - 当前时间戳
   */
  gameLoop(currentTime = 0) {
    if (this.gameOver || !this.isRunning) return;
    
    if (!this.paused) {
      // 计算时间增量
      const deltaTime = currentTime - this.lastDropTime;
      
      // 检查是否应该下落方块
      if (deltaTime > this.dropInterval) {
        this.moveTetrominoDown();
        this.lastDropTime = currentTime;
      }
      
      // 绘制游戏
      this.draw();
    }
    
    // 继续游戏循环
    this.animationId = requestAnimationFrame(time => this.gameLoop(time));
  }
  
  /**
   * 绘制游戏
   */
  draw() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制游戏网格
    this.drawGrid();
    
    // 绘制已固定的方块
    this.drawBoard();
    
    // 绘制下落位置预览（影子）
    if (this.currentTetromino) {
      this.drawGhostPiece();
    }
    
    // 绘制当前下落的方块
    if (this.currentTetromino) {
      this.drawTetromino(this.currentTetromino);
    }
    
    // 绘制下一个方块预览
    this.drawNextPieces();
    
    // 绘制保存的方块
    this.drawHoldPiece();
  }
  
  /**
   * 绘制游戏网格
   */
  drawGrid() {
    // 设置网格线颜色
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    // 绘制水平网格线
    for (let y = 0; y <= this.board.height; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.cellSize);
      this.ctx.lineTo(this.canvas.width, y * this.cellSize);
      this.ctx.stroke();
    }
    
    // 绘制垂直网格线
    for (let x = 0; x <= this.board.width; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.cellSize, 0);
      this.ctx.lineTo(x * this.cellSize, this.canvas.height);
      this.ctx.stroke();
    }
  }
  
  /**
   * 绘制游戏板
   */
  drawBoard() {
    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        const cell = this.board.grid[y][x];
        
        if (cell.filled) {
          this.drawCell(x, y, cell.color);
        }
      }
    }
  }
  
  /**
   * 绘制单个格子
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} color - 颜色
   */
  drawCell(x, y, color) {
    // 计算格子的屏幕坐标
    const screenX = x * this.cellSize;
    const screenY = y * this.cellSize;
    
    // 绘制方块填充
    this.ctx.fillStyle = color;
    this.ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
    
    // 绘制高光和阴影以增加3D效果
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(screenX, screenY, this.cellSize, 2);
    this.ctx.fillRect(screenX, screenY, 2, this.cellSize);
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(screenX + this.cellSize - 2, screenY, 2, this.cellSize);
    this.ctx.fillRect(screenX, screenY + this.cellSize - 2, this.cellSize, 2);
    
    // 绘制边框
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(screenX, screenY, this.cellSize, this.cellSize);
  }
  
  /**
   * 绘制俄罗斯方块
   * @param {Tetromino} tetromino - 要绘制的方块
   * @param {number} offsetX - X偏移量
   * @param {number} offsetY - Y偏移量
   */
  drawTetromino(tetromino, offsetX = 0, offsetY = 0) {
    const shape = tetromino.getCurrentShape();
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = tetromino.x + x + offsetX;
          const boardY = tetromino.y + y + offsetY;
          
          if (boardY >= 0) { // 只绘制在游戏板上的部分
            this.drawCell(boardX, boardY, tetromino.color);
          }
        }
      }
    }
  }
  
  /**
   * 绘制方块下落位置预览（影子）
   */
  drawGhostPiece() {
    const ghost = this.board.getDropPosition(this.currentTetromino);
    const shape = ghost.getCurrentShape();
    
    // 设置影子颜色（半透明）
    this.ctx.globalAlpha = 0.2;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = ghost.x + x;
          const boardY = ghost.y + y;
          
          if (boardY >= 0) { // 只绘制在游戏板上的部分
            this.drawCell(boardX, boardY, this.currentTetromino.color);
          }
        }
      }
    }
    
    // 重置透明度
    this.ctx.globalAlpha = 1.0;
  }
  
  /**
   * 绘制下一个方块预览
   */
  drawNextPieces() {
    const container = document.getElementById('next-pieces');
    container.innerHTML = '';
    
    for (let i = 0; i < this.nextTetrominos.length; i++) {
      const tetromino = this.nextTetrominos[i];
      const previewDiv = document.createElement('div');
      previewDiv.className = 'next-piece';
      
      const shape = tetromino.getCurrentShape();
      const grid = document.createElement('div');
      grid.className = 'tetromino-grid';
      
      // 根据方块大小调整网格
      const gridSize = shape.length === 2 ? 2 : shape.length === 4 ? 4 : 3;
      grid.style.gridTemplateColumns = `repeat(${gridSize}, 15px)`;
      
      // 创建方块的网格单元
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          const cell = document.createElement('div');
          cell.className = 'tetromino-cell';
          
          if (shape[y][x]) {
            cell.style.backgroundColor = tetromino.color;
          }
          
          grid.appendChild(cell);
        }
      }
      
      previewDiv.appendChild(grid);
      container.appendChild(previewDiv);
    }
  }
  
  /**
   * 绘制保存的方块
   */
  drawHoldPiece() {
    const container = document.getElementById('hold-piece');
    container.innerHTML = '';
    
    if (this.holdTetromino) {
      const shape = this.holdTetromino.getCurrentShape();
      const grid = document.createElement('div');
      grid.className = 'tetromino-grid';
      
      // 根据方块大小调整网格
      const gridSize = shape.length === 2 ? 2 : shape.length === 4 ? 4 : 3;
      grid.style.gridTemplateColumns = `repeat(${gridSize}, 15px)`;
      
      // 如果已经交换过，显示半透明
      if (this.hasSwapped) {
        grid.style.opacity = '0.5';
      }
      
      // 创建方块的网格单元
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          const cell = document.createElement('div');
          cell.className = 'tetromino-cell';
          
          if (shape[y][x]) {
            cell.style.backgroundColor = this.holdTetromino.color;
          }
          
          grid.appendChild(cell);
        }
      }
      
      container.appendChild(grid);
    }
  }
  
  /**
   * 获取下一个方块
   */
  getNextTetromino() {
    this.currentTetromino = this.nextTetrominos.shift();
    this.nextTetrominos.push(Tetromino.randomTetromino());
    
    // 如果新方块无法放置，游戏结束
    if (!this.board.isValidMove(this.currentTetromino)) {
      this.endGame();
    }
  }
  
  /**
   * 向左移动方块
   */
  moveTetrominoLeft() {
    if (!this.currentTetromino || this.gameOver || this.paused) return;
    
    // 尝试左移
    this.currentTetromino.moveLeft();
    
    // 检查移动是否有效
    if (!this.board.isValidMove(this.currentTetromino)) {
      // 如果无效，撤销移动
      this.currentTetromino.moveRight();
    } else {
      // 播放移动音效
      this.playSound('move');
    }
  }
  
  /**
   * 向右移动方块
   */
  moveTetrominoRight() {
    if (!this.currentTetromino || this.gameOver || this.paused) return;
    
    // 尝试右移
    this.currentTetromino.moveRight();
    
    // 检查移动是否有效
    if (!this.board.isValidMove(this.currentTetromino)) {
      // 如果无效，撤销移动
      this.currentTetromino.moveLeft();
    } else {
      // 播放移动音效
      this.playSound('move');
    }
  }
  
  /**
   * 向下移动方块
   */
  moveTetrominoDown() {
    if (!this.currentTetromino || this.gameOver || this.paused) return;
    
    // 尝试下移
    this.currentTetromino.moveDown();
    
    // 检查移动是否有效
    if (!this.board.isValidMove(this.currentTetromino)) {
      // 如果无效，撤销移动
      this.currentTetromino.y--;
      
      // 将方块固定到游戏板上
      this.lockTetromino();
    } else {
      // 播放移动音效（下落略过，避免太频繁）
      // this.playSound('move');
    }
  }
  
  /**
   * 旋转方块
   */
  rotateTetromino() {
    if (!this.currentTetromino || this.gameOver || this.paused) return;
    
    // 保存当前旋转状态
    const originalRotation = this.currentTetromino.rotation;
    
    // 尝试旋转
    this.currentTetromino.rotate();
    
    // 检查旋转是否有效
    if (!this.board.isValidMove(this.currentTetromino)) {
      // 如果无效，尝试壁踢（wall kick）
      // 先尝试右移一格
      this.currentTetromino.moveRight();
      
      if (!this.board.isValidMove(this.currentTetromino)) {
        // 右移无效，撤销并尝试左移一格
        this.currentTetromino.moveLeft();
        this.currentTetromino.moveLeft();
        
        if (!this.board.isValidMove(this.currentTetromino)) {
          // 左移也无效，尝试上移一格
          this.currentTetromino.moveRight();
          this.currentTetromino.y--;
          
          if (!this.board.isValidMove(this.currentTetromino)) {
            // 所有尝试都失败，恢复原始旋转
            this.currentTetromino.y++;
            this.currentTetromino.rotation = originalRotation;
            return;
          }
        }
      }
    }
    
    // 播放旋转音效
    this.playSound('rotate');
  }
  
  /**
   * 硬下落（直接下落到底部）
   */
  hardDrop() {
    if (!this.currentTetromino || this.gameOver || this.paused) return;
    
    // 获取下落位置
    const ghost = this.board.getDropPosition(this.currentTetromino);
    this.currentTetromino.y = ghost.y;
    
    // 锁定方块
    this.lockTetromino();
    
    // 播放下落音效
    this.playSound('drop');
  }
  
  /**
   * 保存/交换当前方块
   */
  holdTetromino() {
    if (!this.currentTetromino || this.gameOver || this.paused || this.hasSwapped) return;
    
    // 播放旋转音效
    this.playSound('rotate');
    
    if (this.holdTetromino === null) {
      // 第一次保存
      this.holdTetromino = this.currentTetromino;
      this.getNextTetromino();
    } else {
      // 交换保存的方块和当前方块
      const temp = this.currentTetromino;
      this.currentTetromino = this.holdTetromino;
      this.holdTetromino = temp;
      
      // 重置当前方块位置
      this.currentTetromino.x = 3;
      this.currentTetromino.y = 0;
    }
    
    // 标记为已交换
    this.hasSwapped = true;
  }
  
  /**
   * 锁定方块到游戏板上
   */
  lockTetromino() {
    // 将方块固定到游戏板上
    this.board.placeTetromino(this.currentTetromino);
    
    // 检查是否有完整行可清除
    const linesCleared = this.board.clearLines();
    
    if (linesCleared > 0) {
      // 播放清除行的音效
      this.playSound('clear');
      
      // 更新分数和行数
      this.updateScore(linesCleared);
      this.lines += linesCleared;
      this.updateLines();
      
      // 检查是否应该提升等级
      this.checkLevelUp();
    }
    
    // 检查游戏是否结束
    if (this.board.gameOver) {
      this.endGame();
      return;
    }
    
    // 获取下一个方块
    this.getNextTetromino();
    
    // 重置交换标志
    this.hasSwapped = false;
  }
  
  /**
   * 更新分数
   * @param {number} linesCleared - 清除的行数
   */
  updateScore(linesCleared = 0) {
    if (linesCleared > 0) {
      // 根据清除的行数计算分数
      const lineScore = this.scorePerLine[linesCleared - 1] * this.level;
      this.score += lineScore;
    }
    
    // 更新分数显示
    document.getElementById('score').textContent = this.score;
  }
  
  /**
   * 更新等级
   */
  updateLevel() {
    document.getElementById('level').textContent = this.level;
  }
  
  /**
   * 更新行数
   */
  updateLines() {
    document.getElementById('lines').textContent = this.lines;
  }
  
  /**
   * 检查是否应该提升等级
   */
  checkLevelUp() {
    const newLevel = Math.floor(this.lines / 10) + 1;
    
    if (newLevel > this.level) {
      this.level = newLevel;
      this.updateLevel();
      
      // 提高下落速度
      this.setDropInterval();
    }
  }
  
  /**
   * 根据等级和难度设置下落间隔
   */
  setDropInterval() {
    // 基础速度基于难度
    let baseSpeed;
    switch (this.difficulty) {
      case 'easy':
        baseSpeed = 1000;
        break;
      case 'normal':
        baseSpeed = 800;
        break;
      case 'hard':
        baseSpeed = 600;
        break;
      default:
        baseSpeed = 800;
    }
    
    // 每提高一级，下落间隔减少一定比例（但不低于100ms）
    this.dropInterval = Math.max(100, baseSpeed - (this.level - 1) * 50);
  }
  
  /**
   * 结束游戏
   */
  endGame() {
    this.gameOver = true;
    this.isRunning = false;
    
    // 取消动画
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 停止背景音乐
    this.music.pause();
    this.music.currentTime = 0;
    
    // 播放游戏结束音效
    this.playSound('gameover');
    
    // 更新游戏结束界面的统计数据
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-level').textContent = this.level;
    document.getElementById('final-lines').textContent = this.lines;
    
    // 保存高分
    this.saveHighScore();
    
    // 显示游戏结束屏幕
    this.showScreen('game-over-screen');
  }
  
  /**
   * 保存高分
   */
  saveHighScore() {
    const highScores = JSON.parse(localStorage.getItem('tetris-highscores')) || [];
    
    // 添加新分数
    const newScore = {
      name: '玩家', // 默认名称
      score: this.score,
      lines: this.lines,
      level: this.level,
      date: new Date().toISOString()
    };
    
    highScores.push(newScore);
    
    // 按分数排序
    highScores.sort((a, b) => b.score - a.score);
    
    // 只保留前10个
    const topScores = highScores.slice(0, 10);
    
    // 保存到本地存储
    localStorage.setItem('tetris-highscores', JSON.stringify(topScores));
  }
  
  /**
   * 显示排行榜
   */
  showLeaderboard() {
    const highScores = JSON.parse(localStorage.getItem('tetris-highscores')) || [];
    const leaderboardBody = document.getElementById('leaderboard-body');
    
    // 清空当前排行榜
    leaderboardBody.innerHTML = '';
    
    // 填充排行榜数据
    highScores.forEach((score, index) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row';
      
      const rankCol = document.createElement('div');
      rankCol.className = 'rank-col';
      rankCol.textContent = index + 1;
      
      const nameCol = document.createElement('div');
      nameCol.className = 'name-col';
      nameCol.textContent = score.name;
      
      const scoreCol = document.createElement('div');
      scoreCol.className = 'score-col';
      scoreCol.textContent = score.score;
      
      const linesCol = document.createElement('div');
      linesCol.className = 'lines-col';
      linesCol.textContent = score.lines;
      
      row.appendChild(rankCol);
      row.appendChild(nameCol);
      row.appendChild(scoreCol);
      row.appendChild(linesCol);
      
      leaderboardBody.appendChild(row);
    });
    
    // 如果没有分数记录
    if (highScores.length === 0) {
      const emptyRow = document.createElement('div');
      emptyRow.className = 'leaderboard-row';
      emptyRow.textContent = '暂无记录';
      emptyRow.style.textAlign = 'center';
      leaderboardBody.appendChild(emptyRow);
    }
    
    // 显示排行榜屏幕
    this.showScreen('leaderboard-screen');
  }
  
  /**
   * 隐藏排行榜
   */
  hideLeaderboard() {
    this.showScreen('start-screen');
  }
  
  /**
   * 显示设置
   */
  showSettings() {
    this.showScreen('settings-screen');
  }
  
  /**
   * 隐藏设置
   */
  hideSettings() {
    this.showScreen('start-screen');
    
    // 保存设置到本地存储
    const settings = {
      soundEnabled: this.soundEnabled,
      musicEnabled: this.musicEnabled,
      musicTrack: this.currentMusicTrack,
      theme: this.currentTheme,
      difficulty: this.difficulty
    };
    
    localStorage.setItem('tetris-settings', JSON.stringify(settings));
  }
  
  /**
   * 切换游戏暂停状态
   */
  togglePause() {
    if (this.gameOver) return;
    
    this.paused = !this.paused;
    
    if (this.paused) {
      // 暂停游戏
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      
      // 暂停背景音乐
      if (this.musicEnabled) {
        this.music.pause();
      }
    } else {
      // 继续游戏
      if (this.isRunning) {
        this.lastDropTime = performance.now();
        this.gameLoop();
      }
      
      // 继续背景音乐
      if (this.musicEnabled) {
        this.music.play();
      }
    }
  }
  
  /**
   * 重新开始游戏
   */
  restartGame() {
    // 如果有动画正在运行，取消它
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 重置游戏状态并开始新游戏
    this.startGame();
  }
  
  /**
   * 显示主菜单
   */
  showMenu() {
    // 如果有动画正在运行，取消它
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 停止音乐
    this.music.pause();
    this.music.currentTime = 0;
    
    // 重置游戏状态
    this.isRunning = false;
    this.paused = false;
    this.gameOver = false;
    
    // 显示开始屏幕
    this.showScreen('start-screen');
  }
  
  /**
   * 设置声音开关
   * @param {boolean} enabled - 是否启用声音
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }
  
  /**
   * 设置音乐开关
   * @param {boolean} enabled - 是否启用音乐
   */
  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    
    if (this.musicEnabled && this.isRunning && !this.paused) {
      this.music.play();
    } else {
      this.music.pause();
    }
  }
  
  /**
   * 设置音乐曲目
   * @param {string} track - 音乐曲目名称
   */
  setMusicTrack(track) {
    this.currentMusicTrack = track;
    
    // 更新音乐源
    // 这里假设我们有不同的音乐文件
    // 实际应用中，需要根据曲目名称设置音乐文件路径
    this.music.src = `assets/audio/${track}.mp3`;
    
    if (this.musicEnabled && this.isRunning && !this.paused) {
      this.music.play();
    }
  }
  
  /**
   * 设置游戏主题
   * @param {string} theme - 主题名称
   */
  setTheme(theme) {
    this.currentTheme = theme;
    
    // 更新主题样式
    document.body.className = `theme-${theme}`;
  }
  
  /**
   * 设置游戏难度
   * @param {string} difficulty - 难度级别（easy, normal, hard）
   */
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    
    // 如果游戏正在运行，更新下落速度
    if (this.isRunning) {
      this.setDropInterval();
    }
  }
  
  /**
   * 播放音效
   * @param {string} soundName - 音效名称
   */
  playSound(soundName) {
    if (!this.soundEnabled) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      // 重置音效以便可以连续播放
      sound.currentTime = 0;
      sound.play();
    }
  }
  
  /**
   * 分享游戏成绩
   * @param {string} platform - 分享平台
   */
  shareScore(platform) {
    // 构建分享文本
    const shareText = `我在俄罗斯方块游戏中获得了${this.score}分，达到了第${this.level}级，消除了${this.lines}行！`;
    
    // 根据平台执行不同的分享逻辑
    switch (platform) {
      case 'wechat':
        // 微信分享逻辑
        alert('请截图后分享到微信\n\n' + shareText);
        break;
        
      case 'weibo':
        // 微博分享逻辑
        const weiboUrl = 'http://service.weibo.com/share/share.php?title=' + encodeURIComponent(shareText);
        window.open(weiboUrl, '_blank');
        break;
    }
  }
}

// 当文档加载完毕时初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  
  // 为了调试方便，将游戏实例添加到全局变量
  window.tetrisGame = game;
}); 