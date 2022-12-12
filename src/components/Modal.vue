<template>
  <vue-modal
    :name="name"
    @before-open="beforeOpen"
    @before-close="beforeClose"
    @opened="opened"
    @closed="$emit('closed', $event)"
    :class="className"
    v-bind="{ ...$props, ...$attrs }"
  >
    <div class="modal-header">
      <h4>{{ title }}</h4>
      <ul class="modal-nav">
        <li>
          <a class="btn btn-icon" @click="close"
            ><Icon family="far" name="times"
          /></a>
        </li>
      </ul>
    </div>
    <div class="modal-body" :class="{ [`no-padding`]: theme === `noPadding` }">
      <slot></slot>
    </div>
  </vue-modal>
</template>
<script>
import Icon from 'airsend/components/Icon.vue';

export default {
  props: {
    name: {
      type: String,
      default: ''
    },
    full: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    theme: {
      type: String,
      default: ''
    },
    className: {
      type: String,
      default: ''
    }
  },
  methods: {
    close: function() {
      this.$modal.hide(this.name);
    },
    opened: function() {
      this.$emit('opened', null);
    },
    beforeOpen: function(e) {
      this.$emit('before-open', e);
    },
    beforeClose: function(e) {
      this.$emit('before-close', e);
    }
  },
  components: {
    Icon
  }
};
</script>
