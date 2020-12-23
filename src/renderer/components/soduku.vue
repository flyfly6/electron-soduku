<template>
  <div>
    <board />
    <toolbar />
  </div>
</template>

<script>
import board from './soduku/board'
import toolbar from './soduku/toolbar'

export default {
  name: 'Soduku',
  components: { board, toolbar }
}
</script>
