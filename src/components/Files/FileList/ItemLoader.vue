<template>
  <Drag
    v-cloak
    tag="tr"
    class="file-explorer-single file-explorer-single--file"
    :draggable="false"
  >
    <th v-if="hasMultiSelect" scope="row" class="file-explorer-checkbox">
      <Checkbox :checked="isSelected" :disabled="true" />
    </th>
    <td>
      <div class="file-info">
        <FileIcon :name="'Loading'" isLoader class="p-0" />
        <h4 class="w-100">
          <TextLoader />
          <small class="mt-0">
            <TextLoader :width="50" />
          </small>
        </h4>
      </div>
    </td>
    <td v-if="!simplified" class="d-none d-sm-table-cell">
      <TextLoader />
    </td>
    <td
      v-if="!selectOnly && !simplified"
      class="hover-only d-none d-sm-table-cell"
    >
      <div class="btn-group">
        <button class="btn btn-sm btn-icon" :disabled="true">
          <Icon family="fal" name="download" />
        </button>
        <button class="btn btn-sm btn-icon" :disabled="true">
          <Icon family="fal" name="money-check-edit" />
        </button>
        <button class="btn btn-sm btn-icon" :disabled="true">
          <Icon family="fal" name="clone" />
        </button>
      </div>
    </td>
    <td v-if="!selectOnly" class="hover-only text-right">
      <button class="btn btn-icon" :disabled="true">
        <Icon family="fal" name="ellipsis-h" />
      </button>
    </td>
  </Drag>
</template>
<script>
import Icon from 'airsend/components/Icon';
import FileIcon from 'airsend/components/FileIcon';

import Checkbox from 'airsend/components/Checkbox.vue';

import { Drag } from 'vue-drag-drop';

import { parseTime, bytesToSize, retrieveFiles } from 'airsend/utils';
import TextLoader from 'airsend/components/TextLoader';

export default {
  components: {
    Icon,
    Drag,
    Checkbox,
    FileIcon,
    TextLoader
  },
  props: {
    selectOnly: {
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
    },
    isDarkMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isDragActive: false,
      timeout: null,
      counter: 0,
      isRenaming: false,
      newName: ''
    };
  },
  computed: {
    isSelected() {
      false;
    }
  }
};
</script>
