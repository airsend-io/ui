<template>
  <div v-if="active && channel" class="card card-transparent">
    <div class="card-header card-header--has-border">
      <h2 class="mb-0">
        <WikiLinks
          v-if="wikiLinks.length"
          :links="wikiLinks"
          :channel="channel"
          :current="currentWikiPage"
          :canEdit="user.role.can('wiki.edit')"
          @createNewWiki="createNewWiki"
        />
        <div
          v-if="currentWikiPage !== 'index.md'"
          class="wiki-nav d-flex align-items-center"
        >
          <router-link
            :to="`/channel/${channel.id}/wiki/index.md`"
            v-tooltip="{
              delay: 1000,
              offset: -5,
              content: $t('wiki.back-to-main-page')
            }"
            class="btn btn-icon btn-sm rounded"
            @click="navigateWikiLink($event, 'index.md')"
          >
            <Icon family="far" name="home" />
          </router-link>
        </div>

        <button
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('wiki.page-share')
          }"
          v-if="user.role.can('wiki.edit')"
          class="btn btn-icon btn-sm ml-auto"
          @click="onSharePage"
        >
          <Icon family="far" name="share-alt" />
        </button>

        <button
          v-tooltip="{ delay: 1000, offset: -5, content: $t('wiki.full-view') }"
          class="btn btn-icon btn-sm d-none d-md-inline-block"
          :class="{ 'ml-auto': !user.role.can('wiki.edit') }"
          @click="openWikiFullPage"
        >
          <Icon family="far" name="expand" />
        </button>
        <button
          v-if="user.role.can('wiki.edit')"
          v-tooltip="{ delay: 1000, offset: -5, content: $t('wiki.page-edit') }"
          class="btn btn-icon btn-sm d-none d-md-inline-block"
          @click="onEditWiki"
        >
          <Icon family="far" name="pencil" />
        </button>
      </h2>
    </div>
    <div class="collapse d-flex flex-column show">
      <div class="card-body">
        <Loader :loading="!wiki || (loading && !wiki[currentWikiPage])" full />
        <perfect-scrollbar
          ref="wiki"
          class="wiki-content"
          @click="onClickWiki"
          v-html="
            wiki && wiki[currentWikiPage] ? wiki[currentWikiPage].html : ''
          "
        ></perfect-scrollbar>
      </div>
    </div>
  </div>
</template>
<script>
import Icon from 'airsend/components/Icon';
import Loader from 'airsend/components/Loader.vue';
import Modal from 'airsend/components/Modal.vue';

import FullFileExplorer from '../Files/FullFileExplorer';
import WikiEditorModal from '../Modals/WikiEditor.vue';
import WikiLinks from './WikiLinks';

export default {
  components: {
    Icon,
    Modal,
    Loader,
    FullFileExplorer,
    WikiEditorModal,
    WikiLinks
  },
  props: {
    active: Boolean,
    channel: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      currentWikiPage: 'index.md',
      isElectron: window.isElectron,
      wikiLoading: false,
      fullViewActive: false,
      createNewPage: false
    };
  },
  computed: {
    wiki() {
      if (!this.channel) return null;
      return this.$store.state.wiki.channels[this.channel.id];
    },
    loading() {
      return this.$store.state.loading['wiki/browse'];
    },
    wikiLinks() {
      return this.wiki ? this.wiki.wikiTree : [];
    },
    channelWikiPath() {
      if (!this.channel) return '';
      const root = _.find(this.channel.channel_roots, { type: 'wiki' });
      return root.location;
    },
    user() {
      return this.$store.getters['core/getUser'](this.channel.id);
    }
  },
  watch: {
    active(newer) {
      if (newer) this.load();
    },
    $route(newRoute) {
      if (newRoute.params.pathMatch !== this.currentWikiPage) {
        this.load();
      }
    },
    channel(next, previous) {
      if (
        ((next && previous && next.id !== previous.id) || !previous) &&
        this.active
      ) {
        this.load();
      }
    }
  },
  async mounted() {
    if (this.active) {
      this.load();
    }
  },
  methods: {
    async load() {
      if (!this.active || !this.channel) return;

      const { pathMatch: path } = this.$route.params;

      this.currentWikiPage = path ? path : 'index.md';

      // fetch wiki file
      await this.$store.dispatch('wiki/browse', {
        channelId: this.channel.id,
        file: path ? path : 'index.md'
      });
    },
    async browse(path) {
      this.wikiLoading = true;

      const splitted = path.split('/');

      const target = splitted.slice(2, splitted.length).join('/');

      this.currentWikiPage = target;

      // fetch wiki file
      await this.$store.dispatch('wiki/browse', {
        channelId: this.channel.id,
        file: target
      });

      this.wikiLoading = false;
    },
    async navigateWikiLink(e, link) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      this.wikiLoading = true;
      await this.$store.dispatch('wiki/browse', {
        channelId: this.channel.id,
        file: link
      });

      this.currentWikiPage = link;
      this.wikiLoading = false;
    },
    async onClickWiki(e) {
      if (!this.isElectron) {
        if (!e.target.hostname) return;

        // if it's local link, prevent from going there
        if (
          e.target.hostname &&
          e.target.hostname === window.location.hostname
        ) {
          e.preventDefault();
          e.stopPropagation();

          let target = e.target.attributes[0].value;

          // fetch wiki file

          this.wikiLoading = true;
          await this.$store.dispatch('wiki/browse', {
            channelId: this.channel.id,
            file: target
          });

          this.currentWikiPage = target;
          this.wikiLoading = false;
        }
      } else {
        // if it's a local file
        if (e.target.protocol === 'file:') {
          e.preventDefault();
          e.stopPropagation();

          let target = e.target.attributes[0].value;

          // fetch wiki file
          await this.$store.dispatch('wiki/browse', {
            channelId: this.channel.id,
            file: target
          });

          this.currentWikiPage = target;
        }
      }
    },
    createNewWiki() {
      this.$modal.show('wiki-editor', {
        canEdit: this.user.role.can('wiki.edit'),
        initialFile: this.currentWikiPage,
        viewOnly: false,
        createNewPage: true,
        links: this.wikiLinks,
        currentLink: this.currentWikiPage
      });
    },
    openWikiFullPage() {
      this.$modal.show('wiki-editor', {
        initialFile: this.currentWikiPage,
        viewOnly: true,
        links: this.wikiLinks,
        currentLink: this.currentWikiPage
      });
    },
    onEditWiki() {
      this.$modal.show('wiki-editor', {
        initialFile: this.currentWikiPage,
        viewOnly: false, //can edit
        links: this.wikiLinks,
        currentLink: this.currentWikiPage
      });
    },
    onCloseWikiModal() {
      if (!this.fullViewActive && this.createNewPage) {
        this.navigateWikiLink(null, this.currentWikiPage);
      }
      this.fullViewActive = false;
      this.createNewPage = false;
    },
    activateEdit() {
      this.fullViewActive = false;
    },
    cancelEdit() {
      this.fullViewActive = true;
    },
    onSharePage() {
      console.log('Wiki onSharePage');
      this.$modal.show('file-share', {
        fullpath: `${this.channelWikiPath}/${this.currentWikiPage}`,
        name: this.currentWikiPage
      });
    }
  }
};
</script>
