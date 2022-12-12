<template>
  <span
    v-if="unread_count > 0"
    class="badge badge-primary w-auto"
    :class="{ 'badge-muted': muted, ripple: showRipple }"
    v-tooltip="{
      delay: { show: 500, hide: 0 },
      content: muted ? $t('channels.muted-badge') : ''
    }"
  >
    {{ unread_count > 99 ? '99+' : unread_count }}
  </span>
</template>

<script>
import _ from 'lodash';
import Popover from './Popover';

export default {
  components: {
    Popover
  },
  props: {
    unread_count: {
      type: Number,
      default: 0
    },
    muted: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showRipple: false,
      timeout: null
    };
  },
  mounted() {},
  methods: {
    newRipple: _.debounce(function() {
      clearTimeout(this.timeout);
      this.showRipple = true;
      setTimeout(() => {
        this.showRipple = false;
      }, 400);
    }, 200)
  },
  watch: {
    unread_count(unread, previousUnread) {
      if (unread > previousUnread) {
        this.newRipple();
      }
    }
  }
};
</script>
