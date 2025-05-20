/**
 * controller.js - 俄罗斯方块控制器
 */

class Controller {
  /**
   * 创建游戏控制器
   * @param {Game} game - 游戏实例
   */
  constructor(game) {
    this.game = game;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.swipeThreshold = 30; // 滑动阈值（像素）
    this.doubleTapDelay = 300; // 双击间隔（毫秒）
    this.lastTap = 0;

    // 初始化按键绑定
    this.setupKeyboardControls();
    this.setupTouchControls();
    this.setupButtonControls();
  }

  /**
   * 设置键盘控制
   */
  setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      // 如果游戏暂停或结束，只响应重新开始和菜单键
      if (this.game.paused || this.game.gameOver) {
        // 暂停时，只允许使用 P 键取消暂停
        if (event.key === 'p' && this.game.paused && !this.game.gameOver) {
          this.game.togglePause();
        }
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          this.game.moveTetrominoLeft();
          event.preventDefault();
          break;
        case 'ArrowRight':
          this.game.moveTetrominoRight();
          event.preventDefault();
          break;
        case 'ArrowDown':
          this.game.moveTetrominoDown();
          event.preventDefault();
          break;
        case 'ArrowUp':
          this.game.rotateTetromino();
          event.preventDefault();
          break;
        case ' ':  // 空格键
          this.game.hardDrop();
          event.preventDefault();
          break;
        case 'c':
        case 'C':
          this.game.holdTetromino();
          event.preventDefault();
          break;
        case 'p':
        case 'P':
          this.game.togglePause();
          event.preventDefault();
          break;
      }
    });
  }

  /**
   * 设置触屏控制
   */
  setupTouchControls() {
    const gameBoard = document.getElementById('game-board');
    
    // 触控按钮控制
    document.getElementById('left-btn').addEventListener('click', () => {
      if (!this.game.paused && !this.game.gameOver) {
        this.game.moveTetrominoLeft();
      }
    });
    
    document.getElementById('right-btn').addEventListener('click', () => {
      if (!this.game.paused && !this.game.gameOver) {
        this.game.moveTetrominoRight();
      }
    });
    
    document.getElementById('down-btn').addEventListener('click', () => {
      if (!this.game.paused && !this.game.gameOver) {
        this.game.moveTetrominoDown();
      }
    });
    
    document.getElementById('rotate-btn').addEventListener('click', () => {
      if (!this.game.paused && !this.game.gameOver) {
        this.game.rotateTetromino();
      }
    });
    
    document.getElementById('drop-btn').addEventListener('click', () => {
      if (!this.game.paused && !this.game.gameOver) {
        this.game.hardDrop();
      }
    });
    
    document.getElementById('hold-btn').addEventListener('click', () => {
      if (!this.game.paused && !this.game.gameOver) {
        this.game.holdTetromino();
      }
    });

    // 游戏板上的触摸滑动控制
    gameBoard.addEventListener('touchstart', (event) => {
      if (this.game.paused || this.game.gameOver) return;
      
      // 记录触摸起始位置
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
      
      // 检测双击
      const now = Date.now();
      const timeDiff = now - this.lastTap;
      
      if (timeDiff < this.doubleTapDelay && timeDiff > 0) {
        // 双击执行硬下落
        this.game.hardDrop();
        event.preventDefault();
        // 重置双击计时器
        this.lastTap = 0;
      } else {
        this.lastTap = now;
      }
    });
    
    gameBoard.addEventListener('touchmove', (event) => {
      if (this.game.paused || this.game.gameOver) return;
      
      // 防止屏幕滚动
      event.preventDefault();
    });
    
    gameBoard.addEventListener('touchend', (event) => {
      if (this.game.paused || this.game.gameOver) return;
      
      // 记录触摸结束位置
      this.touchEndX = event.changedTouches[0].clientX;
      this.touchEndY = event.changedTouches[0].clientY;
      
      // 计算水平和垂直滑动距离
      const deltaX = this.touchEndX - this.touchStartX;
      const deltaY = this.touchEndY - this.touchStartY;
      
      // 判断滑动方向
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (Math.abs(deltaX) > this.swipeThreshold) {
          if (deltaX > 0) {
            // 向右滑动
            this.game.moveTetrominoRight();
          } else {
            // 向左滑动
            this.game.moveTetrominoLeft();
          }
        } else {
          // 单击旋转方块
          this.game.rotateTetromino();
        }
      } else {
        // 垂直滑动
        if (deltaY > this.swipeThreshold) {
          // 向下滑动
          this.game.moveTetrominoDown();
        }
      }
    });
  }

  /**
   * 设置按钮控制
   */
  setupButtonControls() {
    // 开始按钮
    document.getElementById('start-btn').addEventListener('click', () => {
      this.game.startGame();
    });
    
    // 设置按钮
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.game.showSettings();
    });
    
    // 排行榜按钮
    document.getElementById('leaderboard-btn').addEventListener('click', () => {
      this.game.showLeaderboard();
    });
    
    // 暂停按钮
    document.getElementById('pause-btn').addEventListener('click', () => {
      this.game.togglePause();
    });
    
    // 菜单按钮
    document.getElementById('menu-btn').addEventListener('click', () => {
      this.game.showMenu();
    });
    
    // 重新开始按钮
    document.getElementById('restart-btn').addEventListener('click', () => {
      this.game.restartGame();
    });
    
    // 返回主菜单按钮（从游戏结束屏幕）
    document.getElementById('main-menu-btn').addEventListener('click', () => {
      this.game.showMenu();
    });
    
    // 设置返回按钮
    document.getElementById('settings-back-btn').addEventListener('click', () => {
      this.game.hideSettings();
    });
    
    // 排行榜返回按钮
    document.getElementById('leaderboard-back-btn').addEventListener('click', () => {
      this.game.hideLeaderboard();
    });
    
    // 声音开关
    document.getElementById('sound-toggle').addEventListener('change', (event) => {
      this.game.setSoundEnabled(event.target.checked);
    });
    
    // 音乐开关
    document.getElementById('music-toggle').addEventListener('change', (event) => {
      this.game.setMusicEnabled(event.target.checked);
    });
    
    // 选择音乐
    document.getElementById('music-select').addEventListener('change', (event) => {
      this.game.setMusicTrack(event.target.value);
    });
    
    // 难度选择
    document.getElementById('difficulty-select').addEventListener('change', (event) => {
      this.game.setDifficulty(event.target.value);
    });
    
    // 主题选择
    document.getElementById('theme-select').addEventListener('change', (event) => {
      this.game.setTheme(event.target.value);
    });
    
    // 分享按钮
    document.getElementById('share-wechat').addEventListener('click', () => {
      this.game.shareScore('wechat');
    });
    
    document.getElementById('share-weibo').addEventListener('click', () => {
      this.game.shareScore('weibo');
    });
  }
} 