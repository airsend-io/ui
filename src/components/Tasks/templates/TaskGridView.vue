<template>
  <fragment>
    <div class="task" @click="event => showActionModal(event, action)">
      <div class="task-header">
        <div class="task-pre-icons">
          <div class="grip">
            <Loader
              v-if="loading || action.meta.loading"
              loading
              class="grip-loading"
            />
            <Icon
              v-else
              family="fas"
              name="grip-vertical"
              :class="{ ['disabled']: !allowSort }"
              v-tooltip="
                allowSort ? '' : 'Sorting allowed only when sorting by Channel'
              "
            />
          </div>
          <Checkbox
            :checked="!!action.action_status"
            @change="v => toggleActionStatus(v, action, index)"
          />
        </div>

        <div class="task-title">
          <EditableTaskTitle :action="action" />
        </div>

        <div class="task-header-options">
          <HeaderOptions
            :action="action"
            :channel="channel"
            :errors="errors"
            :index="index"
            :context="'grid'"
            :root="root"
            @toggleExpand="
              e =>
                onToggleExpand(
                  e.action,
                  e.index,
                  e.forceState,
                  e.showAddSubtaskForm
                )
            "
          />
        </div>
      </div>

      <div
        class="task-body"
        v-if="
          action.action_desc ||
            action.due_on ||
            (action.users && action.users.length > 0) ||
            (action.highlights && action.highlights.length > 0)
        "
      >
        <div class="task-description" v-if="action.action_desc">
          <span class="title">Description</span>
          <span class="value">{{ action.action_desc }}</span>
        </div>
        <div
          class="highlights"
          v-if="
            action.highlights &&
              action.highlights.desc &&
              action.highlights.desc.length > 0
          "
        >
          <span
            v-for="(highlight, i) in action.highlights.desc"
            :key="i"
            v-html="highlight"
          ></span>
        </div>

        <div class="task-due" v-if="action.due_on">
          <div
            class="due-date"
            :class="{ [getDue(action.due_on).class]: !action.action_status }"
          >
            <span>{{ getDue(action.due_on).text }}</span>
          </div>
        </div>

        <div class="task-users" v-if="action.users && action.users.length > 0">
          <fragment>
            <div class="users-icons avatar-list">
              <div
                class="avatar-wrapper"
                v-for="user in action.users.length === 3
                  ? action.users.slice(0, 3)
                  : action.users.slice(0, 2)"
                :key="`${user.id}-task-icon-${action.id}`"
              >
                <Avatar
                  :name="user.display_name"
                  :user-id="parseInt(user.id)"
                  :has-avatar="user.has_avatar"
                  :cache="0"
                  size="small"
                />
              </div>
              <div v-if="action.users.length > 3" class="avatar-wrapper">
                <div class="avatar">+{{ action.users.length - 2 }}</div>
              </div>
            </div>
            <v-popover>
              <small
                class="users-list"
                :class="{
                  'users-list--me': amIAssigned(action, action.id)
                }"
              >
                <span class="user-name" v-if="amIAssigned(action, action.id)"
                  >You</span
                >
                <span class="user-name" v-else>{{
                  action.users[0].display_name
                }}</span>
                <span v-if="action.users.length > 1">
                  and {{ action.users.length - 1 }} more</span
                >
              </small>
              <template slot="popover">
                <perfect-scrollbar class="popover-people">
                  <li
                    v-for="user in action.users"
                    :key="user.id"
                    class="popover-people-single"
                  >
                    <Avatar
                      :name="user.display_name"
                      :user-id="parseInt(user.id)"
                      :has-avatar="user.has_avatar"
                      :cache="0"
                      size="medium"
                    />
                    <div class="popover-people-description">
                      {{ user.display_name }}
                    </div>
                  </li>
                </perfect-scrollbar>
              </template>
            </v-popover>
          </fragment>
        </div>
      </div>
    </div>

    <div class="subtask">
      <AddAction
        :parent_id="action.id"
        :channel_id="channel.id"
        @hide-add-task-form="() => onToggleExpand(action, index, true, false)"
        :tooltip="$t('actions.add-task-tip')"
      />
      <NestedTask
        :list="action.children"
        :parent="action"
        context="grid-subtask"
        :channel="channel"
      />
    </div>
  </fragment>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Checkbox from 'airsend/components/Checkbox';
import Avatar from 'airsend/components/Avatar';
import Loader from 'airsend/components/Loader';
import Popover from 'airsend/components/Popover.vue';
import { parseTime } from 'airsend/utils';
import draggable from 'vuedraggable';
import moment from 'moment';
import _ from 'lodash';
import AddAction from '../AddAction';
import EditableTaskTitle from '../EditableTaskTitle';
import HeaderOptions from '../HeaderOptions';

import Common from './common';

export default {
  name: 'TaskGridView',
  mixins: [Common],
  computed: {
    root() {
      return this.parent === null;
    },
    user() {
      return this.$store.getters['core/getUser'](
        this.channel ? this.channel.id : null
      );
    },
    loading() {
      return (
        this.$store.state.loading['actions/move'] ||
        this.$store.state.loading['actions/update']
      );
    },
    highlightedAction() {
      return this.$store.state.actions.highlightedAction;
    }
  },
  methods: {
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
    },
    showActionModal(event, action) {
      if (
        event.target.nodeName === 'BUTTON' ||
        event.target.nodeName === 'INPUT' ||
        event.target.nodeName === 'I' ||
        event.target.classList.contains('user-name')
      ) {
        event.stopPropagation();
        return;
      }
      const _action = _.cloneDeep(action);
      this.$modal.show('action-create', {
        ..._action,
        context: 'edit'
      });
    },
    toggleActionStatus(v, action, index) {
      this.$emit('toggleActionStatus', { value: v, action, index });
    },
    hidePopover(ref) {
      this.$refs[ref][0].hide();
    },
    openPopover(ref) {
      this.$refs[ref][0].show();
      let className = `${ref.split('-')[0]}-force-show`;
      this.$refs[ref][0].$el.parentNode.classList // //task-pos-icons
        .add(className);
    },
    onPopoverHide(ref) {
      return;
      let className = `${ref.split('-')[0]}-force-show`;
      this.$refs[ref][0].$el.parentNode.classList // //task-pos-icons
        .remove(className);
    }
  },
  props: {
    action: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    errors: {
      type: Object
    },
    parent: {
      type: Object,
      default: null
    },
    allowSort: {
      type: Boolean,
      default: true
    },
    channel: {
      type: Object,
      required: true
    }
  },
  components: {
    Avatar,
    Icon,
    Popover,
    AddAction,
    Loader,
    draggable,
    Checkbox,
    EditableTaskTitle,
    NestedTask: () => import('../NestedTask.vue'), //prevent Circular References Between Components
    HeaderOptions
  }
};
</script>

<style></style>
