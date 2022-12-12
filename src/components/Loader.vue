<template>
  <div class="loader" v-bind:class="{ [`loader--full`]: full, [`show`]: show }">
    <div class="loader-content">
      <LoaderIllustration />
      <p v-if="title">{{ title }}</p>
    </div>
  </div>
</template>
<script>
import LoaderIllustration from 'airsend/assets/loader.svg';

export default {
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    full: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    }
  },
  computed: {
    // a computed getter
    show: function() {
      // `this` points to the vm instance
      return this.loading;
    }
  },
  methods: {},
  components: {
    LoaderIllustration
  }
};
</script>
