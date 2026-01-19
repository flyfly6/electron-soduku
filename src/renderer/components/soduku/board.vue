<template>
  <div class="sudoku-container">
    <div class="matrix">
      <div class="row" v-for="(row, rowIndex) in matrix" :key="rowIndex">
        <div
          class="cell"
          v-for="(value, columnIndex) in row"
          :key="columnIndex"
          :class="{
            'editable': originalMatrix[rowIndex][columnIndex] === 0,
            'fixed': originalMatrix[rowIndex][columnIndex] !== 0,
            'selected': selectedCell && selectedCell.row === rowIndex && selectedCell.col === columnIndex,
            'error': hasError(rowIndex, columnIndex)
          }"
          @click="selectCell(rowIndex, columnIndex)"
        >
          <span v-if="value !== 0">{{ value }}</span>
        </div>
      </div>
    </div>

    <!-- 数字选择面板 -->
    <div class="number-pad" v-if="selectedCell">
      <button
        v-for="num in 9"
        :key="num"
        class="num-btn"
        @click="setNumber(num)"
      >
        {{ num }}
      </button>
      <button class="num-btn clear-btn" @click="clearCell">清除</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Board',
  data () {
    return {
      matrix: [],
      originalMatrix: [], // 保存原始挖空后的数独
      mode: 1,
      selectedCell: null, // 当前选中的单元格
      errors: [] // 存储错误位置
    }
  },
  computed: {},
  mounted () {
    this.$electron.ipcRenderer.on('new-game', (event, mode) => {
      console.log(`new game, mode: ${mode}`)
      this.mode = mode
      this.init()
    })
  },
  methods: {
    clear () {
      this.matrix = []
      this.originalMatrix = []
      this.selectedCell = null
      this.errors = []
    },
    init () {
      this.clear()

      // 创建一个空的9x9矩阵
      this.matrix = Array(9).fill().map(() => Array(9).fill(0))

      // 填充对角线上的3x3子网格（这些是相互独立的）
      this.fillDiagonalBoxes()

      // 使用回溯算法填充剩余位置
      this.solveSudoku(0, 0)

      // 根据难度模式挖洞，确保有唯一解
      this.applyDifficulty()

      // 保存挖空后的数独作为原始状态
      this.originalMatrix = this.copyMatrix(this.matrix)
    },

    fillDiagonalBoxes () {
      // 填充左上、中间、右下三个对角线上的3x3子网格
      for (let box = 0; box < 3; box++) {
        const startRow = box * 3
        const startCol = box * 3
        this.fillBox(startRow, startCol)
      }
    },

    fillBox (row, col) {
      // 获取随机排列的数字
      const nums = this.shuffle()
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          this.matrix[row + i][col + j] = nums[i * 3 + j]
        }
      }
    },

    solveSudoku (row, col) {
      // 如果到达最后一行，说明已解决
      if (row === 8 && col === 9) {
        return true
      }

      // 如果列超出范围，移到下一行
      if (col === 9) {
        row++
        col = 0
      }

      // 如果当前位置已经有数字，则跳到下一个位置
      if (this.matrix[row][col] !== 0) {
        return this.solveSudoku(row, col + 1)
      }

      // 尝试填入1-9的数字
      const nums = this.shuffle()
      for (const num of nums) {
        if (this.isValidPlacement(row, col, num)) {
          this.matrix[row][col] = num

          // 递归处理下一个位置
          if (this.solveSudoku(row, col + 1)) {
            return true
          }

          // 如果不能解决，回溯
          this.matrix[row][col] = 0
        }
      }

      return false
    },

    isValidPlacement (row, col, num, matrix = this.matrix) {
      // 检查行
      for (let x = 0; x < 9; x++) {
        if (matrix[row][x] === num) {
          return false
        }
      }

      // 检查列
      for (let x = 0; x < 9; x++) {
        if (matrix[x][col] === num) {
          return false
        }
      }

      // 检查3x3子网格
      const startRow = row - row % 3
      const startCol = col - col % 3
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (matrix[i + startRow][j + startCol] === num) {
            return false
          }
        }
      }

      return true
    },

    applyDifficulty () {
      // 根据难度模式确定要移除的数字数量
      let cellsToRemove
      switch (this.mode) {
        case 1: // easy
          cellsToRemove = 35
          break
        case 2: // medium
          cellsToRemove = 45
          break
        case 3: // hard
          cellsToRemove = 52
          break
        case 4: // expert
          cellsToRemove = 58
          break
        default:
          cellsToRemove = 35
      }

      // 随机移除数字，同时确保有唯一解
      let removedCount = 0
      const positions = []
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          positions.push([i, j])
        }
      }

      // 随机打乱位置顺序
      this.shuffleArray(positions)

      for (const [row, col] of positions) {
        if (removedCount >= cellsToRemove) break

        const backup = this.matrix[row][col]
        this.matrix[row][col] = 0

        // 创建一个临时副本进行唯一解验证
        const tempMatrix = this.copyMatrix(this.matrix)

        // 计算解的数量，如果多于一个则恢复该数字
        if (!this.hasUniqueSolution(tempMatrix)) {
          this.matrix[row][col] = backup
        } else {
          removedCount++
        }
      }
    },

    hasUniqueSolution (matrix) {
      // 计算给定数独的解的数量（限制为最多2个）
      const tempMatrix = this.copyMatrix(matrix)
      const solutions = []

      this.findSolutions(tempMatrix, solutions, 2) // 最多找2个解

      return solutions.length === 1
    },

    findSolutions (matrix, solutions, maxSolutions) {
      if (solutions.length >= maxSolutions) {
        return // 已经找到足够的解
      }

      // 寻找第一个空位
      let row = -1; let col = -1
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (matrix[r][c] === 0) {
            row = r
            col = c
            break
          }
        }
        if (row !== -1) break
      }

      // 如果没有空位，说明找到了一个解
      if (row === -1) {
        solutions.push(this.copyMatrix(matrix))
        return
      }

      // 尝试填入1-9的数字
      for (let num = 1; num <= 9; num++) {
        if (this.isValidPlacement(row, col, num, matrix)) {
          matrix[row][col] = num

          this.findSolutions(matrix, solutions, maxSolutions)

          // 回溯
          matrix[row][col] = 0

          // 如果已经找到足够多的解，提前返回
          if (solutions.length >= maxSolutions) {
            return
          }
        }
      }
    },

    copyMatrix (matrix) {
      return matrix.map(row => [...row])
    },

    shuffleArray (array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
      }
      return array
    },
    selectCell (row, col) {
      // 只有当单元格是可编辑的时候才能选择
      if (this.originalMatrix[row][col] === 0) {
        this.selectedCell = { row, col }
      } else {
        this.selectedCell = null
      }
    },

    setNumber (num) {
      if (this.selectedCell) {
        const { row, col } = this.selectedCell
        if (this.originalMatrix[row][col] === 0) {
          this.matrix[row][col] = num
          this.updateErrors()
        }
      }
    },

    clearCell () {
      if (this.selectedCell) {
        const { row, col } = this.selectedCell
        if (this.originalMatrix[row][col] === 0) {
          this.matrix[row][col] = 0
          this.updateErrors()
        }
      }
    },

    hasError (row, col) {
      return this.errors.some(error => error.row === row && error.col === col)
    },

    updateErrors () {
      this.errors = []
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          // 检查非零值是否违反规则
          if (this.matrix[row][col] !== 0 && this.originalMatrix[row][col] === 0) {
            if (!this.isValidValue(row, col)) {
              this.errors.push({ row, col })
            }
          }
        }
      }
    },

    isValidValue (row, col) {
      const value = this.matrix[row][col]
      if (value === 0) return true

      // 检查行
      for (let c = 0; c < 9; c++) {
        if (c !== col && this.matrix[row][c] === value) {
          return false
        }
      }

      // 检查列
      for (let r = 0; r < 9; r++) {
        if (r !== row && this.matrix[r][col] === value) {
          return false
        }
      }

      // 检查3x3子网格
      const startRow = Math.floor(row / 3) * 3
      const startCol = Math.floor(col / 3) * 3
      for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
          if ((r !== row || c !== col) && this.matrix[r][c] === value) {
            return false
          }
        }
      }

      return true
    },

    shuffle () {
      const result = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      for (let i = result.length - 1; i > 0; i -= 1) {
        const j = ~~(Math.random() * i)
        const temp = result[j]
        result[j] = result[i]
        result[i] = temp
      }
      return result
    }
  }
}
</script>

<style lang="less" scoped>
.sudoku-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.matrix {
  margin: 0 auto;
  .row {
    display: table;
    margin: 0 auto;
    height: 50px;
    &:first-child {
      .cell {
        border-top: 2px solid #000;
      }
    }
    &:nth-child(3n + 3) {
      .cell {
        border-bottom: 2px solid #000;
      }
    }
    .cell {
      &:first-child {
        border-left: 2px solid #000;
      }
      &:nth-child(3n + 3) {
        border-right: 2px solid #000;
      }
      width: 50px;
      height: 100%;
      display: table-cell;
      vertical-align: middle;
      text-align: center;
      font-size: 2rem;
      border-right: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
      position: relative;
      cursor: pointer;

      &.editable {
        background-color: #f0f8ff; /* 浅蓝色背景表示可编辑 */
      }

      &.fixed {
        background-color: white;
        font-weight: bold;
      }

      &.selected {
        background-color: #ffff99; /* 黄色背景表示选中 */
      }

      &.error {
        color: red;
        background-color: #ffe6e6 !important; /* 错误时红色背景 */
      }
    }
  }
}

.number-pad {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 5列: 1-9数字 + 清除按钮 */
  gap: 5px;
  margin-top: 20px;
  max-width: 300px;

  .num-btn {
    padding: 12px;
    font-size: 1.2rem;
    border: 1px solid #ccc;
    background-color: #fff;
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background-color: #f0f0f0;
    }

    &:active {
      background-color: #d0d0d0;
    }
  }

  .clear-btn {
    grid-column: span 2; /* 清除按钮跨越两列 */
    background-color: #ffcccc;

    &:hover {
      background-color: #ff9999;
    }
  }
}
</style>
