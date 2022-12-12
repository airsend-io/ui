<template>
  <Modal
    name="search-view"
    title="Search All"
    theme="noPadding"
    class-name="search-view"
    @before-open="beforeOpen"
    @opened="onOpen"
  >
    <form
      class="form-inline inline-search"
      @submit="
        e => {
          e.preventDefault();
          e.stopPropagation();
        }
      "
    >
      <div class="form-group form-group--icon">
        <Icon family="far" name="search" />
        <input
          ref="input"
          @keyup="onSearch"
          v-model="query"
          class="form-control form-control--rounded form-control--large"
          type="text"
          :placeholder="
            channel
              ? $t('navbar.search-in-channel')
              : $t('navbar.search-channels-and-files')
          "
          aria-label="Search"
        />
        <button
          type="button"
          class="btn btn-icon btn-sm"
          v-if="query !== ''"
          @click="onCancelSearch"
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('navbar.cancel-search-hint')
          }"
        >
          <Icon family="far" name="times" class="icon-close" />
        </button>
      </div>
    </form>
    <div class="tabbed--wrapper search">
      <ul class="nav nav-pills nav-fill nav-justified">
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{
              active: currentTab === 'channels',
              disabled: !results.channels
            }"
            href="#"
            @click="switchTab('channels')"
          >
            <Icon family="far" name="comment-lines" />
            <span>{{ $t('general.channels') }}</span>
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{
              active: currentTab === 'messages',
              disabled: !results.messages
            }"
            href="#"
            @click="switchTab('messages')"
          >
            <Icon family="far" name="comment-lines" />
            <span>{{ $t('general.messages') }}</span>
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{
              active: currentTab === 'actions',
              disabled: !results.actions
            }"
            href="#"
            @click="switchTab('actions')"
          >
            <Icon family="far" name="bolt" />
            <span>{{ $t('general.actions') }}</span>
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{
              active: currentTab === 'files',
              disabled: !results.files
            }"
            href="#"
            @click="switchTab('files')"
          >
            <Icon family="far" name="file" />
            <span>{{ $t('general.files') }}</span>
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{
              active: currentTab === 'users',
              disabled: !results.users
            }"
            href="#"
            @click="switchTab('users')"
          >
            <Icon family="far" name="user" />
            <span>{{ $t('general.users') }}</span>
          </a>
        </li>
      </ul>

      <div class="tabbed--content search-results search-results-view">
        <Loader :loading="isSearching" full />
        <perfect-scrollbar
          class="h-100"
          v-if="!isSearching"
          :options="{ wheelPropagation: false }"
        >
          <div v-if="currentTab === 'channels'">
            <section>
              <div class="section-body">
                <div class="list-group popover-list popover-list--auto">
                  <router-link
                    v-on:click.native="onNavigate"
                    :to="{ name: `channel`, params: { id: item.channel.id } }"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                    v-for="item in results.channels"
                    :key="item.channel.id"
                  >
                    <div class="w-100">
                      <p class="mb-0">{{ item.channel.channel_name }}</p>
                      <p
                        v-for="highlight in item.highlighted"
                        v-bind:key="highlight"
                      >
                        <small
                          class="search-result text-muted"
                          v-html="highlight"
                        ></small>
                      </p>
                      <small class="text-muted">{{
                        $t('channels.last-updated', {
                          time: parseTime(item.channel.last_active_on).fromNow()
                        })
                      }}</small>
                    </div>
                  </router-link>
                </div>
              </div>
            </section>
          </div>

          <div v-if="currentTab === 'messages'">
            <section>
              <div class="section-body">
                <div class="list-group popover-list popover-list--auto">
                  <router-link
                    v-on:click.native="onClickMessage(item.message)"
                    @click="onNavigate"
                    :to="{
                      name: `channel`,
                      params: {
                        id: item.message.channel_id,
                        target: item.message.id
                      }
                    }"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                    v-for="item in results.messages"
                    v-bind:key="item.message.id"
                  >
                    <div class="w-100">
                      <p class="mb-0">
                        {{
                          $t('messages.search-title', {
                            userName: item.message.display_name,
                            channelName: getChannel(item.message.channel_id)
                              .channel_name
                          })
                        }}
                      </p>
                      <p
                        v-for="highlight in item.highlighted"
                        v-bind:key="highlight"
                      >
                        <small
                          class="search-result text-muted"
                          v-html="highlight"
                        ></small>
                      </p>
                    </div>
                  </router-link>
                </div>
              </div>
            </section>
          </div>
          <div v-if="currentTab === 'actions'">
            <section>
              <div class="section-body">
                <div class="list-group popover-list popover-list--auto">
                  <router-link
                    v-on:click.native="onNavigate"
                    :to="{
                      name: `channel`,
                      params: { id: item.action.channel_id }
                    }"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                    v-for="item in results.actions"
                    :key="item.action.id"
                  >
                    <div class="w-100">
                      <p class="mb-0">{{ item.action.action_name }}</p>
                      <p
                        v-for="highlight in item.highlighted"
                        v-bind:key="highlight"
                      >
                        <small
                          class="search-result text-muted"
                          v-html="highlight"
                        ></small>
                      </p>
                    </div>
                  </router-link>
                </div>
              </div>
            </section>
          </div>
          <div v-if="currentTab === 'files'">
            <section>
              <div class="section-body">
                <div class="list-group popover-list popover-list--auto">
                  <router-link
                    v-on:click.native="onClickFile(item.file)"
                    to="#"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                    v-for="item in results.files"
                    :key="item.file.fullpath"
                  >
                    <div
                      class="w-100 d-flex align-items-center justify-content-between"
                    >
                      <div>
                        <p class="mb-0">{{ item.file.name }}</p>
                        <small class="text-muted"
                          >{{ bytesToSize(item.file.size) }} -
                          {{
                            $t('files.last-modified', {
                              time: parseTime(item.file.modification).fromNow()
                            })
                          }}</small
                        >
                        <p
                          v-for="highlight in item.highlighted"
                          v-bind:key="highlight"
                        >
                          <small
                            class="search-result text-muted"
                            v-html="highlight"
                          ></small>
                        </p>
                      </div>
                      <div
                        v-if="item.file.is_wiki_file"
                        class="member-badge badge"
                      >
                        {{ $t('general.wiki') }}
                      </div>
                    </div>
                  </router-link>
                </div>
              </div>
            </section>
          </div>

          <div v-if="currentTab === 'users'">
            <section>
              <div class="section-body">
                <div class="list-group popover-list popover-list--auto">
                  <a
                    style="cursor:pointer"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                    v-for="item in results.users"
                    @click="onClickUser(item)"
                  >
                    <Avatar
                      class="avatar-sm"
                      :name="item.user.display_name"
                      :active="item.user.online_status"
                      :user-id="item.user.id"
                      :has-avatar="item.user.has_avatar"
                      :cache="item.user.img_cache"
                      size="small"
                    />
                    <div class="w-100 ml-3">
                      <p class="mb-0">{{ item.user.display_name }}</p>
                      <p
                        v-for="highlight in item.highlighted"
                        v-bind:key="highlight"
                      >
                        <small
                          class="search-result text-muted"
                          v-html="highlight"
                        ></small>
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </section>
          </div>

          <div v-if="currentTab === 'notFound'">
            <div class="empty-wrapper">
              <div class="empty-box">
                <Icon family="fal" name="search" />
                <h4>{{ $t('navbar.nothing-found') }}</h4>
                <p>{{ $t('general.try-another-keyword') }}</p>
              </div>
            </div>
          </div>
        </perfect-scrollbar>
      </div>
    </div>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';
import Icon from 'airsend/components/Icon.vue';
import Avatar from 'airsend/components/Avatar.vue';

import { parseTime, bytesToSize, parseMessageContent } from 'airsend/utils';
import { EventBus } from 'airsend/event-bus.js';

export default {
  components: {
    Modal,
    Loader,
    Icon,
    Avatar
  },
  data() {
    return {
      currentTab: 'channels',
      query: null,
      timeout: null,
      searching: 0,
      isOpen: false
    };
  },
  computed: {
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    results() {
      return this.query !== '' ? this.$store.state.core.allResults.data : {};
    },
    isSearching() {
      return this.searching > 0;
    }
  },
  methods: {
    switchTab(tabName) {
      this.currentTab = tabName;

      if (tabName === 'channels') {
        this.$store.dispatch('meeting/updateAudioDevices');
      } else if (tabName === 'messages') {
      } else if (tabName === 'actions') {
      } else if (tabName === 'files') {
      } else if (tabName === 'users') {
      }
    },
    beforeOpen({ params }) {
      if (params.tab) {
        this.currentTab = params.tab;
      } else {
        this.currentTab = 'channels';
      }
      if (params.query) {
        this.query = params.query;
      } else {
        this.query = '';
      }
    },
    onOpen(e) {
      this.onSearch({ target: { value: this.query } }, true);
    },
    onSearch: function(e, ignoreDebounce = false) {
      const { value } = e.target;

      clearTimeout(this.timeout);

      // cancel search
      if (e.key === 'Escape') {
        this.onCancelSearch();
        return;
      }

      if (value !== '') {
        this.timeout = setTimeout(
          async () => {
            this.$set(this, 'searching', this.searching + 1);
            await this.$store.dispatch(
              'core/search',
              !this.channel
                ? { query: value, limit: 30 }
                : { query: value, channel: this.channel.id, limit: 30 }
            );
            this.$set(this, 'searching', this.searching - 1);
          },
          ignoreDebounce ? 0 : 250
        );
      }
    },
    onCancelSearch() {
      this.query = '';
    },
    onClickMessage(message) {
      if (message.id) {
        EventBus.$emit('jump-to', {
          target: message.id,
          channel: message.channel_id
        });
        this.onNavigate();
      }
    },
    onClickFile(file) {
      if (file.is_wiki_file) {
        if (this.channel) {
          EventBus.$emit('wiki-preview', { file: file.fullpath.substring(1) });
        } else {
          this.$router.push({
            name: 'channel',
            params: { id: file.channel_id }
          });
          setTimeout(() => {
            EventBus.$emit('wiki-preview', {
              file: file.fullpath.substring(1)
            });
          }, 500);
        }
      } else {
        this.$router.push(`file/${file.parent}`);
      }
      this.onNavigate();
    },
    onClickUser(item) {
      this.$modal.show('user-modal', item.user);
    },
    onNavigate() {
      this.$modal.hide('search-view');
    },
    getChannel(id) {
      return this.$store.getters['channels/getChannelById'](id);
    },
    parseTime: parseTime,
    parseMessageContent: parseMessageContent,
    bytesToSize: bytesToSize
  },
  watch: {
    results: {
      deep: true,
      handler(results) {
        //this.currentTab = Object.keys(results)[0];

        if (!this.results[this.currentTab]) {
          //If the content of the current tab is empty, go to the first that is not empty
          if (results.channels) this.currentTab = 'channels';
          else if (results.messages) this.currentTab = 'messages';
          else if (results.actions) this.currentTab = 'actions';
          else if (results.files) this.currentTab = 'files';
          else if (results.users) this.currentTab = 'users';
          else this.currentTab = 'notFound';
        }
      }
    }
  }
};
</script>
