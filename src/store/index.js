import Vuex from 'vuex';

// modules
import core from './modules/core.js'; // auth and general app handling
import websocket from './modules/websocket.js'; // auth and general app handling
import chat from './modules/chat.js'; // chat related (message store, quote, files)
import loading from './modules/loading.js'; // loading states
import channels from './modules/channels.js'; // handle channel details and history
import files from './modules/files.js'; // handle files details and uploads
import wiki from './modules/wiki.js'; // handle wiki details and uploads
import actions from './modules/actions.js'; // handle actions
import alerts from './modules/alerts.js'; // handle alerts
import workers from './modules/workers.js'; // handle workers
import meeting from './modules/meeting.js'; // handle meetings
import teams from './modules/teams.js'; //handle teams

const store = new Vuex.Store({
  namespaced: true,
  modules: {
    core,
    websocket,
    loading,
    channels,
    chat,
    files,
    wiki,
    actions,
    alerts,
    workers,
    meeting,
    teams
  }
});

// handle state loading
store.subscribeAction({
  before: action => {
    store.commit('loading/set', { endpoint: action.type, status: true });
  },
  after: action => {
    store.commit('loading/set', { endpoint: action.type, status: false });
  }
});

export default store;
