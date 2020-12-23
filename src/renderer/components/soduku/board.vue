<template>
  <div class="matrix">
    <div class="row" v-for="(row, rowIndex) in matrix" :key="rowIndex">
      <div class="cell" v-for="(column, columnIndex) in row" :key="columnIndex">
        {{ column }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Board',
  data () {
    return {
      matrix: [],
      times: 0,
      mode: 1
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
      this.times = 0
    },
    init () {
      this.clear()
      while (this.matrix.length < 9) {
        this.times += 1
        if (this.times > 230) {
          console.log('tried 230 times, restart generating.')
          this.times = 0
          this.matrix = []
        }
        if (this.matrix.length === 0) {
          this.matrix.push(this.shuffle())
        } else {
          const row = []
          const randomArr = this.shuffle()
          for (let i = 0; i < 9; i += 1) {
            for (let j = 0; j < randomArr.length; j++) {
              const element = randomArr[j]
              if (this.validate(row, element)) {
                row.push(element)
                break
              }
            }
            if (row.length === i) {
              break
            }
          }
          if (row.length === 9) {
            this.matrix.push(row)
          }
        }
      }
      console.log(`tried ${this.times} times`)
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
    },
    validate (row, element) {
      const length = this.matrix.length
      const rowLength = row.length
      for (let i = 0; i < row.length; i += 1) {
        if (row[i] === element) {
          return false
        }
      }
      for (let i = 0; i < length; i += 1) {
        if (element === this.matrix[i][rowLength]) {
          return false
        }
      }
      if (length % 3 !== 0) {
        for (
          let rowIndex = 3 * ~~(length / 3);
          rowIndex < length;
          rowIndex += 1
        ) {
          for (
            let colIndex = 3 * ~~(rowLength / 3);
            colIndex < 3 * (~~(rowLength / 3) + 1);
            colIndex += 1
          ) {
            if (element === this.matrix[rowIndex][colIndex]) {
              return false
            }
          }
        }
      }
      return true
    }
  }
}
</script>

<style lang="less" scoped>
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
    }
  }
}
</style>
