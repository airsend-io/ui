<template>
  <div class="chat-message-content-attachment">
    <p v-if="!loading">
      {{ $tc('messages.files-uploaded', attachments.length) }}
    </p>
    <p v-else>{{ $tc('messages.files-uploading', attachments.length) }}</p>
    <ul class="attachment-list">
      <li
        v-for="(file, index) in attachments.slice(
          0,
          attachments.length > 3 ? 2 : 3
        )"
      >
        <a class="single-attachment" @click.prevent="preview($event, index)">
          <FileIcon :name="file.file" :thumb="getThumb(file)" />
          <div class="single-attachment-info">
            <p>{{ file.file }}</p>
            <small>{{ bytesToSize(file.size) }}</small>
            <div
              class="progress"
              v-if="$store.state.files.progress[file.path] && loading"
            >
              <div
                class="progress-bar"
                role="progressbar"
                v-bind:style="{
                  width: $store.state.files.progress[file.path].progress + '%'
                }"
                aria-valuenow="25"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          </div>
          <div class="more-options" @click.prevent.stop>
            <Popover>
              <button
                v-tooltip="{
                  delay: 1000,
                  offset: -5,
                  content: $t('general.more-options')
                }"
                class="trigger btn btn-icon btn-sm"
              >
                <Icon family="far" name="ellipsis-h" />
              </button>
              <template slot="popover">
                <div>
                  <div class="dropdown-items">
                    <button
                      class="dropdown-item"
                      type="button"
                      v-close-popover
                      @click="() => onDownload(file)"
                      :disabled="file.noDownload"
                    >
                      <Icon family="far" name="download" />
                      {{ $t('files.download') }}
                    </button>
                    <button
                      class="dropdown-item"
                      type="button"
                      v-close-popover
                      @click="preview($event, index)"
                    >
                      <Icon family="far" name="eye" />
                      {{ $t('files.button-preview') }}
                    </button>
                  </div>
                </div>
              </template>
            </Popover>
          </div>
        </a>
      </li>
      <li v-if="attachments.length > 3">
        <Popover popoverBaseClass="popover tooltip popover-attachments">
          <a class="single-attachment">
            <FileIcon name="more" />
            <div>
              <p>
                {{ $tc('channels.chat-more-files', attachments.length - 2) }}
              </p>
              <small>{{ $t('channels.chat-more-files-description') }}</small>
            </div>
          </a>
          <template slot="popover">
            <perfect-scrollbar class="attachment-list attachment-list-popover">
              <li v-for="(file, index) in attachments.slice(2)">
                <a
                  class="single-attachment"
                  v-close-popover
                  @click="preview($event, index + 2)"
                >
                  <FileIcon :name="file.file" :thumb="getThumb(file)" />
                  <div class="single-attachment-info">
                    <p>{{ file.file }}</p>
                    <small>{{ bytesToSize(file.size) }}</small>
                    <div
                      class="progress"
                      v-if="$store.state.files.progress[file.path] && loading"
                    >
                      <div
                        class="progress-bar"
                        role="progressbar"
                        v-bind:style="{
                          width:
                            $store.state.files.progress[file.path].progress +
                            '%'
                        }"
                        aria-valuenow="25"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                  <div class="more-options" @click.prevent.stop>
                    <Popover>
                      <button
                        v-tooltip="{
                          delay: 1000,
                          offset: -5,
                          content: $t('general.more-options')
                        }"
                        class="trigger btn btn-icon btn-sm"
                      >
                        <Icon family="far" name="ellipsis-h" />
                      </button>
                      <template slot="popover">
                        <div>
                          <div class="dropdown-items">
                            <button
                              class="dropdown-item"
                              type="button"
                              v-close-popover
                              @click="() => onDownload(file)"
                              :disabled="file.noDownload"
                            >
                              <Icon family="fas" name="download" />
                              {{ $t('files.download') }}
                            </button>
                            <button
                              class="dropdown-item"
                              type="button"
                              v-close-popover
                              @click="preview($event, index + 2)"
                            >
                              <Icon family="far" name="file-image" />
                              {{ $t('files.button-preview') }}
                            </button>
                          </div>
                        </div>
                      </template>
                    </Popover>
                  </div>
                </a>
              </li>
            </perfect-scrollbar>
          </template>
        </Popover>
      </li>
    </ul>
  </div>
</template>

<script>
import store from 'store';
import FileIcon from 'airsend/components/FileIcon.vue';
import Popover from 'airsend/components/Popover.vue';
import Icon from 'airsend/components/Icon.vue';
import { bytesToSize, relDiff, isImg } from 'airsend/utils';
import { EventBus } from 'airsend/event-bus.js';

export default {
  props: {
    attachments: {
      type: Array,
      default: []
    },
    version: {
      type: Number,
      default: 0
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    }
  },
  methods: {
    bytesToSize: bytesToSize,
    relDiff: relDiff,
    onDownload(file) {
      this.$store.dispatch('files/download', {
        name: file.file,
        path: file.path
      });
    },
    preview(e, index) {
      e.preventDefault();
      e.stopPropagation();
      EventBus.$emit(
        'file-preview',
        this.attachments.map(file => {
          return {
            file: file.file,
            path: file.path,
            size: file.size,
            thumb: this.getThumb(file),
            modificationts: file.modificationts
          };
        }),
        index
      );
    },
    getThumb(file) {
      if (file.thumb && file.thumb !== '') return file.thumb;
      const token = this.$route.query.hash
        ? this.$route.query.hash
        : this.user.token;
      if (isImg(file.file) || file.has_thumb) {
        return `${
          process.env.VUE_APP_ROOT_API
        }/v1/file.thumb?fspath=${encodeURIComponent(
          file.path
        )}&width=120&height=120&token=${token}&v=${this.version}`;
      }
    }
  },
  components: {
    FileIcon,
    Popover,
    Icon
  }
};
</script>
