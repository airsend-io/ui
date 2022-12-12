<template>
  <div class="nested-task-wrapper">
    <div v-if="isTabContext || isGridSubtaskContext">
      <div v-if="root && loading" class="nested-task nested-task-root">
        <ActionTabLoader loading v-for="i in 6" :key="`task-loader-${i}`" />
      </div>
      <draggable
        v-if="!loading"
        v-bind="{
          ...dragOptions,
          group: { ...dragOptions.group, name: 'action-tab' }
        }"
        tag="div"
        class="nested-task"
        :class="{ ['nested-task-root']: root }"
        :id="parent && parent.id"
        :list="list"
        :value="value"
        @input="emitter"
        @end="endDrag"
        @start="startDrag"
        @filter="onFilter"
        :emptyInsertThreshold="18"
        filter=".task-pos-icons, .fa-caret-right, .fa-caret-down, .checkbox, .add-task-wrapper, .subtasks"
        handle=".task-pre-icons, .task-container"
        :data-action-parent-id="parent && parent.id"
      >
        <div
          class="task-single"
          :class="{
            ['task-single-root']: root,
            ['d-none']: hide,
            ['low-opacity']: action.meta.fade,
            ['highlight']: highlightedAction.id === action.id,
            ['complete-task-animation']: action.meta.removeTaskAnimation,
            ['new-task-animation']: action.meta.newTaskAnimation
          }"
          v-for="(action, index) in actions"
          :key="`${action.id}-tab-${action.updated_on_ts}`"
          :id="`${action.id}-${index}`"
        >
          <TaskTabView
            :action="action"
            :index="index"
            :errors="errors"
            :allowSort="allowSort"
            :channel="getChannelById(action.channel_id)"
            :parent="parent"
            @toggleExpand="onToggleExpand"
            @toggleActionStatus="toggleActionStatus"
          />
        </div>
      </draggable>
    </div>

    <div v-if="isTableContext" class="task-table-wrapper">
      <perfect-scrollbar>
        <div class="task-table-row task-table-row-title" v-if="root">
          <span class="task-table-col-title task-pre-icons-col"></span>
          <span class="task-table-col-title task-title-col">
            Name
            <Icon
              family="fas"
              name="caret-down"
              v-if="fullActionFilters.sort == 1"
            />
            <Icon
              family="fas"
              name="caret-up"
              v-if="fullActionFilters.sort == 2"
            />
          </span>
          <span class="task-table-col-title task-channel-col">
            Channel
            <Icon
              family="fas"
              name="caret-down"
              v-if="fullActionFilters.sort == 3"
            />
            <Icon
              family="fas"
              name="caret-up"
              v-if="fullActionFilters.sort == 4"
            />
          </span>
          <span class="task-table-col-title task-due-col">
            Due Date
            <Icon
              family="fas"
              name="caret-down"
              v-if="fullActionFilters.sort == 5"
            />
            <Icon
              family="fas"
              name="caret-up"
              v-if="fullActionFilters.sort == 6"
            />
          </span>
          <span class="task-table-col-title task-users-col">Users</span>
          <span class="task-table-col-title task-header-options-col"></span>
        </div>
        <div v-if="root && loading">
          <ActionTableLoader
            loading
            v-for="i in 10"
            :key="`task-loader-${i}`"
          />
        </div>
        <div
          v-if="!loading"
          class="nested-task"
          :class="{ ['nested-task-root']: root }"
        >
          <TaskTableView
            v-for="(action, index) in actions"
            :class="{ ['d-none']: hide }"
            :key="action.id"
            :id="`${action.id}-action-row`"
            :action="action"
            :index="index"
            :errors="errors"
            :allowSort="allowSort"
            :channel="getChannelById(action.channel_id)"
            :parent="parent"
            @toggleExpand="onToggleExpand"
            @toggleActionStatus="toggleActionStatus"
          />
        </div>
        <div v-if="root && hasNextPage">
          <ActionTableLoader loading v-for="i in 3" :key="`task-loader-${i}`" />
        </div>
      </perfect-scrollbar>
    </div>
    <div v-if="isGridContext" class="task-grid-wrapper">
      <div class="nested-task nested-task-root" v-if="root && loading">
        <ActionGridLoader loading v-for="i in 5" :key="`task-loader-${i}`" />
      </div>
      <draggable
        v-if="!loading"
        v-bind="{
          ...dragOptions,
          swapThreshold: 0.4,
          group: {
            ...dragOptions.group,
            name: 'action-grid',
            revertClone: true
          }
        }"
        tag="div"
        class="nested-task"
        :class="{
          ['nested-task-root']: root
        }"
        :id="parent && parent.id"
        :list="list"
        :value="value"
        @input="emitter"
        @end="endDrag"
        @start="startDrag"
        @drag="e => $emit('drag', e)"
        :clone="onClone"
        :emptyInsertThreshold="8"
        handle=".task-header"
        filter=".task-pos-icons, .checkbox"
        :data-action-parent-id="parent && parent.id"
      >
        <div
          class="task-single task-single-grid"
          :class="{
            ['task-single-root']: root,
            ['d-none']: hide,
            ['low-opacity']: action.meta.fade,
            ['task-single-subtask']: !root,
            ['highlight']: highlightedAction.id === action.id
          }"
          v-for="(action, index) in actions"
          :key="`${action.id}-grid-${action.updated_on_ts}`"
          :id="`${action.id}-${index}`"
        >
          <TaskGridView
            :action="action"
            :index="index"
            :errors="errors"
            :allowSort="allowSort"
            :channel="getChannelById(action.channel_id)"
            :parent="parent"
            @toggleExpand="onToggleExpand"
            @toggleActionStatus="toggleActionStatus"
          />
        </div>
      </draggable>
    </div>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Avatar from 'airsend/components/Avatar';
import Loader from 'airsend/components/Loader';
import Popover from 'airsend/components/Popover.vue';
import draggable from 'vuedraggable';
import moment from 'moment';
import _ from 'lodash';
import AddWho from './AddWho';
import AddDueDate from './AddDueDate';
import AddAction from './AddAction';
import { EventBus } from 'airsend/event-bus';

export default {
  name: 'NestedTask',
  props: {
    value: {
      required: false,
      type: Array,
      default: null
    },
    list: {
      required: false,
      type: Array,
      default: null
    },
    root: {
      required: false,
      type: Boolean,
      default: false
    },
    hide: {
      required: false,
      type: Boolean,
      default: false
    },
    addSubtask: {
      required: false,
      type: Boolean,
      default: false
    },
    parent: {
      type: Object,
      required: false,
      default: null
    },
    allowSort: {
      type: Boolean,
      required: false,
      default: true
    },
    context: {
      type: String,
      required: true,
      validator: function(value) {
        return ['tab', 'table', 'grid', 'grid-subtask'].indexOf(value) !== -1;
      }
    },
    showCompleted: {
      type: Boolean
    }
  },
  data() {
    return {
      newAction: {
        name: ''
      },
      lockAutocloseDueDatePopover: false,
      errors: {
        duedate: {}
      }
    };
  },
  methods: {
    async toggleActionStatus(e) {
      const { value, action, index } = e;
      const payload = {
        id: action.id,
        action_status: value ? 1 : 0,
        action_name: action.action_name
      };
      if (value === !!action.action_status) {
        return;
      }
      action.action_status = value ? 1 : 0;

      let element = null;

      const response = await this.$store.dispatch('actions/update', payload);
      this.$store.dispatch('actions/setMeta', {
        ...action,
        meta: { ...action.meta, animationInProgress: false }
      });
      if (!response.ok) {
        action.action_status = !value;
      } else if (response.ok && value === true) {
        EventBus.$emit('action-completed');
      }
    },
    onClone(original) {
      return { ...original, updated_on_ts: moment().unix() };
    },
    onToggleExpand(event) {
      const { action, index, forceState, showAddSubtaskForm } = event;
      let _action = _.cloneDeep(action);

      _action.meta.expanded =
        forceState !== null ? forceState : !_action.meta.expanded;
      _action.meta.addSubtask = showAddSubtaskForm;

      let payload = {
        id: action.id,
        parent_id: action.parent_id,
        channel_id: action.channel_id,
        meta: _action.meta
      };
      this.$store.dispatch('actions/setMeta', payload);
    },
    emitter(value) {
      this.$emit('input', value);
    },
    startDrag(event) {
      this.$store.dispatch('actions/setDragging', true);
    },
    async endDrag(event) {
      const { to, from, item } = event; //newIndex get the incorrect value when moving between lists

      setTimeout(() => {
        //drag event is beeing throttled, the last 'drag' event occours after the 'enddrag' event. this will delay this event in 60ms
        this.$store.commit('actions/setSubtaskDragContext', false);
      }, 60);

      // if (to.classList.contains('action-dropzone')) {
      //   await this.$store.dispatch('actions/setUsingDragZone', true);
      //   return;
      // }

      this.$store.dispatch('actions/setDragging', false);
      const action_id = item.id.split('-')[0];
      let response;

      let channel_id;
      if (this.fullActionFilters.channel_id) {
        channel_id = this.fullActionFilters.channel_id;
      } else if (this.$route.params.id) {
        channel_id = this.$route.params.id;
      }

      if (event.pullMode === 'clone') {
        const parent_id = event.srcElement.getAttribute(
          'data-action-parent-id'
        ); //nested-task from where the element come;

        this.$store.commit('actions/delete', {
          parent_id: parseInt(parent_id),
          action_id: parseInt(action_id),
          channel_id: parseInt(channel_id)
        });
      }

      if (
        this.isTabContext ||
        this.isGridContext ||
        this.isGridSubtaskContext
      ) {
        const channelActions = this.$store.getters[
          'actions/getActionsByChannel'
        ](channel_id);
        let newIndex = 0;
        const fromRoot = event.srcElement.classList.contains(
          'nested-task-root'
        );

        //UPDATE BACKEND
        //to root
        if (to.classList.contains('nested-task-root')) {
          if (fromRoot && event.oldIndex === event.newIndex) return; //moving to same position

          newIndex = _.findIndex(channelActions, el => el.id == action_id);
          const after =
            newIndex - 1 >= 0 ? channelActions[newIndex - 1].id : null;
          response = await this.$store.dispatch('actions/move', {
            action_id,
            after
          });
        }
        //to nested
        else if (!to.classList.contains('nested-task-root')) {
          if (
            !fromRoot &&
            event.oldIndex === event.newIndex &&
            event.from == event.to
          )
            return; //moving to same position

          const under = to.id;
          const underAction = channelActions.find(action => action.id == under);
          underAction.meta.expanded = true;
          const after =
            event.newIndex - 1 >= 0
              ? underAction.children[event.newIndex - 1].id
              : null;
          response = await this.$store.dispatch('actions/move', {
            action_id,
            under,
            after
          });
        }
      } else {
        return;
      }

      if (!response.ok) {
        //cannot cancel this event
        this.$store.dispatch('actions/get', this.$route.params.id);
      }
    },
    moveCallback(event) {
      if (!this.allowSort) return false;
      if (event.draggedContext.element.id == this.highlightedAction.id) {
        this.$store.dispatch('actions/setHighlightAction', null);
      }
      const isRootWithChildren =
        event.draggedContext.element.children.length > 0;

      const movingToNestedTask = !event.to.classList.contains(
        'nested-task-root'
      );

      //prevent 3 level nested
      if (isRootWithChildren && movingToNestedTask) {
        return false;
      }

      if (isRootWithChildren) return true; //ignore subtask area (subtaskDragContext)

      if (
        this.subtaskDragContext && //mouse over subtask area
        !movingToNestedTask //moving root task
      ) {
        return false;
      }

      return true;
    },
    getChannelById(channel_id) {
      return this.$store.getters['channels/getChannelById'](channel_id);
    },
    pullCallback(e) {
      if (
        (this.isGridContext || this.isGridSubtaskContext) &&
        e.options.group.name === 'action-tab'
      )
        return 'clone';
      if (e.options.group.name === 'action-grid') return true;

      //if (e.options.group.name === 'action') return true;
      //else if (e.options.group.name === 'trash') return 'clone';
      //else if (e.options.group.name === 'share') return 'clone';
      return true;
    },
    onFilter(e) {
      if (e.srcElement.classList.contains('add-task-wrapper')) {
        e.srcElement.childNodes[1].focus();
      }
    }
  },
  computed: {
    dragOptions() {
      return {
        animation: 100,
        ghostClass: 'ghost-task',
        chosenClass: 'choosen-task',
        dragClass: 'drag-task',
        move: e => this.moveCallback(e),
        disabled: !this.allowSort,
        swapThreshold: 0.2,
        invertSwap: false,
        group: { name: 'action', pull: e => this.pullCallback(e), put: true }
      };
    },
    subtaskDragContext() {
      return this.$store.state.actions.isSubtaskDragContext;
    },
    loadingAfter() {
      return this.$store.state.loading['actions/loading-after'];
    },
    hasNextPage() {
      return this.$store.state.actions.fullActionPagination.hasNextPage;
    },
    loading() {
      return this.$store.state.loading['actions/loading'];
    },
    actions() {
      return this.value ? this.value : this.list;
    },
    fullActionFilters() {
      return this.$store.state.actions.fullActionFilters;
    },
    channels() {
      return this.$store.state.channels.all;
    },
    highlightedAction() {
      return this.$store.state.actions.highlightedAction;
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
    }
  },
  components: {
    Avatar,
    Icon,
    Popover,
    AddWho,
    AddDueDate,
    AddAction,
    Loader,
    draggable,
    ActionTabLoader: () => import('airsend/components/ActionTabLoader'),
    ActionTableLoader: () => import('airsend/components/ActionTableLoader'),
    ActionGridLoader: () => import('airsend/components/ActionGridLoader'),
    TaskTabView: () => import('./templates/TaskTabView'),
    TaskTableView: () => import('./templates/TaskTableView'),
    TaskGridView: () => import('./templates/TaskGridView')
  }
};
</script>

<style></style>
