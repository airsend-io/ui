import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default {
  namespaced: true,
  state: {
    message: '',
    quote: null,
    files: null
  },
  mutations: {
    setMessage: (state, payload) => {
      Vue.set(state, 'message', payload);
    },
    setQuote: (state, payload) => {
      Vue.set(state, 'quote', payload);
    },
    setFiles: (state, payload) => {
      Vue.set(state, 'files', payload);
    }
  },
  actions: {
    sendMessage() {
      console.log('SENDING MESSAGE!');
    }
  }
};
