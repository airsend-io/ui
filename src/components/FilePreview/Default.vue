<template>
  <div class="file-preview-item file-preview-item--default">
    <div class="file-preview-item-info">
      <FileIcon :name="file.file" />
      <h4 :class="{ 'mb-3': !file.size }">{{ file.file }}</h4>
      <p v-if="file.size">{{ bytesToSize(file.size) }}</p>
      <a @click="$emit('download')" class="btn btn-primary"
        ><Icon family="fas" name="download" /> {{ $t('files.download') }}</a
      >
    </div>
  </div>
</template>

<script>
import FileIcon from '../FileIcon';
import Icon from '../Icon';
import { bytesToSize } from 'airsend/utils';

export default {
  props: {
    file: {
      type: Object
    }
  },
  methods: {
    bytesToSize
  },
  components: {
    FileIcon,
    Icon
  }
};
</script>
