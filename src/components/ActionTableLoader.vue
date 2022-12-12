<template>
  <div class="action-table-loader">
    <div class="task-pre-icons-col">
      <ContentLoader
        :height="40"
        :width="64"
        :speed="2"
        :primaryColor="isDarkMode ? '#1b1b1b' : '#E1E4E8'"
        :secondaryColor="isDarkMode ? '#232324' : '#F1F2F4'"
      >
        <rect x="37" y="14" rx="4" ry="4" width="16" height="16" />
      </ContentLoader>
    </div>
    <div class="task-title-col">
      <ContentLoader
        :height="40"
        :width="200"
        :speed="2"
        :primaryColor="isDarkMode ? '#1b1b1b' : '#E1E4E8'"
        :secondaryColor="isDarkMode ? '#232324' : '#F1F2F4'"
      >
        <rect x="0" y="14" rx="4" ry="4" width="150" height="14" />
      </ContentLoader>
    </div>
    <div class="task-channel-col">
      <ContentLoader
        :height="40"
        :width="150"
        :speed="2"
        :primaryColor="isDarkMode ? '#1b1b1b' : '#E1E4E8'"
        :secondaryColor="isDarkMode ? '#232324' : '#F1F2F4'"
      >
        <rect x="0" y="14" rx="4" ry="4" width="100" height="10" />
      </ContentLoader>
    </div>
    <div class="task-due-col">
      <ContentLoader
        :height="40"
        :width="150"
        :speed="2"
        :primaryColor="isDarkMode ? '#1b1b1b' : '#E1E4E8'"
        :secondaryColor="isDarkMode ? '#232324' : '#F1F2F4'"
      >
        <rect x="0" y="14" rx="4" ry="4" width="100" height="10" />
      </ContentLoader>
    </div>
    <div class="task-users-col">
      <ContentLoader
        :height="40"
        :width="170"
        :speed="2"
        :primaryColor="isDarkMode ? '#1b1b1b' : '#E1E4E8'"
        :secondaryColor="isDarkMode ? '#232324' : '#F1F2F4'"
      >
        <circle cx="9" cy="22" r="9" />
        <rect x="25" y="14" rx="4" ry="4" width="60" height="14" />
      </ContentLoader>
    </div>
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
