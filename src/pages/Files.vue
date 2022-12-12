<template>
  <div class="page-content">
    <MeetingWidget />
    <Loader
      loading
      full
      v-if="!file.displayname && this.$store.state.loading['files/info']"
    />
    <div class="container-fluid fullheight" v-else>
      <InlinePreview :files="[{ file: fileName, path }]" v-if="isFile" />
      <FullFileExplorer :initial-path="path" initial-path-name="Files" v-else />
    </div>
  </div>
</template>
<script>
import FullFileExplorer from '../components/Files/FullFileExplorer.vue';
import InlinePreview from 'airsend/components/InlinePreview.vue';
import Loader from 'airsend/components/Loader.vue';
import MeetingWidget from '../components/Meeting/Widget.vue';

export default {
  name: 'Files',
  components: {
    FullFileExplorer,
    MeetingWidget,
    InlinePreview,
    Loader
  },
  data() {
    return {
      isReady: false,
      file: {}
    };
  },
  async mounted() {
    if (this.path !== '') {
      const response = await this.$store.dispatch('files/info', this.path);
      const { file } = response.data;

      this.file = file;
    }
  },
  computed: {
    path() {
      const { pathMatch: path } = this.$route.params;
      return path ? `/${path}` : '';
    },
    isFile() {
      if (this.path !== '') {
        return (
          this.path.indexOf('.') > -1 ||
          (this.file && this.file.type && this.file.type !== 'folder')
        );
      } else {
        return false;
      }
    },
    fileName() {
      return this.path.replace(/^.*[\\\/]/, '');
    }
  }
};
</script>
