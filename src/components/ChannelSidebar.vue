<template>
  <aside
    class="sidebar-fragment"
    :class="{ [`sidebar-fragment--minified`]: isMinified }"
  >
    <button
      v-tooltip="{
        delay: 1000,
        offset: -5,
        content: $t('channels.sidebar.button-toggle')
      }"
      type="button"
      class="btn btn-icon btn-fragment-toggle"
      @click="toggleMinification"
    >
      <Icon
        family="far"
        :name="isMinified ? 'arrow-to-left' : 'arrow-to-right'"
      />
    </button>

    <div class="sidebar-fragment-content">
      <ul class="nav nav-pills nav-fill nav-sidebar">
        <li class="nav-item" :set="(active = currentSection === 'actions')">
          <router-link
            @click.native="onClickRoute"
            :to="
              `/channel/${channel && channel.id}/actions${
                $route.query ? `?${qs({ hash: $route.query.hash })}` : ''
              }`
            "
            class="nav-link"
            :class="{ active }"
            ><Icon family="fal" name="bolt" /><span>{{
              $t('general.actions')
            }}</span>
          </router-link>
        </li>
        <li class="nav-item" :set="(active = currentSection === 'files')">
          <router-link
            @click.native="onClickRoute"
            :to="
              `/channel/${channel && channel.id}/files${
                $route.query ? `?${qs({ hash: $route.query.hash })}` : ''
              }`
            "
            class="nav-link"
            :class="{ active }"
            ><Icon family="fal" name="file-alt" /><span>{{
              $t('general.files-and-links')
            }}</span>
            <Progress
              v-if="isMinified && currentTransaction"
              :value="currentTransaction && currentTransaction.progress"
            />
          </router-link>
        </li>
        <li class="nav-item" :set="(active = currentSection === 'wiki')">
          <router-link
            @click.native="onClickRoute"
            :to="
              `/channel/${channel && channel.id}/wiki${
                $route.query ? `?${qs({ hash: $route.query.hash })}` : ''
              }`
            "
            class="nav-link"
            :class="{ active }"
            ><Icon family="fal" name="info-circle" /><span>{{
              $t('general.wiki')
            }}</span>
          </router-link>
        </li>
      </ul>

      <Actions :active="currentSection === 'actions'" :channel="channel" />
      <Files :active="currentSection === 'files'" :channel="channel" />
      <Wiki
        ref="wiki"
        :active="currentSection === 'wiki'"
        :channel="channel"
        v-if="currentSection === 'wiki'"
      />
    </div>
  </aside>
</template>

<script>
import _ from 'lodash';
import qs from 'query-string';
import moment from 'moment';
import store from 'store';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import Modal from 'airsend/components/Modal.vue';
import Avatar from 'airsend/components/Avatar.vue';
import FileExplorer from './Files/FileExplorer.vue';
import Progress from 'airsend/components/Progress.vue';

import Actions from './ChannelSidebar/Actions.vue';
import Files from './ChannelSidebar/Files.vue';
import Wiki from './ChannelSidebar/Wiki.vue';

import Toaster from './ChannelSidebar/Toaster';

import { EventBus } from 'airsend/event-bus.js';

export default {
  components: {
    Icon,
    FileExplorer,
    Loader,
    Modal,
    Avatar,
    Actions,
    Files,
    Wiki,
    Toaster,
    Progress
  },
  props: {
    channel: {
      type: Object,
      default: () => {}
    }
  },
  data: function() {
    return {
      isMinified: store.get('isChannelSidebarMinified') ? true : false,
      lastTab: null
    };
  },
  watch: {
    currentSection(next) {
      if (next && next !== '') {
        this.lastTab = next;
      }
    }
  },
  computed: {
    currentSection() {
      // if channel is not loaded
      if (!this.channel) return '';

      const { resource } = this.$route.params;

      const resourcesList = ['actions', 'files', 'wiki'];

      if (this.isMinified) {
        return '';
      } else if (resource && resourcesList.indexOf(resource) > -1) {
        return resource;
      } else if (this.lastTab) {
        return this.lastTab;
      } else {
        const { total_file_count, action_count } = this.channel;

        // TODO: changed files count to > 2 as wiki now counts, but backend will fix that later
        if (total_file_count > 2 || action_count > 0) {
          return action_count > 0 ? 'actions' : 'files';
        }

        return 'wiki';
      }
    },
    currentTransaction() {
      return this.$store.getters['files/getRunningTransactions']()[0];
    },
    wiki() {
      if (!this.channel) return null;
      return this.$store.state.wiki.channels[this.channel.id];
    },
    channelWikiPath() {
      if (!this.channel) return '';
      const root = _.find(this.channel.channel_roots, { type: 'wiki' });
      return root.location;
    },
    user() {
      return this.$store.state.core.user;
    },
    IS_SUPERUSER() {
      return (
        this.channel &&
        (this.channel.user_role === 100 || this.channel.user_role === 50)
      );
    }
  },

  mounted() {
    EventBus.$on('wiki-preview', this.onWikiPreview.bind(this));
    EventBus.$on('action-highlight', this.onActionHighlight);
  },

  beforeDestroy() {
    EventBus.$off('wiki-preview', this.onWikiPreview.bind(this));
    EventBus.$off('action-highlight', this.onActionHighlight);
  },

  methods: {
    onClickRoute() {
      this.isMinified = false;
      store.set('isChannelSidebarMinified', false);
    },
    onActionHighlight(params) {
      this.$router.push(`/channel/${this.channel.id}/actions`).catch(() => {});
    },
    onWikiPreview(params) {
      // remove initial slash if there, and split path
      const [pathType, channelDir, ...finalPath] = params.file
        .replace(/^\/|\/$/g, '')
        .split('/');
      this.$router
        .push(`/channel/${this.channel.id}/wiki/${finalPath.join('/')}`)
        .catch(() => {});
    },
    toggleMinification() {
      store.set('isChannelSidebarMinified', !this.isMinified);
      this.isMinified = !this.isMinified;
    },
    qs: qs.stringify
  }
};
</script>
