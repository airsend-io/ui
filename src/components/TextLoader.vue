<template>
  <div class="text-loader" :style="{ width: width + 'px' }"></div>
</template>
<script>
export default {
  props: {
    width: {
      type: Number,
      default: 180
    }
  },
  components: {}
};
</script>

<style scoped>
.text-loader {
  height: 12.8px;
  margin-bottom: 3px;
  border-radius: 3px;
  background-color: var(--border-color);

  animation: pulse 3s infinite;
}

@keyframes pulse {
  0% {
    background-color: var(--border-color);
  }

  50% {
    background-color: var(--bg-light-dark);
  }

  100% {
    background-color: var(--border-color);
  }
}
</style>
