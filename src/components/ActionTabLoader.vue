<template>
  <div class="action-tab-loader">
    <ContentLoader
      :height="92"
      :width="316"
      :speed="2"
      :primaryColor="isDarkMode ? '#1b1b1b' : '#E1E4E8'"
      :secondaryColor="isDarkMode ? '#232324' : '#F1F2F4'"
    >
      <rect x="32" y="14" rx="4" ry="4" width="16" height="16" />
      <rect x="60" y="14" rx="4" ry="4" width="160" height="16" />

      <rect x="60" y="38" rx="4" ry="4" width="100" height="9" />

      <circle cx="70" cy="62" r="9" />
      <rect x="85" y="55" rx="4" ry="4" width="100" height="14" />
    </ContentLoader>
    <hr />
  </div>
</template>
<script>
import { ContentLoader } from 'vue-content-loader';

export default {
  props: {
    loading: {
      type: Boolean,
      default: true
    }
  },
  components: {
    ContentLoader
  },
  computed: {
    isDarkMode() {
      return this.$store.state.core.isDarkMode;
    }
  }
};
</script>
