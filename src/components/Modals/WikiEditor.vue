<template>
  <Modal
    name="wiki-editor"
    :title="viewOnly ? $t('general.wiki') : $t('wiki.page-edit')"
    class="full-modal-explorer"
    :class="{ 'full-wiki-view': viewOnly }"
    @opened="onOpen"
    @closed="onClose"
    @before-open="beforeOpen"
  >
    <Loader
      :loading="
        this.$store.state.loading['file.upload'] ||
          this.$store.state.loading['file.get']
      "
      full
    />

    <div class="wiki-editor">
      <!--  <div
        v-if="viewOnly"
        class="wiki-editor-pane wiki-editor-pane--files view-only wikiLinks"
      >
        <div class="dropdown-items">
          <div class="card-header header-text d-flex align-items-center">
            {{ $t('wiki.pages-title') }}
          </div>
          <div class="dropdown-items">
            <div
              class="link-item"
              :class="{ active: link.name === current }"
              v-for="(link, id) in links"
              :key="id"
              @click="navigatePreview(link)"
              v-close-popover
            >
              <h4 class="text-truncate" v-if="link.summary && link.summary[0]">
                {{ parseMessageContent(link.summary[0], null, true) }}
              </h4>
              <p
                v-if="link.summary && link.summary[1]"
                class="item-content text-truncate"
              >
                {{ parseMessageContent(link.summary[1], null, true) }}
              </p>
              <p class="item-link">
                <Icon family="fal" name="file-alt" />
                {{ link.name }}
              </p>
            </div>
          </div>
        </div>
      </div> -->

      <div class="wiki-editor-pane wiki-editor-pane--files">
        <div v-if="breadcrumb" class="wiki-editor-header">
          <div v-if="breadcrumb.length > 1" class="wiki-editor-toolbar">
            <a
              v-tooltip="{
                delay: 1000,
                offset: -5,
                content: $t('wiki.back')
              }"
              class="btn btn-icon btn-sm"
              @click="() => this.$refs.fileList.goBack()"
              ><Icon family="fas" name="arrow-left"
            /></a>
          </div>
          <h4>{{ breadcrumb[breadcrumb.length - 1].title }}</h4>
          <div class="wiki-editor-toolbar">
            <a
              v-tooltip="{
                delay: 1000,
                offset: -5,
                content: $t('wiki.page-create')
              }"
              class="btn btn-icon btn-sm"
              @click="() => this.$refs.fileList.openCreateFile('.md')"
              ><Icon family="fas" name="file-plus"
            /></a>
            <a
              v-tooltip="{
                delay: 1000,
                offset: -5,
                content: $t('wiki.file-upload')
              }"
              class="btn btn-icon btn-sm"
              @click="() => this.$refs.fileList.openFileChooser()"
              ><Icon family="fas" name="upload"
            /></a>
            <a
              v-tooltip="{
                delay: 1000,
                offset: -5,
                content: $t('wiki.folder-create')
              }"
              class="btn btn-icon btn-sm"
              @click="() => this.$refs.fileList.openCreateFolder()"
              ><Icon family="fas" name="folder-plus"
            /></a>
          </div>
        </div>

        <div class="wiki-editor-body wiki-editor-body--files">
          <FileList
            v-if="active"
            ref="fileList"
            :initial-select="[this.current]"
            :initial-path="this.location"
            :initial-path-name="$t('general.wiki')"
            lock-initial
            simplified
            picker
            @file-created="onFileCreate"
            @picked="onPick"
            @selected="onSelect"
            @browse="onBrowse"
          />
        </div>
      </div>

      <div class="edit-preview-wrapper d-flex">
        <div class="wiki-editor-pane editor-pane--edit" v-if="!viewOnly">
          <div v-if="!cached" class="wiki-editor-header">
            <Popover
              class="wiki-links"
              placement="bottom-start"
              :offset="10"
              ref="wikilinkPop"
              @show="isPopoverWikiActive = true"
              @hide="isPopoverWikiActive = false"
            >
              <button
                v-tooltip="{
                  delay: 1000,
                  offset: -5,
                  content: $t('wiki.pages-title')
                }"
                class="btn btn-icon btn-sm btn-primary rounded"
                :class="{ active: isPopoverWikiActive }"
              >
                <Icon family="far" name="stream" />
              </button>
              <template slot="popover">
                <div class="wiki-editor-pane wiki-editor-pane--files">
                  <div
                    v-if="breadcrumb"
                    class="
                      wiki-editor-header
                      d-flex
                      align-items-center
                      justify-content-between
                      px-3
                    "
                  >
                    <div
                      v-if="breadcrumb.length > 1"
                      class="wiki-editor-toolbar"
                    >
                      <a
                        v-tooltip="{
                          delay: 1000,
                          offset: -5,
                          content: $t('wiki.back')
                        }"
                        class="btn btn-icon btn-sm"
                        @click="() => this.$refs.fileListMobile.goBack()"
                        ><Icon family="fas" name="arrow-left"
                      /></a>
                    </div>
                    <h4 class="h6 m-0 text-truncate" style="max-width: 100px">
                      {{ breadcrumb[breadcrumb.length - 1].title }}
                    </h4>
                    <div class="wiki-editor-toolbar ml-3">
                      <a
                        v-close-popover
                        v-tooltip="{
                          delay: 1000,
                          offset: -5,
                          content: $t('wiki.page-create')
                        }"
                        class="btn btn-icon btn-sm"
                        @click="
                          () => this.$refs.fileListMobile.openCreateFile('.md')
                        "
                        ><Icon family="fas" name="file-plus"
                      /></a>
                      <a
                        v-close-popover
                        v-tooltip="{
                          delay: 1000,
                          offset: -5,
                          content: $t('wiki.file-upload')
                        }"
                        class="btn btn-icon btn-sm"
                        @click="
                          () => this.$refs.fileListMobile.openFileChooser()
                        "
                        ><Icon family="fas" name="upload"
                      /></a>
                      <a
                        v-close-popover
                        v-tooltip="{
                          delay: 1000,
                          offset: -5,
                          content: $t('wiki.folder-create')
                        }"
                        class="btn btn-icon btn-sm"
                        @click="
                          () => this.$refs.fileListMobile.openCreateFolder()
                        "
                        ><Icon family="fas" name="folder-plus"
                      /></a>
                    </div>
                  </div>

                  <div class="wiki-editor-body wiki-editor-body--files">
                    <FileList
                      v-if="active"
                      ref="fileListMobile"
                      :initial-select="[this.current]"
                      :initial-path="this.location"
                      :initial-path-name="$t('general.wiki')"
                      lock-initial
                      simplified
                      picker
                      @file-created="onFileCreate"
                      @picked="onPick"
                      @selected="onSelect"
                      @browse="onBrowse"
                    />
                  </div>
                </div>
              </template>
            </Popover>
            <h4>
              {{ current }}
              <small
                v-if="changed || currentContent !== newContent"
                v-html="$t('wiki.editor.tip-unsaved-changed')"
              ></small>
            </h4>
            <div class="wiki-editor-toolbar d-flex">
              <button
                class="btn btn-primary btn-sm"
                :disabled="
                  isValidLocation || (currentContent === newContent && !changed)
                "
                href="#"
                @click="onPublish"
              >
                {{ $t('wiki.editor.button-publish') }}
              </button>
              <button
                class="btn btn-primary btn-sm ml-1"
                href="#"
                @click="viewOnly = true"
              >
                {{ $t('general.cancel') }}
              </button>
            </div>
          </div>
          <div v-else class="wiki-editor-header">
            <h4>
              <Icon
                family="far"
                name="exclamation-triangle"
                class="text-warning mr-1"
              />
              {{ $t('wiki.editor.tip-viewing-draft') }}
            </h4>
            <div class="wiki-editor-toolbar">
              <button
                class="btn btn-default btn-sm"
                href="#"
                @click="onDraftAction(false)"
              >
                {{ $t('general.discard') }}
              </button>
              <button
                class="btn btn-primary btn-sm ml-2"
                href="#"
                @click="onDraftAction(true)"
              >
                {{ $t('general.continue') }}
              </button>
            </div>
          </div>

          <div class="wiki-editor-body wiki-editor-body--editor">
            <Loader
              :loading="this.$store.state.loading['file.download']"
              full
            />

            <nav class="navbar navbar-expand align-items-start navbar-light">
              <ul class="navbar-nav flex-wrap mr-auto">
                <li class="nav-item">
                  <a
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('wiki.editor.options.bold')
                    }"
                    class="btn btn-icon btn-sm"
                    @click="command('bold')"
                    ><Icon family="far" name="bold"
                  /></a>
                </li>
                <li class="nav-item">
                  <a
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('wiki.editor.options.italic')
                    }"
                    class="btn btn-icon btn-sm"
                    @click="command('italic')"
                    ><Icon family="far" name="italic"
                  /></a>
                </li>
                <li class="nav-item">
                  <a
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('wiki.editor.options.strike-through')
                    }"
                    class="btn btn-icon btn-sm"
                    @click="command('strikethrough')"
                    ><Icon family="far" name="strikethrough"
                  /></a>
                </li>
                <li class="nav-item">
                  <v-popover>
                    <a
                      v-tooltip="{
                        delay: 1000,
                        offset: -5,
                        content: $t('wiki.editor.options.heading')
                      }"
                      class="btn btn-icon btn-sm"
                      ><Icon family="far" name="heading"
                    /></a>
                    <template slot="popover">
                      <div class="dropdown-items">
                        <button
                          v-close-popover
                          class="dropdown-item"
                          type="button"
                          @click="addHeading(1)"
                        >
                          <Icon family="fal" name="h1" />
                          {{
                            $t('wiki.editor.options.heading-sub', {
                              level: 1
                            })
                          }}
                        </button>
                        <button
                          v-close-popover
                          class="dropdown-item"
                          type="button"
                          @click="addHeading(2)"
                        >
                          <Icon family="fal" name="h2" />
                          {{
                            $t('wiki.editor.options.heading-sub', {
                              level: 2
                            })
                          }}
                        </button>
                        <button
                          v-close-popover
                          class="dropdown-item"
                          type="button"
                          @click="addHeading(3)"
                        >
                          <Icon family="fal" name="h2" />
                          {{
                            $t('wiki.editor.options.heading-sub', {
                              level: 3
                            })
                          }}
                        </button>
                        <button
                          v-close-popover
                          class="dropdown-item"
                          type="button"
                          @click="addHeading(4)"
                        >
                          <Icon family="fal" name="h4" />
                          {{
                            $t('wiki.editor.options.heading-sub', {
                              level: 4
                            })
                          }}
                        </button>
                      </div>
                    </template>
                  </v-popover>
                </li>
                <li class="nav-item">
                  <a
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('wiki.editor.options.ordered-list')
                    }"
                    class="btn btn-icon btn-sm"
                    @click="command('numlist')"
                    ><Icon family="far" name="list-ol"
                  /></a>
                </li>
                <li class="nav-item">
                  <a
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('wiki.editor.options.unordered-list')
                    }"
                    class="btn btn-icon btn-sm"
                    @click="command('bullist')"
                    ><Icon family="far" name="list-ul"
                  /></a>
                </li>
                <li class="nav-item">
                  <a
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('wiki.editor.options.code-block')
                    }"
                    class="btn btn-icon btn-sm"
                    @click="command('code')"
                    ><Icon family="far" name="code"
                  /></a>
                </li>
                <li class="nav-item">
                  <a
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('wiki.editor.options.quote')
                    }"
                    class="btn btn-icon btn-sm"
                    @click="command('quote')"
                    ><Icon family="far" name="quote-left"
                  /></a>
                </li>
                <li class="nav-item">
                  <a
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('wiki.editor.options.latex')
                    }"
                    class="btn btn-icon btn-sm"
                    @click="addFormula"
                    ><Icon family="far" name="function"
                  /></a>
                </li>
              </ul>
              <ul class="navbar-nav">
                <li class="nav-item">
                  <a
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('wiki.editor.options.add-image')
                    }"
                    class="btn btn-icon btn-sm"
                    @click="
                      () => this.$refs.fileList.openFilePicker(this.location)
                    "
                    ><Icon family="far" name="image"
                  /></a>
                </li>

                <li class="nav-item">
                  <v-popover>
                    <a
                      v-tooltip="{
                        delay: 1000,
                        offset: -5,
                        content: $t('wiki.editor.options.add-link')
                      }"
                      class="btn btn-icon btn-sm"
                      ><Icon family="far" name="link"
                    /></a>
                    <template slot="popover">
                      <div class="dropdown-items">
                        <button
                          v-close-popover
                          class="dropdown-item"
                          type="button"
                          @click="
                            () =>
                              this.$refs.fileList.openFilePicker(this.location)
                          "
                        >
                          <Icon family="fal" name="folder-open" />
                          {{ $t('wiki.editor.options.add-link-wiki') }}
                        </button>
                        <button
                          v-close-popover
                          class="dropdown-item"
                          type="button"
                          @click="addLink()"
                        >
                          <Icon family="fal" name="globe" />
                          {{ $t('wiki.editor.options.add-link-external') }}
                        </button>
                      </div>
                    </template>
                  </v-popover>
                </li>
              </ul>
            </nav>
            <MarkdownEditor
              ref="editor"
              v-model="newContent"
              toolbar=""
              @input="onUpdate"
            />
          </div>
        </div>

        <div class="wiki-editor-pane editor-pane--preview">
          <div class="wiki-editor-header">
            <h4>{{ viewOnly ? fileName : $t('wiki.editor.preview') }}</h4>
            <button
              v-if="viewOnly"
              v-tooltip="{
                delay: 1000,
                offset: -5,
                content: $t('wiki.page-share')
              }"
              class="btn btn-icon btn-sm rounded"
              @click="onSharePage"
            >
              <Icon family="far" name="share-alt" />
            </button>
            <button
              v-if="viewOnly"
              v-tooltip="{
                delay: 1000,
                offset: -5,
                content: $t('wiki.page-edit')
              }"
              class="btn btn-icon btn-sm rounded"
              @click="activateEdit"
            >
              <Icon family="far" name="pencil" />
            </button>
          </div>

          <div class="wiki-editor-body">
            <Loader
              :loading="this.$store.state.loading['file.download']"
              full
            />

            <div
              v-if="
                newContent === '' && !this.$store.state.loading['file.download']
              "
              class="empty-wrapper"
            >
              <div class="empty-box">
                <Icon family="fal" name="pencil" />
                <h4>{{ $t('wiki.empty-title') }}</h4>
                <p>{{ $t('wiki.empty-description') }}</p>
              </div>
            </div>

            <div
              class="wiki-content wiki-editor-body-preview"
              v-html="html"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
<script>
import store from 'store';
import { Drop } from 'vue-drag-drop';

import Modal from 'airsend/components/Modal.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import WikiLinks from 'airsend/components/ChannelSidebar/WikiLinks.vue';
import Popover from 'airsend/components/Popover.vue';
import MarkdownEditor from 'v-markdown-editor/src/editor.vue';
import FileList from '../Files/FileList.vue';

import { markdownToHtml, getFileType, isValidURL } from 'airsend/utils';
import { EventBus } from 'airsend/event-bus.js';
import { parseMessageContent } from 'airsend/utils';
import _ from 'lodash';

export default {
  components: {
    Modal,
    Icon,
    Loader,
    FileList,
    Drop,
    MarkdownEditor,
    WikiLinks,
    Popover
  },
  data() {
    return {
      serverContent: '', // in case there is a draft, the server content will be saved in here
      currentContent: '',
      newContent: '',
      current: null,
      location: '',
      cached: false,
      changed: false,
      active: false,
      breadcrumb: null,
      currentPathName: null,
      isPopoverWikiActive: false,
      initialFile: 'index.md',
      viewOnly: false,
      extension: {
        h1: {
          cmd: 'h1'
        },
        h2: {
          cmd: 'h2'
        },
        h3: {
          cmd: 'h3'
        },
        h4: {
          cmd: 'h4'
        }
      },
      errors: {}
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    wiki() {
      if (!this.channel) return null;
      return this.$store.state.wiki.channels[this.channel.id];
    },
    wikiLinks() {
      return this.wiki ? this.wiki.wikiTree : [];
    },
    html() {
      if (this.newContent) {
        return markdownToHtml(this.newContent, this.location, true);
      }
    },
    fileName() {
      if (this.current) {
        return this.current.slice(0, -3);
      }
      return '';
    },
    isValidLocation() {
      const isInSubfolder = this.current && this.current.split('/').length >= 2;
      let files;
      let currentFileName;

      if (isInSubfolder) {
        currentFileName = this.current.split('/').at(-1);
        const currentPath = this.current
          .split('/')
          .slice(0, -1)
          .join('/');
        files = this.$store.getters['files/getFilesInPath'](
          `${this.location}/${currentPath}`
        );
      } else {
        currentFileName = this.current;
        files = this.$store.getters['files/getFilesInPath'](this.location);
      }
      const fileExists = _.find(files, { name: currentFileName });
      return !!fileExists;
    }
  },
  methods: {
    async load(file) {
      const data = await this.$store.dispatch('wiki/getMarkdown', {
        channelId: this.channel.id,
        file: file
      });

      if (
        store.get(`wiki/${this.channel.id}/${file}`) &&
        store.get(`wiki/${this.channel.id}/${file}`) !== data.markdown
      ) {
        this.currentContent = store.get(`wiki/${this.channel.id}/${file}`);
        this.serverContent = data.markdown;
        this.cached = true;
      } else {
        this.currentContent = data.markdown;
        this.serverContent = '';
        this.cached = false;
      }

      this.newContent = this.currentContent;
      this.location = data.location;
      this.current = file;
      this.changed = false;

      if (!this.viewOnly) {
        const editor = this.$refs.editor.editor;
        editor.focus();
      }
    },
    async onOpen() {
      await this.load(this.initialFile);
      this.active = true;
      if (this.createNewPage) {
        this.$nextTick(() => {
          this.$refs.fileList.openCreateFile('.md');
        });
      }
    },
    beforeOpen({ params }) {
      this.$store.commit('files/setContext', {
        type: '',
        search: '',
        sort_by: 'name'
      });

      this.initialFile = params.initialFile || 'index.md';
      this.viewOnly = params.viewOnly || false;
      this.createNewPage = params.createNewPage || false;
      this.links = params.links || [];
      this.currentLink = params.currentLink || 'index.md';
    },
    onClose() {
      this.active = false;
      this.$emit('onClose');
    },
    onBrowse({ path, name, breadcrumb }) {
      this.currentPath = path;
      this.currentPathName = name.name;
      this.breadcrumb = breadcrumb;
    },
    onSelect(selected) {
      const [file] = selected;
      const splitedFile = file.split('.');
      const ext = splitedFile[splitedFile.length - 1];

      // load it
      if (ext === 'md') {
        let filePath = this.currentPath.replace(`${this.location}/`, '');
        filePath = filePath.replace(this.location, '');

        const fileName = `${filePath !== '' ? `${filePath}/` : ''}${file}`;

        if (fileName !== this.current) {
          this.load(fileName);
        }
      } else {
        this.$refs.fileList.select(this.current);
        EventBus.$emit(
          'file-preview',
          [{ file: file, path: `${this.currentPath}/${file}` }],
          0
        );
      }
    },
    onFileCreate({ path, file }) {
      let filePath = path.replace(`${this.location}/`, '');
      filePath = filePath.replace(this.location, '');

      this.load(`${filePath !== '' ? `${filePath}/` : ''}${file}`);

      this.$refs.fileList.select(file);
    },
    onUpdate(content) {
      // save draft locally
      store.set(`wiki/${this.channel.id}/${this.current}`, content);
    },
    command(key) {
      this.$refs.editor.command(key);
    },
    addHeading(type) {
      const editor = this.$refs.editor.editor;
      const text = editor.getSelection();

      editor.replaceSelection(`${'#'.repeat(type)} ` + text);
      editor.focus();
    },
    addLink() {
      const editor = this.$refs.editor;
      const stat = editor.state();
      const selection = editor.editor.getSelection();

      editor._replaceSelection(stat.link, ['[#title#]', '(#url#)'], {
        title: 'My Link',
        url: isValidURL(selection) ? selection : 'https://airsend.io/'
      });
      editor.editor.focus();
    },

    addFormula() {
      const editor = this.$refs.editor.editor;

      editor.replaceSelection('$$\n  f(x) = x^2\n$$');
      editor.focus();
    },

    onPick(path) {
      const editor = this.$refs.editor;
      const stat = editor.state();

      if (getFileType(path) === 'img') {
        editor._replaceSelection(stat.link, ['![#title#]', '(#url#)'], {
          title: 'My Image',
          url: encodeURIComponent(path.replace(`${this.location}/`, ''))
        });
      } else {
        editor._replaceSelection(stat.link, ['[#title#]', '(#url#)'], {
          title: 'My File',
          url: encodeURIComponent(path.replace(`${this.location}/`, ''))
        });
      }

      editor.editor.focus();
    },
    onDraftAction(keep) {
      if (keep) {
        this.cached = false;
        this.changed = true;
      } else {
        store.remove(`wiki/${this.channel.id}/${this.current}`);
        this.cached = false;

        this.currentContent = this.serverContent;
        this.newContent = this.serverContent;
      }
    },
    onDropFile(ext, e) {
      e.preventDefault();
      e.stopPropagation();

      if (ext) return;
    },
    async onPublish(e) {
      e.preventDefault();
      e.stopPropagation();

      // reset data errors
      this.errors = {};

      let fileName = this.current.split('/');
      fileName = fileName[fileName.length - 1];
      let subPath = this.current.replace(fileName, '').slice(0, -1);

      let blob = new Blob([this.newContent], { type: 'text/plain' });
      let file = new File([blob], fileName);

      const response = await this.$store.dispatch('files/upload', {
        path: `${this.location}${subPath !== '' ? '/' + subPath : ''}`,
        files: [file],
        noToast: true
      });

      if (response.ok) {
        store.remove(`wiki/${this.channel.id}/${this.current}`);
        this.cached = false;
        this.currentContent = this.newContent;
      } else {
        this.errors = this.$t('wiki.errors.update');
      }
    },
    activateEdit() {
      this.viewOnly = false;
      this.$nextTick(() => {
        const editor = this.$refs.editor.editor;
        editor.focus();
      });
    },
    onSharePage() {
      this.$modal.show('file-share', {
        fullpath: `${this.location}/${this.current}`,
        name: this.current
      });
    },
    navigatePreview(link) {
      this.load(link.name);
    },
    markdownToHtml,
    parseMessageContent
  },
  watch: {
    isValidLocation() {
      if (this.isValidLocation == false) {
        this.load(this.initialFile);
        this.$refs.fileList.select(this.initialFile);
      }
    }
  }
};
</script>
<style scoped>
::v-deep .v-md-container {
  background-color: var(--bg-light);
}
::v-deep .CodeMirror {
  background-color: var(--bg-light);
}
</style>
