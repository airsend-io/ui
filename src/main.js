import Vue from 'vue';

import './plugins.js';
import './scss/base.scss';
import 'vue-popperjs/dist/vue-popper.css';

// vuex modules
import store from './store';
import router from './router';
import { i18n } from './i18n';

import App from './App.vue';

import scrollSpy, { Easing } from 'vue2-scrollspy';

import VueMasonry from 'vue-masonry-css';

import PortalVue from 'portal-vue';

Vue.use(scrollSpy, {
  easing: Easing.Cubic.In
});

Vue.use(PortalVue);

Vue.use(VueMasonry);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
  store,
  router,
  i18n
}).$mount('#app');
