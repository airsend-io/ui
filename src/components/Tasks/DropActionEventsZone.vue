<template>
  <div
    class="drop-actions-events-wrapper"
    v-show="isDragging || isUsingDragZone"
  >
    <transition name="actionEventsAnimation">
      <div
        class="drop-actions-events-body"
        v-if="isDragging || isUsingDragZone"
      >
        <div class="drop-actions-events">
          <draggable
            v-bind="shareOptions"
            v-model="shareTasks"
            class="action-dropzone action-share-zone"
          >
            <Icon family="fas" name="share-alt" />
            <span>Delete</span>
          </draggable>
          <Popover ref="trash-popover" class="action-dropzone">
            <draggable
              v-bind="trashOptions"
              v-model="trashCan"
              class="action-dropzone action-trash-zone"
              @add="e => addCallback(e, 'trash')"
            >
              <Icon family="fas" name="trash" />
              <span>Share</span>
            </draggable>
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
        <div class="drop-actions-text">
          <span>Drop your task to one of the shortcuts above</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import _ from 'lodash';
import draggable from 'vuedraggable';
import Icon from 'airsend/components/Icon';
import Popover from 'airsend/components/Popover.vue';
export default {
  data() {
    return {
      trashCan: [],
      shareTasks: []
    };
  },
  components: {
    draggable,
    Icon,
    Popover
  },
  methods: {
    addCallback(event, type) {
      const { item } = event;
      const actions = this.$store.getters['actions/getActionsByChannel'](
        this.fullActionFilters.channel_id
      );
      const actionId = item.id.split('-')[0];
      if (type === 'trash') {
        console.log(this.$refs['trash-popover']);
        this.$refs['trash-popover'].show();
      }
    },
    onDeleteAction(action) {}
  },
  computed: {
    isDragging() {
      return this.$store.state.actions.isDragging;
    },
    isUsingDragZone() {
      return this.$store.state.actions.isUsingDragZone;
    },
    fullActionFilters() {
      return this.$store.state.actions.fullActionFilters;
    },
    trashOptions() {
      return {
        group: {
          name: 'trash',
          draggable: '.d-none',
          put: ['action'],
          pull: false,
          revertClone: true
        }
      };
    },
    shareOptions() {
      return {
        group: {
          name: 'share',
          draggable: '.d-none',
          put: ['action'],
          pull: false,
          revertClone: true
        }
      };
    }
  }
};
</script>

<style></style>
