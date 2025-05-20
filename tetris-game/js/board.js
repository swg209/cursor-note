/**
 * board.js - 俄罗斯方块游戏板逻辑
 */

class Board {
  /**
   * 创建游戏板
   * @param {number} width - 游戏板宽度（格子数）
   * @param {number} height - 游戏板高度（格子数）
   */
  constructor(width = 10, height = 20) {
    this.width = width;
    this.height = height;
    this.grid = this.createEmptyGrid();
    this.gameOver = false;
  }

  /**
   * 创建空的游戏板网格
   * @returns {Array<Array<{filled: boolean, color: string|null}>>} 空游戏板
   */
  createEmptyGrid() {
    const grid = [];
    
    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = { filled: false, color: null };
      }
    }
    
    return grid;
  }

  /**
   * 检查坐标是否在游戏板内
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} 是否在游戏板内
   */
  isWithinBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * 检查坐标上是否可以放置方块（空且在边界内）
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} 是否可以放置
   */
  isCellEmpty(x, y) {
    if (!this.isWithinBounds(x, y)) {
      return false;
    }
    
    // 判断该位置是否已被占用
    return !this.grid[y][x].filled;
  }

  /**
   * 检查方块是否可以在当前位置放置
   * @param {Tetromino} tetromino - 要检查的方块
   * @returns {boolean} 方块是否可以放置
   */
  isValidMove(tetromino) {
    const shape = tetromino.getCurrentShape();
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          // 计算方块在游戏板上的坐标
          const boardX = tetromino.x + x;
          const boardY = tetromino.y + y;
          
          // 检查是否超出边界或与已有方块重叠
          if (!this.isCellEmpty(boardX, boardY)) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  /**
   * 将方块固定到游戏板上
   * @param {Tetromino} tetromino - 要固定的方块
   * @returns {boolean} 是否成功固定
   */
  placeTetromino(tetromino) {
    const shape = tetromino.getCurrentShape();
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = tetromino.x + x;
          const boardY = tetromino.y + y;
          
          // 如果方块有一部分在游戏板顶部之上，游戏结束
          if (boardY < 0) {
            this.gameOver = true;
            return false;
          }
          
          // 在游戏板上标记此格子为已填充，并设置颜色
          this.grid[boardY][boardX] = {
            filled: true,
            color: tetromino.color
          };
        }
      }
    }
    
    return true;
  }

  /**
   * 清除已填满的行
   * @returns {number} 清除的行数
   */
  clearLines() {
    let linesCleared = 0;
    
    for (let y = this.height - 1; y >= 0; y--) {
      // 检查当前行是否已填满
      const isLineFilled = this.grid[y].every(cell => cell.filled);
      
      if (isLineFilled) {
        linesCleared++;
        
        // 将上面的所有行下移
        for (let yy = y; yy > 0; yy--) {
          this.grid[yy] = [...this.grid[yy - 1]];
        }
        
        // 创建新的空行在顶部
        this.grid[0] = Array(this.width).fill().map(() => ({ filled: false, color: null }));
        
        // 因为当前行已经被上面的行替换，我们需要再次检查当前行
        y++;
      }
    }
    
    return linesCleared;
  }

  /**
   * 获取方块的下落位置（影子位置）
   * @param {Tetromino} tetromino - 当前方块
   * @returns {Tetromino} 方块的影子（下落位置）
   */
  getDropPosition(tetromino) {
    const ghost = tetromino.clone();
    
    while (this.isValidMove(ghost)) {
      ghost.moveDown();
    }
    
    // 因为最后一次移动使方块位置无效，所以需要回退一步
    ghost.y--;
    
    return ghost;
  }

  /**
   * 重置游戏板
   */
  reset() {
    this.grid = this.createEmptyGrid();
    this.gameOver = false;
  }
} 