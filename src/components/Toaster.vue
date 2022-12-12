<template>
  <div class="toast-wrapper" :class="{ ['no-use-teams']: !useTeams }">
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
        <div class="toast-item-message" v-if="toast.isUpdate">
          {{
            typeof toast.content === 'string'
              ? toast.content
              : $t(toast.content.message, toast.content.meta)
          }}
          <button class="btn btn-secondary btn-sm m-1" @click="onConfirm">
            {{ toast.actionText }}
          </button>
        </div>
        <div class="toast-item-message" v-else>
          {{
            typeof toast.content === 'string'
              ? toast.content
              : $t(toast.content.message, toast.content.meta)
          }}
        </div>
        <button
          type="button"
          v-if="toast.close"
          class="btn btn-icon btn-sm"
          @click="onDismiss(toast.id)"
        >
          <Icon family="far" name="times" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon.vue';

export default {
  methods: {
    onDismiss(id) {
      this.$store.commit('core/dismissToast', id);
    },
    onConfirm() {
      if (window.ipcRenderer) {
        window.ipcRenderer.send('restart-and-install');
      } else {
        window.location.reload();
      }
    }
  },
  beforeDestroy() {
    this.$emit('destroyed');
  },
  computed: {
    useTeams() {
      return this.$store.state.core.useTeams;
    },
    toasts() {
      return this.$store.state.core.toasts;
    }
  },
  components: {
    Icon
  },
  mounted() {
    this.$emit('mounted');

    if (window.ipcRenderer) {
      window.ipcRenderer.on('download-available', () => {
        this.$store.dispatch('core/appUpdatesCompleted', {
          close: true,
          isUpdate: true,
          content:
            'A new update for AirSend has been downloaded. Please restart to install the updates',
          contentType: 'text',
          id: 'update.restartMessage',
          type: 'primary',
          actionText: 'Restart now'
        });
      });
    }
  }
};
</script>
