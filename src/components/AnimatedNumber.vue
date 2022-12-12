<template>
  <span class="animated-number">{{
    i18n !== '' ? $tc(i18n, displayNumber) : displayNumber
  }}</span>
</template>

<script>
export default {
  props: {
    number: {
      type: Number,
      default: -1
    },
    i18n: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      displayNumber: 0,
      interval: null
    };
  },
  mounted() {
    this.displayNumber = this.number;
  },
  watch: {
    number: function() {
      clearInterval(this.interval);

      if (this.number == this.displayNumber) {
        return;
      }

      this.interval = window.setInterval(
        function() {
          if (this.displayNumber != this.number) {
            var change = (this.number - this.displayNumber) / 5;

            change = change >= 0 ? Math.ceil(change) : Math.floor(change);

            this.displayNumber = this.displayNumber + change;
          }
        }.bind(this),
        20
      );
    }
  }
};
</script>
