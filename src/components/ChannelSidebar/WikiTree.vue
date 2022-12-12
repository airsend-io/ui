<template>
  <router-link
    class="link-item"
    v-if="isFile(tree)"
    :class="{ active: parseFilePath(tree.path) === current }"
    :to="`/channel/${channel.id}/wiki/${parseFilePath(tree.path)}`"
    v-close-popover
  >
    <h4 class="text-truncate" v-if="tree.summary && tree.summary[0]">
      {{ parseMessageContent(tree.summary[0], null, true) }}
    </h4>
    <p
      v-if="tree.summary && tree.summary[1]"
      class="item-content text-truncate"
    >
      {{ parseMessageContent(tree.summary[1], null, true) }}
    </p>
    <p class="item-link">
      <Icon family="fal" name="file-alt" />
      {{ tree.name }}
    </p>
  </router-link>
  <div
    v-else-if="tree.items && tree.items.length"
    :class="{
      ['root-folder']: isRootFolder,
      ['wiki-tree-folder']: hasFileInsideFolder(tree.items)
    }"
  >
    <h4 v-if="hasFileInsideFolder(tree.items)" class="text-truncate">
      <Icon family="fal" name="folder" />
      {{ tree.name }}
    </h4>

    <ul>
      <WikiTree
        v-for="(item, index) in tree.items"
        :key="index"
        :tree="item"
        :current="current"
        :channel="channel"
      />
    </ul>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';
import { parseMessageContent } from 'airsend/utils';

export default {
  name: 'WikiTree',
  components: {
    Icon
  },
  props: {
    isRootFolder: {
      type: Boolean,
      default: false
    },
    tree: {
      default: () => {}
    },
    current: {
      type: String,
      default: ''
    },
    channel: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    current() {
      return console.log(this.current);
    }
  },
  methods: {
    isFile(treeItem) {
      return treeItem.items === undefined;
    },
    hasFileInsideFolder(treeItems) {
      return treeItems.some(item => this.isFile(item));
    },
    parseFilePath(path) {
      return path.replace(/\/wf\/\w+\//, '');
    },
    parseMessageContent: parseMessageContent
  }
};
</script>
