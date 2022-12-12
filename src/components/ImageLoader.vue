<template>
  <div class="image-loader"></div>
</template>
<script>
export default {
  props: {
    loading: {
      type: Boolean,
      default: true
    }
  }
};
</script>
<style scoped>
.image-loader {
  position: absolute;
  height: inherit;
  width: inherit;

  border-radius: 0.4rem;
  background: var(--border-color);
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
