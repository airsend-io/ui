import Vue from 'vue';
import VModal from 'vue-js-modal';
import VueObserveVisibility from 'vue-observe-visibility';
import VueVirtualScroller from 'vue-virtual-scroller';
import PerfectScrollbar from 'vue2-perfect-scrollbar';
import Croppa from 'vue-croppa';
import VTooltip from 'v-tooltip';
import Fragment from 'vue-fragment';
import VueHotkey from 'v-hotkey';
import { Datetime } from 'vue-datetime';

// import global libs and styles
// import './fonts/fontawesome/js/all.js';
import 'vue-croppa/dist/vue-croppa.css';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import 'vue-datetime/dist/vue-datetime.css';

Vue.use(VModal, { componentName: 'vue-modal' });
Vue.use(VueObserveVisibility);
Vue.use(VueVirtualScroller);
Vue.use(Croppa);
Vue.use(VTooltip, {
  popover: {
    defaultHandleResize: false
  }
});
Vue.use(PerfectScrollbar);
Vue.use(VueHotkey);
Vue.use(Fragment.Plugin);

Vue.component('datetime', Datetime);

// click outside diretive
Vue.directive('click-outside', {
  bind: function(el, binding, vnode) {
    el.clickOutsideEvent = function(event) {
      // here I check that click was outside the el and his childrens
      if (!(el == event.target || el.contains(event.target))) {
        // and if it did, call method provided in attribute value
        vnode.context[binding.expression](event);
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unbind: function(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent);
  }
});
