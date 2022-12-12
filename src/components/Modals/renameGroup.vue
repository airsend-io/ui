<template>
  <div>
    <Modal
      @opened="onOpen"
      name="rename-group"
      :title="$t('channels.groups.rename-group')"
    >
      <Loader :loading="$store.state.loading['channel.group.update']" full />
      <form novalidate="true" @submit.prevent.stop="onSubmit">
        <input
          ref="inputGroupName"
          v-model="inpModel"
          class="form-control form-control-sm filter-channels-form"
          type="text"
          :placeholder="$t('channels.groups.create-group-label')"
        />
        <div class="form-group text-center mt-5">
          <button
            class="btn btn-primary btn-rounded mx-2"
            :class="{ disabled: this.inpModel === '' }"
          >
            {{ $t('channels.groups.rename-group') }}
          </button>
          <button
            class="btn btn-primary btn-ghost mx-2"
            type="button"
            @click="$modal.hide('rename-group')"
          >
            {{ $t('general.cancel') }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';

export default {
  components: {
    Modal,
    Icon,
    Loader
  },
  data: function() {
    return {
      inpModel: ''
    };
  },
  props: {
    group: {
      type: Object
    }
  },
  computed: {},
  methods: {
    onSubmit(e) {
      e.preventDefault();
      this.$emit('onSubmit', {
        name: this.inpModel,
        channel_group_id: this.group.id
      });
    },
    onOpen() {
      this.inpModel = this.group.name;
      this.$refs.inputGroupName.focus();
    }
  }
};
</script>
