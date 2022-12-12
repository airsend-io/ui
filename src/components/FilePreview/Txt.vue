<template>
  <div class="file-preview-item file-preview-item--text">
    <Loader loading v-if="isLoading" />
    <div
      class="file-preview-content wiki-content"
      v-else-if="isMarkdown && textContent !== ''"
      v-html="displayContent"
    ></div>
    <div class="file-preview-content" v-else-if="textContent !== ''">
      {{ displayContent }}
    </div>
    <div class="empty-wrapper" v-else>
      <div class="empty-box">
        <Icon family="fal" name="file-alt" />
        <h4>No content</h4>
        <p>The text you are trying to preview file is empty</p>
      </div>
    </div>
  </div>
</template>

<script>
import FileIcon from '../FileIcon';
import Icon from '../Icon';
import Loader from '../Loader';
import { getFilePureBlob, markdownToHtml } from 'airsend/utils';

export default {
  props: {
    file: {
      type: Object
    }
  },
  components: {
    FileIcon,
    Icon,
    Loader
  },
  computed: {
    isMarkdown() {
      return this.file.path.indexOf('.md') > -1;
    },
    displayContent() {
      const parentPath = this.file.path.substr(
        0,
        this.file.path.lastIndexOf('/')
      );
      return this.isMarkdown
        ? markdownToHtml(this.textContent, parentPath, true)
        : this.textContent;
    }
  },
  data() {
    return {
      isLoading: false,
      textContent: ''
    };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.isLoading = true;

      const token = this.$route.query.hash
        ? this.$route.query.hash
        : this.$store.state.core.user.token;

      // load file blob
      this.blob = await getFilePureBlob(this.file.path, { token });
      this.textContent = await this.blob.text();

      this.isLoading = false;
    }
  }
};
</script>
