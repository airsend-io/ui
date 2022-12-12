<template>
  <div class="team-card-section-loader">
    <ContentLoader
      :height="190"
      :width="350"
      :speed="2"
      :primaryColor="isDarkMode ? '#1b1b1b' : '#E1E4E8'"
      :secondaryColor="isDarkMode ? '#232324' : '#F1F2F4'"
    >
      <rect x="16" y="20" rx="3" ry="3" width="130" height="14" />
      <rect x="16" y="70" rx="3" ry="3" width="320" height="14" />
      <rect x="16" y="90" rx="3" ry="3" width="300" height="14" />
      <rect x="16" y="110" rx="3" ry="3" width="325" height="14" />
      <rect x="16" y="130" rx="3" ry="3" width="150" height="14" />
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
/*
<rect x="18" y="14" rx="4" ry="4" width="16" height="16" />

<rect x="42" y="50" rx="3" ry="3" width="46" height="7" />
<rect x="42" y="62" rx="3" ry="3" width="64" height="10" />

<rect x="42" y="100" rx="3" ry="3" width="80" height="8" />
<rect x="42" y="110" rx="3" ry="3" width="32" height="8" />

<circle cx="237" cy="110" r="12.5" />
*/
</script>
