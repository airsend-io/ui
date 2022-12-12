<template>
  <transition name="transactions-fade">
    <div class="transactions-wrapper">
      <div class="transactions">
        <!-- blue bar -->
        <div class="heading">
          <h5>
            {{ $t('files.transactions-title') }}
          </h5>
        </div>

        <div class="empty-transactions" v-if="!transactions.length">
          <Icon family="fas" name="download" />
          {{ $t('files.transactions-empty-transactions') }}
        </div>

        <div class="subheader" v-else-if="transactions.length">
          <span class="items" v-if="runningTransactions.length > 0">{{
            $tc(
              'files.transactions-processing-items',
              runningTransactions.length
            )
          }}</span>
          <div
            class="clear-all"
            @click="() => clearTransactions()"
            v-tooltip="{
              delay: { show: 10, hide: 0 },
              html: true,
              content: `<div class='text-left'>
                        <b>${$t(
                          'files.tooltips.transactions-clear-transactions'
                        )}</b>
                        <div class='text-left'>${$t(
                          'files.tooltips.transactions-clear-transactions-description'
                        )}</div>
                      </div>`
            }"
          >
            <Icon name="trash" family="fas" />
            {{ $t('files.tooltips.transactions-clear-transactions') }}
          </div>
        </div>

        <!-- downloads list -->
        <div class="transactions-list" v-if="transactions.length">
          <div
            class="transaction-single"
            v-for="(transaction, id) in transactions"
            :key="id"
          >
            <FileIcon
              :name="transaction.name"
              :isFolder="transaction.file_type === 'folder'"
            >
              <template v-slot:status>
                <Icon
                  family="fas"
                  name="clock"
                  class="secondary"
                  v-if="transaction.status === 'processing'"
                  v-tooltip="{
                    content: $t(
                      'files.tooltips.transactions-operation-badge-processing'
                    )
                  }"
                />
                <Icon
                  family="fas"
                  name="check"
                  class="success"
                  v-else-if="transaction.status === 'completed'"
                />
                <Icon
                  family="fas"
                  name="times"
                  class="error"
                  v-else-if="transaction.status === 'failed'"
                  v-tooltip="{
                    content: $t(
                      'files.tooltips.transactions-operation-badge-failed'
                    )
                  }"
                />
                <Icon
                  family="fas"
                  name="ban"
                  class="secondary"
                  v-else-if="transaction.status === 'interrupted'"
                  v-tooltip="{
                    content: $t(
                      'files.tooltips.transactions-operation-badge-interrupted'
                    )
                  }"
                />
              </template>
            </FileIcon>
            <div class="info-section">
              <div class="transaction-header d-flex">
                <div class="file-name">
                  <span @click="openFile(transaction)">{{
                    transaction.name
                  }}</span>
                </div>
                <div class="transaction-actions">
                  <span
                    class="file-size"
                    v-if="
                      transaction.size >= 0 &&
                        (transaction.status == 'completed' ||
                          transaction.type === 'download-zip')
                    "
                  >
                    {{ bytesToSize(transaction.size) }}
                  </span>
                  <span
                    class="file-size"
                    v-else-if="
                      transaction.status == 'processing' &&
                        transaction.progress >= 0 &&
                        transaction.progress <= 100
                    "
                  >
                    {{ parseInt(transaction.progress) }}%
                  </span>
                  <Popover
                    v-if="user && user.id && transaction.status == 'completed'"
                    placement="left"
                  >
                    <button
                      v-tooltip="{
                        delay: 1000,
                        content: 'More options',
                        placement: 'left',
                        offset: 5
                      }"
                      class="btn btn-icon more-options hover-only transaction-action"
                    >
                      <Icon family="fal" name="ellipsis-h" />
                    </button>
                    <template slot="popover">
                      <div class="dropdown-items">
                        <button
                          v-close-popover
                          class="dropdown-item"
                          type="button"
                          @click="openDownloadFolder(transaction)"
                          v-if="
                            transaction.status == 'completed' &&
                              transaction.downloadPath
                          "
                        >
                          <Icon family="fal" name="folder" />
                          {{
                            $t(
                              'files.more-options.transactions-operation-action-show-in-download-folder'
                            )
                          }}
                        </button>

                        <button
                          v-close-popover
                          class="dropdown-item"
                          type="button"
                          @click="openFileFolder(transaction)"
                          v-if="
                            transaction.status == 'completed' &&
                              !transaction.downloadPath
                          "
                        >
                          <Icon family="fal" name="folder" />
                          {{
                            $t(
                              'files.more-options.transactions-operation-action-show-in-airsend-folder'
                            )
                          }}
                        </button>

                        <button
                          v-close-popover
                          class="dropdown-item"
                          type="button"
                          @click="openFile(transaction)"
                          v-if="
                            transaction.status == 'completed' &&
                              !transaction.downloadPath
                          "
                        >
                          <Icon family="fal" name="file" />
                          {{
                            $t(
                              'files.more-options.transactions-operation-action-show-in-airsend'
                            )
                          }}
                        </button>

                        <button
                          v-close-popover
                          class="dropdown-item"
                          type="button"
                          @click="openDownloadFile(transaction)"
                          v-if="
                            transaction.status == 'completed' &&
                              transaction.downloadPath
                          "
                        >
                          <Icon family="fal" name="file" />
                          {{
                            $t(
                              'files.more-options.transactions-operation-action-show-in-machine'
                            )
                          }}
                        </button>
                      </div>
                    </template>
                  </Popover>
                  <span
                    class="hover-only transaction-action"
                    @click="cancelTransaction(transaction)"
                    v-else-if="
                      transaction.status == 'processing' ||
                        transaction.status == 'preparing'
                    "
                    v-tooltip="{
                      content: $t(
                        'files.tooltips.transactions-operation-action-cancel'
                      ),
                      offset: '10px',
                      placement: 'left'
                    }"
                  >
                    <Icon name="times" />
                  </span>
                </div>
              </div>
              <Progress
                v-if="transaction.status == 'processing'"
                :value="transaction.progress"
              />
              <p
                class="transaction-description"
                v-if="transaction.status !== 'processing'"
              >
                {{
                  transaction.message === 'string'
                    ? transaction.message
                    : transaction.message.i18n.count !== undefined
                    ? $tc(
                        transaction.message.key,
                        transaction.message.i18n.count
                      )
                    : $t(transaction.message.key, transaction.message.i18n)
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import Vue from 'vue';
import Icon from 'airsend/components/Icon.vue';
import FileIcon from 'airsend/components/FileIcon.vue';
import Progress from 'airsend/components/Progress.vue';
import Popover from 'airsend/components/Popover.vue';
import { bytesToSize } from 'airsend/utils';
import { mapMutations } from 'vuex';
import { EventBus } from 'airsend/event-bus.js';
import qs from 'query-string';
export default {
  components: {
    Icon,
    FileIcon,
    Progress,
    Popover
  },

  mounted() {
    if (window.ipcRenderer) {
      ipcRenderer.on('download-completed', (e, name, downloadPath) => {
        let transaction = this.$store.getters['files/getTransactionByFileName'](
          name
        );
        if (transaction) {
          this.setTransaction({
            id: transaction.id,
            downloadPath
          });
        }
      });
      ipcRenderer.on('download-failed', (e, name, downloadPath) => {
        let transaction = this.$store.getters['files/getTransactionByFileName'](
          name
        );
        if (transaction) {
          this.setTransaction({
            id: transaction.id,
            status: 'failed',
            message: {
              key: 'files.transactions-messages.download-save-failed',
              i18n: { downloadPath: downloadPath }
            }
          });
        }
      });
    }
  },

  computed: {
    transactions() {
      return this.$store.getters['files/getTransactions']();
      //return this.$store.state.files.transactions;
    },
    isElectron() {
      return !!window.ipcRenderer;
    },
    transactionsBar() {
      return this.$store.state.files.transactionsBar;
    },
    user() {
      return this.$store.getters['core/getUser'](null);
    },
    getOS() {
      var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;

      if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'Mac OS';
      } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'iOS';
      } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'Windows';
      } else if (/Android/.test(userAgent)) {
        os = 'Android';
      } else if (!os && /Linux/.test(platform)) {
        os = 'Linux';
      }

      return os;
    },

    runningTransactions() {
      return this.$store.getters['files/getRunningTransactions']();
    }
  },

  methods: {
    clearTransactions() {
      this.clearFinishedTransactions();
    },
    cancelTransaction(transaction) {
      this.setTransaction({
        id: transaction.id,
        status: 'interrupted',
        message: {
          key:
            transaction.type === 'upload'
              ? 'files.transactions-messages.upload-interrupted'
              : 'files.transactions-messages.download-interrupted',
          i18n: { name: transaction.name }
        }
      });
      //window.ipcRenderer.send('cancel-download', item.name);
    },

    openFileFolder(transaction) {
      let fullPath = transaction.file;
      let channel_id = this.$route.params.id;

      const [beginOf, pathType, channelDir, ...finalPath] = fullPath.split('/');
      finalPath.splice(-1, 1); //remove file name

      let query = {
        type: 'files'
      };

      this.$router.push(
        `/channel/${channel_id}/files/${finalPath.join('/')}${`?${qs.stringify(
          query
        )}`}`
      );
    },

    openDownloadFolder(transaction) {
      let path = transaction.downloadPath;
      let separator = this.getOS === 'Windows' ? '\\' : '/';

      path = path.split(separator);
      path.splice(-1, 1);
      path = path.join(separator);
      console.log(path);

      window.open(`file://${path}`);
    },
    openDownloadFile(transaction) {
      let path = transaction.downloadPath;
      window.open(`file://${path}`);
    },
    openFile(transaction) {
      if (transaction.status == 'completed' && transaction.downloadPath) {
        this.openDownloadFile(transaction);
        return;
      }
      if (this.user && this.user.id) {
        //prevent preview for guests
        EventBus.$emit(
          'file-preview',
          [
            {
              file: transaction.name,
              path: transaction.file,
              size: transaction.size,
              modificationts: transaction.added
            }
          ],
          0
        );
      }
    },
    bytesToSize,
    ...mapMutations({
      setTransaction: 'files/setTransaction',
      clearFinishedTransactions: 'files/clearFinishedTransactions'
    })
  }
};
</script>
