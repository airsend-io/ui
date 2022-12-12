<template>
  <Popover
    popover-base-class="popover wikiLinks"
    boundariesElement=".sidebar-fragment-content"
    placement="bottom-end"
    :offset="10"
    ref="wikilinkPop"
    @show="isActive = true"
    @hide="isActive = false"
  >
    <button
      v-tooltip="{ delay: 1000, offset: -5, content: $t('wiki.pages-title') }"
      class="btn btn-icon btn-sm btn-primary rounded"
      :class="{ active: isActive }"
    >
      <Icon family="far" name="stream" />
    </button>
    <template slot="popover">
      <div class="dropdown-items">
        <div class="card-header header-text d-flex align-items-center">
          {{ $t('wiki.pages-title') }}
          <button
            class="btn btn-icon btn-sm rounded ml-auto"
            v-if="canEdit"
            v-close-popover
            v-tooltip="{
              delay: 1000,
              offset: -5,
              content: $t('wiki.pages-add-new')
            }"
            @click="$emit('createNewWiki')"
          >
            <Icon family="fal" name="plus-circle" />
          </button>
        </div>
        <div class="dropdown-items">
          <WikiTree
            v-for="(link, index) in links"
            :tree="link"
            :isRootFolder="true"
            :current="current"
            :channel="channel"
            :key="index"
          />
        </div>
      </div>
    </template>
  </Popover>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Popover from 'airsend/components/Popover.vue';
import WikiTree from 'airsend/components/ChannelSidebar/WikiTree.vue';

export default {
  components: {
    Icon,
    Popover,
    WikiTree
  },
  props: {
    links: {
      type: Array,
      default: () => []
    },
    current: {
      type: String,
      default: ''
    },
    canEdit: {
      type: Boolean,
      default: false
    },
    channel: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      isActive: false
    };
  }
};
</script>
