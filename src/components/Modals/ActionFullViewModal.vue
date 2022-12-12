<template>
  <Modal
    name="action-full-view-modal"
    :title="$t('actions.title')"
    class="full-action-view-modal-wrapper"
    @before-open="onOpen"
    @before-close="beforeClose"
    @closed="onClose"
  >
    <FullActionView />
  </Modal>
</template>

<script>
import Modal from 'airsend/components/Modal.vue';
import FullActionView from '../FullActionView';
export default {
  components: {
    Modal,
    FullActionView
  },
  methods: {
    onOpen({ params }) {
      this.$emit('opened');

      if (params) {
        this.$store.dispatch('actions/setFullActionFilters', {
          ...params
        });
      } else {
        const currentChannel = parseInt(this.$route.params.id);
        const filters = this.$store.state.actions.fullActionFilters;
        if (currentChannel) {
          this.$store.dispatch('actions/setFullActionFilters', {
            ...filters,
            channel_id: currentChannel
          });
        }
      }
    },
    onClose() {
      this.$emit('closed');
    },
    beforeClose(e) {
      const isEditModalOpened = document.getElementById('action-create-modal');
      if (isEditModalOpened) {
        e.stop();
      }
    }
  }
};
</script>

<style></style>
