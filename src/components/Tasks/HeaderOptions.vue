<template>
  <div
    class="task-pos-icons"
    @mouseenter="hoverActive = true"
    @mouseleave="hoverActive = false"
    :class="{ ['force-show']: hoverActive || hasPopoverOpened }"
  >
    <button
      class="btn btn-icon btn-sm"
      :class="{ ['d-none']: !root }"
      @click="onToggleExpand(action, index, true, true)"
      :disabled="!user.role.can('action.update') || action.loading"
      v-if="isTabContext || isTableContext"
      v-tooltip="{
        delay: 1000,
        offset: -5,
        content: $t('actions.add-subtask')
      }"
    >
      <Icon family="fal" name="layer-plus" />
    </button>

    <Popover
      :ref="`duplicate-task-popover`"
      @apply-hide="isPopoverOpened['duplicate-task'] = false"
      @show="isPopoverOpened['duplicate-task'] = true"
    >
      <button
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('actions.duplicate-options')
        }"
        class="btn btn-icon btn-sm"
        :disabled="!user.role.can('action.update') || action.loading"
      >
        <Icon family="far" name="sticky-note" />
      </button>
      <template slot="popover">
        <div
          class="duplicate-task-wrapper"
          v-if="isPopoverOpened['duplicate-task']"
        >
          <template>
            <div class="dropdown-items">
              <button
                v-close-popover
                class="dropdown-item"
                type="button"
                @click="() => duplicateAction(action, 0)"
              >
                <Icon family="fal" name="object-group" />
                {{ $t('actions.duplicate') }}
              </button>
              <button
                v-close-popover
                class="dropdown-item"
                type="button"
                @click="duplicateAction(action, 1)"
              >
                <Icon family="fal" name="clone" />
                {{ $t('actions.copy-to-channel') }}
              </button>
              <button
                v-close-popover
                class="dropdown-item"
                type="button"
                @click="duplicateAction(action, 2)"
              >
                <Icon family="fal" name="arrow-alt-right" />
                {{ $t('actions.move-to-channel') }}
              </button>
            </div>
          </template>
        </div>
      </template>
    </Popover>

    <Popover
      :ref="`member-task-popover`"
      @apply-hide="isPopoverOpened['member-task'] = false"
      @show="isPopoverOpened['member-task'] = true"
      popover-class="add-who-task-wrapper"
    >
      <button
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('actions.add-member')
        }"
        class="btn btn-icon btn-sm"
        :disabled="!user.role.can('action.update') || action.loading"
      >
        <Icon family="far" name="user-plus" />
      </button>
      <template slot="popover">
        <AddWho
          v-if="isPopoverOpened['member-task']"
          :channel="channel"
          :users="action.users ? action.users : []"
          @save="
            e =>
              updateAction(action, e, 'members', () =>
                hidePopover(`member-task-popover`)
              )
          "
        />
      </template>
    </Popover>

    <Popover
      :ref="`duedate-task-popover`"
      @apply-hide="isPopoverOpened['duedate-task'] = false"
      @show="isPopoverOpened['duedate-task'] = true"
      popover-class="add-due-date-task-wrapper"
      :auto-hide="!lockAutocloseDueDatePopover"
    >
      <button
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('actions.forms.action-include-due-date')
        }"
        class="btn btn-icon btn-sm"
        :disabled="!user.role.can('action.update') || action.loading"
      >
        <Icon family="far" name="calendar-plus" />
      </button>
      <template slot="popover">
        <AddDueDate
          :key="`AddDueDate-${action}-${action.due_on_ts}`"
          :due_on="action.due_on ? action.due_on : ''"
          :errors="errors.duedate"
          @lock="toggleLockAutocloseDueDatePopover"
          @save="
            e =>
              updateAction(action, e, 'duedate', () =>
                hidePopover(`duedate-task-popover`)
              )
          "
        />
      </template>
    </Popover>

    <Popover
      :ref="`options-task-popover`"
      @apply-hide="isPopoverOpened['options-task'] = false"
      @show="isPopoverOpened['options-task'] = true"
    >
      <button
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('general.more-options')
        }"
        class="btn btn-icon btn-sm"
        :disabled="action.loading || !user.role.can('action.update')"
      >
        <Icon family="far" name="ellipsis-h" />
      </button>
      <template slot="popover">
        <div class="dropdown-items" v-if="isPopoverOpened['options-task']">
          <button
            v-close-popover
            class="dropdown-item d-none"
            :class="{ ['d-none']: action.parent_id !== null }"
            type="button"
            @click="onToggleExpand(action, index, true, true)"
            :disabled="!user.role.can('action.update')"
          >
            <Icon family="fal" name="layer-plus" />
            {{ $t('actions.add-subtask') }}
          </button>
          <button
            v-close-popover
            class="dropdown-item"
            v-if="root"
            type="button"
            @click="duplicateAction(action, 2)"
          >
            <Icon family="fal" name="arrow-alt-right" />
            {{ $t('actions.move-to-channel') }}
          </button>
          <button
            v-close-popover
            class="dropdown-item d-none"
            type="button"
            disabled
          >
            <Icon family="fal" name="line-columns" />
            {{ $t('actions.change-type') }}
          </button>
          <button
            v-close-popover
            class="dropdown-item"
            type="button"
            @click="() => showActionModal(action)"
          >
            <Icon family="fal" name="edit" />
            {{ $t('actions.forms.action-details') }}
          </button>
          <Popover class="header-option-delete-wrapper">
            <button class="dropdown-item" type="button">
              <Icon family="fal" name="trash" />
              {{ $t('general.delete') }}
            </button>
            <template slot="popover">
              <div class="dropdown-items">
                <div class="dropdown-text">
                  {{ $t('general.are-you-sure') }}
                </div>
                <button
                  v-close-popover
                  class="dropdown-item btn btn-danger"
                  type="button"
                  @click="() => onDeleteAction(action)"
                >
                  {{ $t('general.delete-now') }}
                </button>
              </div>
            </template>
          </Popover>
        </div>
      </template>
    </Popover>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Popover from 'airsend/components/Popover.vue';
import AddWho from './AddWho';
import AddDueDate from './AddDueDate';

export default {
  name: 'HeaderOptions',
  data() {
    return {
      lockAutocloseDueDatePopover: false,
      hoverActive: false,
      isPopoverOpened: {
        'duplicate-task': false,
        'member-task': false,
        'duedate-task': false,
        'options-task': false
      }
    };
  },
  computed: {
    user() {
      return this.$store.getters['core/getUser'](
        this.channel ? this.channel.id : null
      );
    },
    isTabContext() {
      return this.context === 'tab';
    },
    isTableContext() {
      return this.context === 'table';
    },
    isGridContext() {
      return this.context === 'grid';
    },
    isGridSubtaskContext() {
      return this.context === 'grid-subtask';
    },
    hasPopoverOpened() {
      return (
        this.isPopoverOpened['duplicate-task'] ||
        this.isPopoverOpened['member-task'] ||
        this.isPopoverOpened['duedate-task'] ||
        this.isPopoverOpened['options-task']
      );
    }
  },
  methods: {
    toggleLockAutocloseDueDatePopover(lock) {
      this.lockAutocloseDueDatePopover = lock;
    },
    showActionModal(action) {
      const _action = _.cloneDeep(action);
      console.log('showing action-create');
      this.$modal.show('action-create', {
        ..._action,
        context: 'edit'
      });
    },
    async onDeleteAction(action) {
      const response = await this.$store.dispatch('actions/delete', {
        ...action
      });
    },
    async duplicateAction(action, mode) {
      let _action = _.pick(_.cloneDeep(action), [
        'channel_id',
        'action_name',
        'action_desc',
        'action_type',
        'due_on',
        'due_on_ts',
        'users',
        'action_status',
        'parent_id'
      ]);
      if (action.due_on) {
        _action.action_due_date = action.due_on;
      }
      switch (mode) {
        case 0:
          {
            if (_action.parent_id === null) {
              delete _action.parent_id;
            }
            const res = await this.$store.dispatch('actions/create', _action);
          }
          break;
        case 1:
          {
            //Copy
            delete _action.channel_id;
            this.$modal.show('action-create', {
              ..._action,
              context: 'copy'
            });
          }
          break;
        case 2:
          {
            delete _action.channel_id;
            this.$modal.show('action-create', {
              ..._action,
              source_channel: action.channel_id,
              id: action.id,
              context: 'move'
            });
          }
          break;
      }
    },
    hidePopover(ref) {
      this.$refs[ref].hide();
    },

    async updateAction(action, event, type, success_callback = () => {}) {
      let _action = _.cloneDeep(action);
      let payload = { id: _action.id, action_name: _action.action_name };

      if (type === 'members') {
        let _users = _.cloneDeep(event);
        payload.user_ids = _users.length > 0 ? _users.map(user => user.id) : [];
      } else if (type === 'duedate') {
        let due_on = _.cloneDeep(event);
        payload.action_due_date = due_on;
      }
      const res = await this.$store.dispatch('actions/update', payload);
      if (res.ok) {
        success_callback();
        errors[type] = {};
      } else {
        errors[type] = res.error;
      }
    },
    onToggleExpand(
      action,
      index,
      forceState = null,
      showAddSubtaskForm = false
    ) {
      this.$emit('toggleExpand', {
        action,
        index,
        forceState,
        showAddSubtaskForm
      });
    }
  },
  props: {
    action: {
      type: Object,
      required: true
    },
    root: {
      type: Boolean,
      default: true
    },
    channel: {
      type: Object,
      required: true
    },
    errors: {
      type: Object
    },
    index: {
      type: Number
    },
    context: {
      type: String,
      required: true,
      validator: function(value) {
        return ['tab', 'table', 'grid', 'grid-subtask'].indexOf(value) !== -1;
      }
    }
  },
  components: {
    Icon,
    Popover,
    AddWho,
    AddDueDate
  }
};
</script>

<style></style>
