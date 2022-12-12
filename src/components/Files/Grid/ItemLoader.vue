<template>
  <Drag
    :transfer-data="item"
    :draggable="false"
    :effect-allowed="['link']"
    tag="div"
    class="file-explorer-single file-explorer-single--file"
    :class="{
      [`file-explorer-single--selected`]: isSelected,
      [`file-explorer-single--optionsOpened`]: isoptionsOpened,
      ['file-explorer-single--loading']: renamedFileProps !== undefined
    }"
  >
    <div>
      <FileIcon :name="item.name" isLoader />
    </div>
    <Checkbox :checked="false" :disabled="true" />
    <div class="item-footer" @mouseenter="onMouseOver">
      <div class="title-wrapper" ref="file-name-container">
        <span :class="{ [`text-overflow`]: textOverflow }">{{
          item.name
        }}</span>
      </div>
      <div>
        <button
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('files.tooltips.more-options')
          }"
          class="btn btn-icon"
          disabled
        >
          <Icon family="fal" name="ellipsis-h" />
        </button>
      </div>
    </div>
  </Drag>
</template>
<script>
import Icon from 'airsend/components/Icon';
import FileIcon from 'airsend/components/FileIcon';
import Checkbox from 'airsend/components/Checkbox.vue';

import { Drag } from 'vue-drag-drop';

export default {
  components: {
    Icon,
    FileIcon,
    Drag,
    Checkbox
  },
  props: {
    selection: {
      type: Array,
      default: () => {
        return [];
      }
    },
    selectOnly: {
      type: Boolean,
      default: false
    },
    // select only, no preview
    picker: {
      type: Boolean,
      default: false
    },
    simplified: {
      type: Boolean,
      default: false
    },
    hasMultiSelect: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isDragActive: false,
      isRenaming: false,
      newName: '',
      isoptionsOpened: false,
      textOverflow: false,
      item: {
        name: this.$t('general.loading')
      }
    };
  },
  computed: {
    uploading() {
      return this.$store.state.loading['file.upload'];
    },
    renamedFileProps() {
      return this.$store.state.files.renaming[this.item.fullpath];
    },
    isSelected() {
      return false;
    }
  },
  methods: {
    onMouseOver(e) {
      this.$nextTick(() => {
        let container = this.$refs['file-name-container'];
        let text = container.firstChild;
        this.textOverflow = text.clientWidth > container.clientWidth;
      });
    }
  }
};
</script>
