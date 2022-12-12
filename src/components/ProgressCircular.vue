<template>
  <div class="progress-bar-circular">
    <div class="progress-bar-graph">
      <svg>
        <circle cx="40" cy="40" r="40" />
        <circle
          cx="40"
          cy="40"
          r="40"
          :style="{ 'stroke-dashoffset': `calc(250 - (250 * ${value}) / 100)` }"
        />
      </svg>
    </div>
    <div class="progress-text">
      <h3>{{ value }}%</h3>
      <h4 v-if="text">{{ text }}</h4>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      required: true
    },
    text: {
      default: ''
    }
  },
  data() {
    return {};
  }
};
</script>

<style></style>
