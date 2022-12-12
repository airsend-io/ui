<template>
  <div class="sidebar-tab-header">
    <div class="first-line" v-if="user.id">
      <div class="filters">
        <button
          class="btn"
          @click="emitter('onFullView')"
          v-if="isActionsContext"
        >
          <Icon family="far" name="expand" />
          <span>{{ $t('actions.view-board') }}</span>
        </button>

        <fragment v-if="isFilesContext">
          <button
            class="btn btn-primary"
            @click="emitter('onUpload')"
            :disabled="value.type === 'links'"
          >
            <Icon family="far" name="plus" />
            <span>{{ $t('files.upload') }}</span>
          </button>
          <button
            class="btn expand"
            @click="emitter('onFullView')"
            :disabled="value.type !== ''"
          >
            <Icon family="far" name="expand" />
            <span>{{ $t('files.expand') }}</span>
          </button>
        </fragment>
      </div>
    </div>
    <div class="second-line">
      <div class="form-group row">
        <input
          ref="input"
          v-model="value.search"
          @input="() => onUpdateFilters('search')"
          class="form-control form-control--rounded form-control-sm"
          type="text"
          :placeholder="
            isActionsContext
              ? $t('actions.search-actions')
              : $t('files.search-files')
          "
          aria-label="Search"
          :disabled="value.type === 'links'"
        />
        <Icon family="far" name="search" />
      </div>
      <div class="filters">
        <button
          v-if="isActionsContext"
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('actions.my-actions')
          }"
          class="btn btn-icon btn-sm"
          :class="{ active: value.user_id }"
          @input="() => onUpdateFilters('user_id')"
          @click="
            () => {
              value.user_id = value.user_id ? null : user.id;
            }
          "
        >
          <div class="has-mini-icon">
            <Icon family="far" name="bolt" />
            <Icon family="far" name="user" class="mini" />
          </div>
        </button>
        <button
          v-if="isActionsContext"
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('actions.sort-by-due-date')
          }"
          @click="toggleSortByDue"
          @input="() => onUpdateFilters('sort')"
          class="btn btn-icon btn-sm"
          :class="{
            active: value.sort == 5 || value.sort == 6
          }"
        >
          <div class="has-mini-icon">
            <Icon family="far" name="calendar-day" />
            <Icon
              family="fas"
              name="caret-up"
              v-if="value.sort == 6"
              class="mini"
            />
            <Icon
              family="fas"
              name="caret-down"
              v-if="value.sort == 5"
              class="mini"
            />
          </div>
        </button>
        <button
          v-if="isActionsContext"
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('actions.view-completed')
          }"
          id="completed-only-button"
          class="btn btn-icon btn-sm"
          :class="{
            active: value.action_status,
            ['has-action-completed']: showCompletedActionsBubble
          }"
          @input="() => onUpdateFilters('action_status')"
          @click="
            () => {
              value.action_status = value.action_status ? 0 : 1;
            }
          "
        >
          <Icon family="far" name="check" />
        </button>

        <Popover popover-class="files-filters-settings" v-if="isFilesContext">
          <button
            type="button"
            class="btn btn-icon btn-sm"
            :disabled="value.type === 'links'"
          >
            <Icon family="far" name="sort-amount-down" />
          </button>
          <template slot="popover">
            <div class="dropdown-items">
              <div class="dropdown-title">
                <span>{{ $t('channels.filters.sorting') }}</span>
              </div>
              <button
                v-close-popover
                class="dropdown-item"
                type="button"
                @click="
                  () => {
                    value.sort_by = 'updated_on';
                    onUpdateFilters('sort_by');
                  }
                "
              >
                <Icon
                  family="fal"
                  name="check"
                  :class="{ active: value.sort_by === 'updated_on' }"
                />{{ $t('files.filters.sort-by-activity') }}
              </button>
              <button
                v-close-popover
                class="dropdown-item"
                type="button"
                @click="
                  () => {
                    value.sort_by = 'name';
                    onUpdateFilters('sort_by');
                  }
                "
              >
                <Icon
                  family="fal"
                  name="check"
                  :class="{ active: value.sort_by === 'name' }"
                />{{ $t('files.filters.sort-by-name') }}
              </button>

              <fragment v-if="value.type === ''">
                <div class="dropdown-title">
                  <span>{{ $t('general.view') }}</span>
                </div>
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  @click="
                    () => {
                      value.gridView = true;
                      onUpdateFilters('gridView');
                    }
                  "
                >
                  <Icon
                    family="fal"
                    name="check"
                    :class="{ active: value.gridView }"
                  />{{ $t('files.filters.grid-view') }}
                </button>
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  @click="
                    () => {
                      value.gridView = false;
                      onUpdateFilters('gridView');
                    }
                  "
                >
                  <Icon
                    family="fal"
                    name="check"
                    :class="{ active: !value.gridView }"
                  />{{ $t('files.filters.list-view') }}
                </button>
              </fragment>
            </div>
          </template>
        </Popover>
      </div>
    </div>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Popover from 'airsend/components/Popover.vue';
export default {
  data() {
    return {};
  },
  props: {
    context: {
      type: String,
      required: true,
      validator: function(value) {
        return ['actions', 'files'].indexOf(value) !== -1;
      }
    },
    value: {
      type: Object,
      required: true
    }
  },
  methods: {
    onUpdateFilters(type) {
      this.$emit('input', { type, value: this.value });
    },
    toggleSortByDue() {
      const filters = this.value;
      if (filters.sort != 5 && filters.sort != 6) {
        this.value.sort = 5;
      } else if (filters.sort == 5) this.value.sort = 6;
      else if (filters.sort == 6) this.value.sort = 3;
    },
    emitter(event) {
      this.$emit(event);
    }
  },
  computed: {
    isActionsContext() {
      return this.context === 'actions';
    },
    isFilesContext() {
      return this.context === 'files';
    },
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    user() {
      return this.$store.getters['core/getUser'](
        this.channel ? this.channel.id : null
      );
    },
    actions() {
      return this.$store.getters['actions/getActionsByChannel'](
        this.channel.id
      );
    },
    showCompletedActionsBubble() {
      if (this.isFilesContext) return false;

      return this.actions.some(action => {
        if (action.meta.hide) {
          return true;
        } else {
          return action.children.some(child => {
            return child.meta.hide;
          });
        }
      });
    }
  },
  components: {
    Icon,
    Popover
  }
};
</script>

<style></style>
