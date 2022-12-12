<template>
  <fragment>
    <div class="subtask-drag-area" ref="subtask-drag-area" v-if="isDragging" />
    <NestedTask
      v-model="contextActions"
      root
      class="task-list-wrapper"
      :class="{ 'subtask-drag-context': subtaskDragContext }"
      context="grid"
      :allowSort="allowUserSort"
    />
    <button class="btn btn-icon horizontal-scroll-button" v-if="false">
      <Icon family="fad" name="forward" />
    </button>
    <div v-if="false">
      <DropActionEventsZone />
    </div>
  </fragment>
</template>

<script>
import NestedTask from './NestedTask';
import Icon from 'airsend/components/Icon';
import DropActionEventsZone from './DropActionEventsZone';

export default {
  props: {
    channel_id: {
      type: Number,
      required: true
    }
  },
  mounted() {
    window.document.addEventListener('drag', this.onDragOverSubtaskArea);
  },
  beforeDestroy() {
    window.document.removeEventListener('drag', this.onDragOverSubtaskArea);
  },
  methods: {
    onDragOverSubtaskArea: _.throttle(function(e) {
      //ignore for root elements with childs
      if (e.srcElement.classList.contains('task-single-root')) {
        //root element

        let action_id = parseInt(e.srcElement.id.split('-')[0]);
        let action = this.$store.getters['actions/getActionById']({
          channel_id: this.channel_id,
          id: action_id
        });
        if (action && action.children.length > 0) {
          return;
        }
      }
      var rect = {};
      if (this.$refs['subtask-drag-area'])
        rect = this.$refs['subtask-drag-area'].getBoundingClientRect();
      if (e.clientY > rect.top && e.clientY < rect.bottom)
        this.$store.commit('actions/setSubtaskDragContext', true);
      else this.$store.commit('actions/setSubtaskDragContext', false);
    }, 41) //24 fps
  },
  computed: {
    allowUserSort() {
      return this.fullActionFilters.sort == 3 && this.action_status == null;
    },
    fullActionFilters() {
      return this.$store.state.actions.fullActionFilters;
    },
    isActionsEmpty() {
      return this.contextActions.every(action => action.meta.hide === true);
    },
    channel() {
      return this.$store.getters['channels/getChannelById'](this.channel_id);
    },
    subtaskDragContext() {
      return this.$store.state.actions.isSubtaskDragContext;
    },
    isDragging() {
      return this.$store.state.actions.isDragging;
    },
    contextActions: {
      get() {
        let actions;
        if (!this.channel) actions = [];
        else {
          actions = this.$store.getters['actions/getActionsByChannel'](
            this.channel.id
          );
          //actions = _.cloneDeep(actions)
        }

        if (!actions) return [];
        actions.forEach(action => {
          if (!action.meta) {
            action.meta = {};
          }
          action.meta.hide = false;
        });

        actions.forEach(action => {
          if (action.meta.expanded === undefined) {
            action.meta.expanded = action.meta.hasRelevantChildren;
          }
        });

        return actions;
      },
      set(value) {
        this.$store.dispatch('actions/updateActionsList', {
          channel: this.channel,
          value: value
        });
      }
    }
  },
  components: {
    DropActionEventsZone,
    NestedTask,
    Icon
  }
};
</script>

<style></style>
