<template>
  <div
    class="full-action-view-actions-body full-action-view-actions-body-table px-3"
    id="infinite-list"
  >
    <NestedTask
      :allowSort="false"
      v-model="contextActions"
      root
      class="task-list-wrapper"
      :context="isMobile ? 'tab' : 'table'"
      :showCompleted="true"
    />
  </div>
</template>

<script>
import NestedTask from './NestedTask';
import { isMobile } from 'airsend/utils';
export default {
  name: 'TableActions',
  computed: {
    fullActionFilters: {
      get() {
        return this.$store.state.actions.fullActionFilters;
      },
      set(value) {
        this.$store.dispatch('actions/setFullActionFilters', value);
      }
    },
    contextActions() {
      let actions = this.$store.state.actions.all;

      actions.forEach(action => {
        if (!action.meta) {
          action.meta = {};
        }
        action.meta.hide = false;
      });

      return actions.filter(action => action.meta.hide === false);
    },
    loadingAfter() {
      return this.$store.state.loading['actions/loading-after'];
    },
    hasNextPage() {
      return this.$store.state.actions.fullActionPagination.hasNextPage;
    },
    isMobile
  },
  methods: {
    async fetchTasks(cursor = null, paginateAfter = false) {
      console.log('TableActions -> fetchTask');

      let filters = this.fullActionFilters;

      filters.allActions = true;
      filters.cursor = cursor;
      filters.paginateAfter = paginateAfter;

      await this.$store.dispatch('actions/get', filters);
    }
  },
  watch: {
    fullActionFilters: {
      handler() {
        document.getElementById('infinite-list').scrollTop = 0;
      },
      deep: true
    }
  },
  components: {
    NestedTask
  },
  mounted() {
    const listElm = document.getElementById('infinite-list');
    listElm.addEventListener('scroll', event => {
      if (this.loadingAfter) return;
      if (
        listElm.scrollTop + listElm.clientHeight >=
          listElm.scrollHeight - 40 * 23 &&
        listElm.scrollTop != 0 &&
        this.hasNextPage
      ) {
        this.fetchTasks(
          this.contextActions[this.contextActions.length - 1].id,
          true
        );
      }
      if (listElm.scrollTop == 0) {
        //console.log("Top! fetching more data")
      }
    });
  }
};
</script>

<style></style>
