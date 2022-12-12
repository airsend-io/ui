<template>
  <div class="toast-wrapper toast-wrapper--sidebar" v-show="toasts.length">
    <transition-group name="list" tag="div">
      <div
        class="toast-item"
        v-bind:class="{
          [`toast-item--${toast.type}`]: true,
          [`toast-item--no-close`]: !toast.close
        }"
        v-for="toast in toasts"
        :key="toast.id"
      >
        <ToasterItem :toast="toast" />
      </div>
    </transition-group>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon.vue';
import Avatar from 'airsend/components/Avatar.vue';
import ToasterItem from './ToasterItem';
import { parseMessageContent } from 'airsend/utils';

export default {
  methods: {
    onDismiss(id) {
      this.$store.commit('core/dismissSidebarToast', id);
    },
    onConfirm() {},
    parseMessageContent
  },
  computed: {
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    toasts() {
      return this.$store.state.core.sidebarToasts;
    }
  },
  components: {
    Icon,
    Avatar,
    ToasterItem
  }
};
</script>
