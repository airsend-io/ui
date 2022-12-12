import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default {
  namespaced: true,
  state: {},
  mutations: {
    set: (state, payload) => {
      const { endpoint, status } = payload;

      if (endpoint && typeof status !== undefined) {
        Vue.set(state, endpoint, status);
      }
    }
  },
  actions: {
    set(context, payload) {
      context.commit('set', payload);
    }
  }
};
