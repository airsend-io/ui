<template>
  <div class="task-single task-single-grid task-single-root action-grid-loader">
    <ContentLoader
      :height="160"
      :width="288"
      :speed="2"
      :primaryColor="isDarkMode ? '#1b1b1b' : '#E1E4E8'"
      :secondaryColor="isDarkMode ? '#232324' : '#F1F2F4'"
    >
      <rect x="18" y="14" rx="4" ry="4" width="16" height="16" />
      <rect x="42" y="16" rx="3" ry="3" width="64" height="12" />

      <rect x="42" y="50" rx="3" ry="3" width="46" height="7" />
      <rect x="42" y="62" rx="3" ry="3" width="64" height="10" />

      <rect x="42" y="100" rx="3" ry="3" width="80" height="8" />
      <rect x="42" y="110" rx="3" ry="3" width="32" height="8" />

      <circle cx="237" cy="110" r="12.5" />
    </ContentLoader>
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
