import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default {
  namespaced: true,
  state: {
    channels: new Worker(new URL('../../workers/channels.worker.js', import.meta.url), {
      type: 'module'
    }),
    actions: new Worker(new URL('../../workers/actions.worker.js', import.meta.url), { type: 'module' })
  },
  actions: {
    // init and bind events
    init(context) {
      context.state.channels.addEventListener('message', event => {
        const { type, data, commit, root } = event.data;
        if (commit) {
          this.commit(type, data, { root });
        } else {
          this.dispatch(type, data, { root });
        }
      });

      context.state.actions.addEventListener('message', event => {
        const { type, data, commit } = event.data;
        if (commit) {
          this.commit(type, data);
        } else {
          this.dispatch(type, data);
        }
      });
    }
  }
};
