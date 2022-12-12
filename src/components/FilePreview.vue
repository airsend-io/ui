<template>
  <div
    class="file-preview"
    v-bind:class="{ ['file-preview--active']: isActive }"
  >
    <nav class="navbar navbar-expand-lg file-preview-header">
      <a class="navbar-title mr-auto" v-if="currentFile">
        <FileIcon :name="currentFile.file" />
        <div class="navbar-title-file">{{ currentFile.file }}</div>
      </a>

      <a class="navbar-icon has-popover" v-if="transactions.length > 0">
        <Popover popoverClass="popover-large">
          <a
            class="navbar-icon"
            v-bind:class="{
              ['navbar-icon--alert']:
                runningTransactions.length > 0 || failedTransactions.length > 0,
              ['primary']:
                runningTransactions.length > 0
                  ? true
                  : failedTransactions.length === 0
            }"
            v-tooltip="{
              delay: 1000,
              offset: -5,
              content: $t('files.preview.transactions')
            }"
          >
            <TransactionsIcon
              v-tooltip="{
                content:
                  runningTransactions.length === 0 &&
                  failedTransactions.length > 0
                    ? $tc(
                        'files.tooltips.transactions-navbar-operations-failed',
                        failedTransactions.length
                      )
                    : $tc(
                        'files.tooltips.transactions-navbar-operations-processing',
                        runningTransactions.length
                      ),
                show: isActive && showTransactionsTooltip,
                offset: 5,
                trigger: 'manual'
              }"
            />
            <span
              v-if="runningTransactions.length > 0"
              class="notification-count"
              >{{ runningTransactions.length }}</span
            >
            <span
              v-else-if="failedTransactions.length > 0"
              class="notification-count"
              >{{ failedTransactions.length }}</span
            >
          </a>
          <template slot="popover">
            <TransactionManager />
          </template>
        </Popover>
      </a>

      <a
        class="navbar-icon"
        @click="prev"
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('files.preview.button-previous')
        }"
        :class="{ disabled: index === 0 }"
      >
        <Icon family="fas" name="chevron-left" />
      </a>

      <a
        class="navbar-icon"
        @click="next"
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('files.preview.button-next')
        }"
        :class="{ disabled: index === files.length - 1 }"
      >
        <Icon family="fas" name="chevron-right" />
      </a>

      <a
        class="navbar-icon navbar-icon--outline"
        v-if="isOffice"
        @click="onEdit"
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('files.preview.button-edit-office')
        }"
      >
        <OfficeIcon /> {{ $t('files.preview.button-edit-office') }}
      </a>

      <a
        class="navbar-icon"
        @click="onOpenFolder"
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('files.preview.button-folder')
        }"
        v-if="currentFile && currentFile.show_dir && currentFile.parent"
      >
        <Icon family="fas" name="folder-open" />
      </a>

      <a
        class="navbar-icon"
        @click="onDownload"
        v-tooltip="{ delay: 1000, offset: -5, content: $t('files.download') }"
        v-if="currentFile && !currentFile.noDownload"
      >
        <Icon family="fas" name="download" />
      </a>

      <a
        class="navbar-icon"
        style="font-size:150%"
        v-tooltip="{
          delay: 1000,
          offset: -5,
          content: $t('files.preview.button-close')
        }"
        @click="close"
      >
        <Icon family="far" name="times" />
      </a>
    </nav>
    <div class="file-preview-portal">
      <component
        v-bind:is="currentView"
        :file="currentFile"
        :edit="edit"
        v-if="isActive"
        @download="onDownload"
        @edit="onEdit"
        @fallback="onFallback"
      />
    </div>
  </div>
</template>

<script>
import FileIcon from './FileIcon.vue';
import Icon from './Icon.vue';
import Popover from 'airsend/components/Popover.vue';

import TransactionsIcon from 'airsend/assets/transactions.svg';
import TransactionManager from '../../src/components/ChannelSidebar/TransactionsManager';

import store from 'store';
import qs from 'query-string';
import _ from 'lodash';

import OfficeView from './FilePreview/Office.vue';
import DefaultView from './FilePreview/Default.vue';

import OfficeIcon from 'airsend/assets/office.svg';

import { EventBus } from 'airsend/event-bus.js';
import { getFileType } from 'airsend/utils';

export default {
  props: {},
  mounted() {
    EventBus.$on('file-preview', this.preview.bind(this));
  },
  destroyed() {
    EventBus.$off('file-preview', this.preview.bind(this));
  },
  data() {
    return {
      isActive: false,
      files: [],
      index: 0,
      fallback: null,
      edit: false,
      showTransactionsTooltip: false,
      transactionsTooltipTimeout: null
    };
  },
  computed: {
    currentFile() {
      return this.files[this.index] ? this.files[this.index] : null;
    },
    currentView() {
      if (!this.currentFile) return;

      if (this.fallback) return this.fallback;

      const type = getFileType(this.currentFile.file);

      // office files
      if (['excel', 'word', 'powerpoint'].indexOf(type) > -1) {
        return 'OfficeView';
      }

      // media files
      if (['pdf', 'img', 'audio', 'video'].indexOf(type) > -1) {
        return () => import(`./FilePreview/${_.capitalize(type)}.vue`);
      }

      // default view
      return 'DefaultView';
    },
    isOffice() {
      if (!this.currentFile) return false;
      const officeFileTypes = ['word', 'powerpoint', 'excel'];
      return officeFileTypes.indexOf(getFileType(this.currentFile.file)) > -1;
    },
    runningTransactions() {
      return this.$store.getters['files/getRunningTransactions']();
    },
    failedTransactions() {
      return this.$store.getters['files/getTransactions']().filter(
        t => t.status === 'failed'
      );
    },
    transactions() {
      return this.$store.getters['files/getTransactions']();
    }
  },
  methods: {
    preview(data, index) {
      this.isActive = true;

      this.fallback = null;

      this.files = data;
      this.index = index;

      window.addEventListener('keydown', this.handleKey);
    },
    onOpenFolder() {
      this.$router.push(`/files${this.currentFile.parent}`);
      this.close();
    },
    onDownload() {
      this.$store.dispatch('files/download', {
        name: this.currentFile.file,
        path: this.currentFile.path
      });
    },
    onEdit() {
      const params = {
        fspath: this.currentFile.path,
        token: store.get('jwt')
      };

      let query = qs.stringify(params);
      window.open(`${process.env.VUE_APP_ROOT_API}/v1/wopi.edit?${query}`);
    },
    onFallback(view) {
      this.fallback = view;
    },
    handleKey(e) {
      // close on press escape
      if (e.key === 'Escape') {
        this.close();
      }

      if (e.key === 'ArrowRight') {
        this.next();
      }

      if (e.key === 'ArrowLeft') {
        this.prev();
      }
    },
    next() {
      if (this.index < this.files.length - 1) {
        this.index = this.index + 1;
      }
    },
    prev() {
      if (this.index > 0) {
        this.index = this.index - 1;
      }
    },
    close() {
      this.isActive = false;
      window.removeEventListener('keydown', this.handleKey);
    }
  },
  watch: {
    runningTransactions(transactions, previous_transactions) {
      if (transactions.length > previous_transactions.length) {
        clearTimeout(this.transactionsTooltipTimeout);
        this.showTransactionsTooltip = true;

        this.transactionsTooltipTimeout = setTimeout(() => {
          this.showTransactionsTooltip = false;
        }, 3000);
      }
    },
    failedTransactions(transactions, previous_transactions) {
      if (transactions.length > previous_transactions.length) {
        clearTimeout(this.transactionsTooltipTimeout);
        this.showTransactionsTooltip = true;

        this.transactionsTooltipTimeout = setTimeout(() => {
          this.showTransactionsTooltip = false;
        }, 3000);
      }
    }
  },
  components: {
    FileIcon,
    OfficeIcon,
    Icon,
    Popover,
    TransactionsIcon,
    TransactionManager,

    // file views
    DefaultView,
    OfficeView
  }
};
</script>
