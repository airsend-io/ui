<template>
  <fragment class="task-editable-title">
    <textarea
      v-if="isRenaming"
      aria-label="'New action name'"
      :ref="`rename-input`"
      v-model="newName"
      type="text"
      class="form-control rename-input"
      @blur="() => onCancelRename(action)"
      @keyup.escape="() => onCancelRename(action)"
      @keyup.enter="e => onRename(e, action)"
      @input="autogrow"
    />
    <div
      v-else
      @click="() => onClickRename(action)"
      class="task-name"
      v-tooltip="{
        content: action.action_desc,
        delay: { show: 500, hide: 0 }
      }"
      v-html="action.action_name_highlighted || action.action_name"
    />
  </fragment>
</template>

<script>
export default {
  data() {
    return {
      newName: '',
      isRenaming: false
    };
  },
  methods: {
    onClickRename(action) {
      if (!this.user.role.can('action.update')) return;
      this.newName = action.action_name;
      this.isRenaming = true;

      this.$nextTick(() => {
        this.$refs['rename-input'].select();
        this.autogrow();
      });
    },
    async onRename(event, action) {
      event.target.value = event.target.value.replace(/[\r\n\v]+/g, '');
      this.autogrow();
      if (!this.isRenaming) return;

      this.isRenaming = false;

      if (this.newName !== action.action_name && this.newName !== '') {
        const action_name = action.action_name;
        action.action_name = this.newName;
        const response = await this.$store.dispatch('actions/update', {
          id: action.id,
          action_name: this.newName.replace(/[\r\n\v]+/g, '')
        });
        if (!response.ok) {
          action.action_name = action_name;
        } else {
          action.action_name_highlighted = '';
        }
      }
    },
    onCancelRename(action) {
      this.isRenaming = false;
    },
    autogrow() {
      let element = this.$refs['rename-input'];
      element.style.height = '5px';
      element.style.height = element.scrollHeight + 'px';
    }
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](
        this.channel ? this.channel.id : null
      );
    },
    channel() {
      return this.$store.getters['channels/getChannelById'](
        this.action.channel_id
      );
    }
  },
  props: {
    action: {
      type: Object,
      required: true
    }
  }
};
</script>

<style></style>
