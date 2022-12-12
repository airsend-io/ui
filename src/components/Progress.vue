<template>
  <div class="progress">
    <div
      class="progress-bar"
      role="progressbar"
      :class="{ ['progress-bar-striped']: striped }"
      :style="{ width: striped ? '100%' : value + '%' }"
      :aria-valuenow="striped ? 100 : value"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      required: true
    }
  },
  computed: {
    striped() {
      if (this.value === 0) return false;
      if (!this.value) return true; //prevent null, NaN, undefined
      return this.value < 0 || this.value > 100;
    }
  }
};
</script>

<style></style>
