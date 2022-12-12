<template>
  <div id="app" v-hotkey="keymap">
    <VueHeadful
      :title="
        `${
          unread_count && unread_count > 0
            ? `(${unread_count > 99 ? '99+' : unread_count}) `
            : ''
        }${core.title}`
      "
    />
    <div class="preloader">
      <Loader
        title="Connecting to AirSend"
        full
        :loading="!this.$store.state.core.ready"
      />
    </div>
    <component
      :is="IS_READONLY ? 'Guest' : 'Main'"
      v-if="this.$store.state.core.ready"
    ></component>
    <TeamSettings />
    <LanguageModal />
    <UserModal />
    <MeetingSettingsModal />
    <AudioTracks />
  </div>
</template>

<script>
import Main from './layouts/Main.vue';
import Guest from './layouts/Guest.vue';
import LanguageModal from './components/LanguageModal.vue';
import Loader from 'airsend/components/Loader.vue';
import UserModal from './components/Modals/User.vue';
import MeetingSettingsModal from './components/Modals/MeetingSettings.vue';
import AudioTracks from './components/Meeting/AudioTracks.vue';
import TeamSettings from './components/Modals/TeamSettings.vue';
import VueHeadful from 'vue-headful';
import { loadScript } from 'airsend/utils';
const { ipcRenderer } = window;

export default {
  name: 'App',
  components: {
    Main,
    Guest,
    Loader,
    LanguageModal,
    VueHeadful,
    UserModal,
    MeetingSettingsModal,
    AudioTracks,
    TeamSettings
  },
  created() {
    this.updateIsMobile();
    window.addEventListener('resize', this.updateIsMobile, false);
  },
  computed: {
    isMobile() {
      return this.$store.state.core.isMobile;
    },
    keymap() {
      return {
        'alt+shift+r': this.onRefresh
      };
    },
    core() {
      return this.$store.state.core;
    },
    user() {
      return this.$store.state.core.user;
    },
    unread_count() {
      const counter = this.$store.getters['channels/getUnreadCount'];
      if (window.ipcRenderer) window.ipcRenderer.send('update-badge', counter);
      return counter;
    },
    IS_READONLY() {
      return (
        !this.user.display_name ||
        this.user.read_only === true ||
        ['oauth'].indexOf(this.$router.history.current.name) > -1
      );
    }
  },
  methods: {
    updateIsMobile: _.throttle(function(e) {
      const isMobileNow = window.matchMedia(
        'only screen and (max-width: 992px)'
      ).matches;

      if (isMobileNow !== this.isMobile) {
        this.$store.commit('core/set', { isMobile: isMobileNow });
      }
    }, 66),
    onRefresh(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.$store.dispatch('channels/sync');
    }
  },
  watch: {
    $route(to) {
      if (!this.$store.state.core.ready) return;

      const isAuthenticated = !!this.$store.state.core.user.display_name;

      if (to.name === 'login' && isAuthenticated) {
        this.$router.push('/');
      }

      if (
        (!isAuthenticated && to.meta.authenticated) ||
        (!isAuthenticated && to.meta.requiresHash && !to.query.hash)
      ) {
        this.$router.push('/login');
      }
    }
  },
  async mounted() {
    this.$store.dispatch('core/colorSchema');

    this.$store.dispatch('channels/getUserPreferences');

    if (window.ipcRenderer) {
      ipcRenderer.on('force-refresh', () => {
        this.onRefresh();
      });
    } else {
      window.addEventListener(
        'focus',
        event => {
          this.$store.dispatch('core/checkForUpdate');
        },
        false
      );
    }

    // authenticate when router is ready
    this.$router.onReady(() => {
      this.$store.dispatch('core/handshake').then(() => {
        if (
          _.get(
            this.$store.state,
            'core.handshakeSettings.recaptchaEnabled',
            false
          )
        ) {
          const recaptchaV3Key = _.get(
            this.$store.state,
            'core.handshakeSettings.recaptchaV3SiteKey',
            ''
          );
          if (recaptchaV3Key.length > 0) {
            loadScript(
              `https://www.google.com/recaptcha/api.js?render=${recaptchaV3Key}`
            );
          }
        }
      });
      this.$store.dispatch('core/authenticate');
    });
  }
};
</script>
