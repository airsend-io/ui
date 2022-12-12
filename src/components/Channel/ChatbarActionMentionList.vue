<template>
  <ul
    class="popover-mention"
    :class="{ hidden: query[0] == ' ' || query[0] == '#' }"
  >
    <li
      :class="{ 'is-selected': index === selectedIndex }"
      v-for="(item, index) in filteredActions"
      :key="index"
    >
      <a @click="selectItem(index)">
        <div class="avatar"><Icon family="fas" name="bolt" /></div>
        {{ item.name }}
      </a>
    </li>

    <li v-if="filteredActions.length === 0">
      <a @click="onClickAddAction">
        <div class="avatar"><Icon family="fas" name="plus" /></div>
        {{
          $t(
            query !== '' ? 'actions.add-action-filled' : 'actions.add-action',
            { actionName: query }
          )
        }}
      </a>
    </li>

    <div
      class="popover-mention-loading"
      v-if="isLoading && filteredActions.length > 0"
    >
      {{ $t('general.loading') }}
    </div>
  </ul>
</template>

<script>
import _ from 'lodash';
import Fuse from 'fuse.js';

import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';

export default {
  components: {
    Avatar,
    Icon
  },
  props: {
    query: {
      type: String
    },
    items: {
      type: Array,
      required: true
    },
    command: {
      type: Function,
      required: true
    }
  },

  computed: {
    actions() {
      const inMemoryActions = this.$store.getters[
        'actions/getActionsByChannel'
      ](this.$parent.channel.id);

      let resources = [];

      if (inMemoryActions.length > 0) {
        // Add all tasks that the user is seeing (tasks and subtasks of expanded tasks)
        inMemoryActions.forEach(action => {
          resources.push({
            id: action.id,
            name: action.action_name
          });
          if (action.meta.expanded) {
            action.children.forEach(child => {
              resources.push({
                id: action.id,
                name: child.action_name
              });
            });
          }
        });
      }

      return resources;
    },

    filteredActions() {
      if (this.remoteResourceList) return this.remoteResourceList.slice(0, 5);
      else if (this.query !== '') {
        const fuse = new Fuse(this.actions, {
          threshold: 0.2,
          includeScore: true,
          keys: ['name']
        });

        const results = fuse.search(this.query).filter(item => {
          return item.score < 0.1;
        });

        return results.slice(0, 5).map(({ item }) => item);
      } else {
        return this.actions.slice(0, 5);
      }
    }
  },

  data() {
    return {
      selectedIndex: 0,
      isLoading: false,
      lastQuery: '',
      remoteResourceList: null,
      requestTimeout: null
    };
  },

  watch: {
    query(newVal) {
      this.debouncedFetchMentionableResource(newVal);
      this.selectedIndex = 0;
    }
  },

  methods: {
    onKeyDown({ event }) {
      if (this.filteredActions.length === 0) return false;

      if (event.key === 'ArrowUp') {
        this.upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        this.downHandler();
        return true;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        this.enterHandler();
        return true;
      }

      return false;
    },

    upHandler() {
      this.selectedIndex =
        (this.selectedIndex + this.filteredActions.length - 1) %
        this.filteredActions.length;
    },

    downHandler() {
      this.selectedIndex =
        (this.selectedIndex + 1) % this.filteredActions.length;
    },

    enterHandler() {
      this.selectItem(this.selectedIndex);
    },

    selectItem(index) {
      const item = this.filteredActions[index];

      if (item) {
        this.command(item);
      }
    },

    async fetchMentionableResource(query) {
      if (
        this.filteredActions.length === 0 &&
        this.lastQuery.length > query.length
      ) {
        this.isLoading = false;
        return;
      }

      if (!query || query === '') {
        this.lastQuery = '';
        this.remoteResourceList = null;
      } else if (query !== this.lastQuery) {
        this.isLoading = true;
        const responseActions = await this.$store.dispatch(
          'actions/searchMentionableActions',
          { channel_id: this.$parent.channel.id, query }
        );
        this.remoteResourceList = responseActions;
        this.lastQuery = query || '';
      }

      this.isLoading = false;
    },

    debouncedFetchMentionableResource(query) {
      if (query !== '') {
        this.isLoading = true;
      }

      clearTimeout(this.requestTimeout);
      this.requestTimeout = setTimeout(
        () => {
          this.fetchMentionableResource(query);
        },
        query !== '' ? 250 : 0
      );
    },

    onClickAddAction() {
      this.$router.push(`/channel/${this.$parent.channel.id}/actions`);
      this.$modal.show('action-create', {
        context: 'create',
        message: { content: this.message },
        name: this.query
      });
    }
  }
};
</script>
