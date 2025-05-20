/**
 * tetromino.js - 俄罗斯方块形状定义和操作
 */

class Tetromino {
  /**
   * 创建一个方块
   * @param {string} type - 方块类型 (I, J, L, O, S, T, Z)
   */
  constructor(type) {
    this.type = type;
    this.shape = this.getShape();
    this.color = this.getColor();
    this.x = 3;  // 初始X位置（水平居中）
    this.y = 0;  // 初始Y位置（顶部）
    this.rotation = 0; // 旋转状态（0, 1, 2, 3）对应 0°, 90°, 180°, 270°
  }

  /**
   * 获取方块的形状矩阵
   * @returns {Array<Array<number>>} 形状矩阵
   */
  getShape() {
    const shapes = {
      'I': [
        [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        [
          [0, 0, 1, 0],
          [0, 0, 1, 0],
          [0, 0, 1, 0],
          [0, 0, 1, 0],
        ],
        [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
        ],
        [
          [0, 1, 0, 0],
          [0, 1, 0, 0],
          [0, 1, 0, 0],
          [0, 1, 0, 0],
        ]
      ],
      'J': [
        [
          [1, 0, 0],
          [1, 1, 1],
          [0, 0, 0]
        ],
        [
          [0, 1, 1],
          [0, 1, 0],
          [0, 1, 0]
        ],
        [
          [0, 0, 0],
          [1, 1, 1],
          [0, 0, 1]
        ],
        [
          [0, 1, 0],
          [0, 1, 0],
          [1, 1, 0]
        ]
      ],
      'L': [
        [
          [0, 0, 1],
          [1, 1, 1],
          [0, 0, 0]
        ],
        [
          [0, 1, 0],
          [0, 1, 0],
          [0, 1, 1]
        ],
        [
          [0, 0, 0],
          [1, 1, 1],
          [1, 0, 0]
        ],
        [
          [1, 1, 0],
          [0, 1, 0],
          [0, 1, 0]
        ]
      ],
      'O': [
        [
          [0, 0, 0, 0],
          [0, 1, 1, 0],
          [0, 1, 1, 0],
          [0, 0, 0, 0],
        ]
      ],
      'S': [
        [
          [0, 1, 1],
          [1, 1, 0],
          [0, 0, 0]
        ],
        [
          [0, 1, 0],
          [0, 1, 1],
          [0, 0, 1]
        ],
        [
          [0, 0, 0],
          [0, 1, 1],
          [1, 1, 0]
        ],
        [
          [1, 0, 0],
          [1, 1, 0],
          [0, 1, 0]
        ]
      ],
      'T': [
        [
          [0, 1, 0],
          [1, 1, 1],
          [0, 0, 0]
        ],
        [
          [0, 1, 0],
          [0, 1, 1],
          [0, 1, 0]
        ],
        [
          [0, 0, 0],
          [1, 1, 1],
          [0, 1, 0]
        ],
        [
          [0, 1, 0],
          [1, 1, 0],
          [0, 1, 0]
        ]
      ],
      'Z': [
        [
          [1, 1, 0],
          [0, 1, 1],
          [0, 0, 0]
        ],
        [
          [0, 0, 1],
          [0, 1, 1],
          [0, 1, 0]
        ],
        [
          [0, 0, 0],
          [1, 1, 0],
          [0, 1, 1]
        ],
        [
          [0, 1, 0],
          [1, 1, 0],
          [1, 0, 0]
        ]
      ]
    };
    
    return shapes[this.type];
  }

  /**
   * 获取方块颜色
   * @returns {string} 颜色代码
   */
  getColor() {
    const colors = {
      'I': '#00f0f0', // 青色
      'J': '#0000f0', // 蓝色
      'L': '#f0a000', // 橙色
      'O': '#f0f000', // 黄色
      'S': '#00f000', // 绿色
      'T': '#a000f0', // 紫色
      'Z': '#f00000'  // 红色
    };
    
    return colors[this.type];
  }

  /**
   * 获取当前旋转状态的方块形状
   * @returns {Array<Array<number>>} 当前旋转状态的形状矩阵
   */
  getCurrentShape() {
    if (this.type === 'O') return this.shape[0]; // O型方块不旋转
    return this.shape[this.rotation];
  }

  /**
   * 向左移动方块
   */
  moveLeft() {
    this.x--;
  }

  /**
   * 向右移动方块
   */
  moveRight() {
    this.x++;
  }

  /**
   * 向下移动方块
   */
  moveDown() {
    this.y++;
  }

  /**
   * 旋转方块（顺时针）
   */
  rotate() {
    if (this.type === 'O') return; // O型方块不需要旋转
    this.rotation = (this.rotation + 1) % this.shape.length;
  }

  /**
   * 创建随机方块
   * @returns {Tetromino} 随机生成的方块
   */
  static randomTetromino() {
    const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return new Tetromino(randomType);
  }

  /**
   * 克隆当前方块
   * @returns {Tetromino} 克隆的方块
   */
  clone() {
    const cloned = new Tetromino(this.type);
    cloned.x = this.x;
    cloned.y = this.y;
    cloned.rotation = this.rotation;
    return cloned;
  }
} 