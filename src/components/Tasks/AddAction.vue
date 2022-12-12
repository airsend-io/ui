<template>
  <div class="form-group add-task-wrapper">
    <button
      class="btn btn-icon"
      @click="addAction"
      :disabled="!user.role.can('action.create') || disabled"
    >
      <Icon family="far" name="plus" />
    </button>
    <input
      id="action_name"
      ref="action_name"
      v-model="newAction.name"
      type="action_name"
      class="form-control form-control-sm"
      autocomplete="off"
      :disabled="!user.role.can('action.create') || disabled"
      :placeholder="
        $t(parent_id ? 'actions.add-subtask' : 'actions.add-action')
      "
      @keyup.enter="addAction"
      @keydown.tab="e => addAction(e)"
      @keydown.esc="$emit('hide-add-task-form')"
      v-tooltip="{
        delay: { show: 1000, hide: 0 },
        offset: -5,
        content: tooltip
      }"
    />
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon.vue';

export default {
  data() {
    return {
      newAction: {
        name: ''
      }
    };
  },
  mounted() {
    if (this.autofocus) {
      this.$refs['action_name'].focus();
    }
  },
  methods: {
    async addAction(e) {
      if (e) {
        e.preventDefault();
      }

      if (this.newAction.name === '' || this.loading) {
        this.$refs['action_name'].focus();
        return;
      }

      let payload = {
        action_name: this.newAction.name,
        channel_id: this.channel.id,
        action_type: '1'
      };
      console.log('addAction', payload);

      if (this.parent_id) {
        payload.parent_id = this.parent_id;
      }

      this.$nextTick(() => {
        this.$refs['action_name'].focus();
      });

      this.newAction.name = '';
      const response = await this.$store.dispatch('actions/create', payload);
      if (!response.ok) {
        this.newAction.name = payload.action_name;
      }
      this.$refs['action_name'].focus();
    }
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](
        this.channel ? this.channel.id : null
      );
    },
    channel() {
      return this.$store.getters['channels/getChannelById'](this.channel_id);
    },
    loading() {
      return this.$store.state.loading['actions/create'];
    }
  },
  props: {
    parent_id: {
      type: Number,
      default: null
    },
    channel_id: {
      type: Number,
      required: true
    },
    autofocus: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    tooltip: {
      type: String,
      default: ''
    }
  },
  components: {
    Icon
  }
};
</script>

<style></style>
