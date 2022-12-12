<template>
  <form class="form-inline my-2 my-lg-0 mr-2 search" @submit="onSubmit">
    <div class="form-group form-group--icon">
      <Icon family="far" name="search" />
      <input
        ref="input"
        @focus="onFocus"
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
    <div
      class="search-results search-results-inline"
      v-if="isOpen"
      v-bind:class="{
        [`is-loading`]:
          isSearching || (!isSearching && Object.keys(results).length === 0)
      }"
    >
      <Loader :loading="isSearching" full />

      <perfect-scrollbar
        v-click-outside="onClickOutside"
        :options="{ wheelPropagation: false }"
        v-if="!isSearching"
      >
        <div
          class="empty-wrapper"
          v-if="!isSearching && Object.keys(results).length === 0"
        >
          <div class="empty-box">
            <Icon family="fal" name="search" />
            <h4>{{ $t('navbar.nothing-found') }}</h4>
            <p>{{ $t('general.try-another-keyword') }}</p>
          </div>
        </div>

        <section v-if="results.channels && results.channels.length > 0">
          <div class="section-header">
            <Icon family="far" name="comment-lines" class="mr-2" />
            <h4>{{ $t('general.channels') }}</h4>
            <button
              class="btn btn-sm btn-ghost"
              @click="openModal('search-view', { tab: 'channels', query })"
            >
              {{ $t('general.show-all') }}
            </button>
          </div>
          <div class="section-body">
            <div class="list-group popover-list popover-list--auto">
              <router-link
                :to="{ name: `channel`, params: { id: item.channel.id } }"
                class="list-group-item list-group-item-action d-flex align-items-center"
                v-for="item in results.channels"
                :key="item.channel.id"
              >
                <div class="w-100">
                  <p class="mb-0">{{ item.channel.channel_name }}</p>
                  <p
                    v-for="(highlight, index) in item.highlighted"
                    :key="index"
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

        <section v-if="results.messages && results.messages.length > 0">
          <div class="section-header">
            <Icon family="far" name="comment-lines" class="mr-2" />
            <h4>{{ $t('general.messages') }}</h4>
            <button
              class="btn btn-sm btn-ghost"
              @click="openModal('search-view', { tab: 'messages', query })"
            >
              {{ $t('general.show-all') }}
            </button>
          </div>
          <div class="section-body">
            <div class="list-group popover-list popover-list--auto">
              <router-link
                @click.native="isOpen = false"
                :to="{
                  name:
                    $route.name == 'channel-sub' ? 'channel-sub' : 'channel',
                  params: {
                    ...$route.params,
                    id: item.message.channel_id
                  },
                  query:
                    $route.name == 'channel' || $route.name == 'channel-sub'
                      ? {
                          ...$route.query,
                          highlight: item.message.id
                        }
                      : {
                          highlight: item.message.id
                        }
                }"
                class="list-group-item list-group-item-action d-flex align-items-center"
                v-for="item in results.messages"
                :key="item.message.id"
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
                    v-for="(highlight, index) in item.highlighted"
                    :key="index"
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

        <section v-if="results.actions && results.actions.length > 0">
          <div class="section-header">
            <Icon family="far" name="bolt" class="mr-2" />
            <h4>{{ $t('general.actions') }}</h4>
            <button
              class="btn btn-sm btn-ghost"
              @click="openModal('search-view', { tab: 'actions', query })"
            >
              {{ $t('general.show-all') }}
            </button>
          </div>
          <div class="section-body">
            <div class="list-group popover-list popover-list--auto">
              <a
                @click="onClickAction(item)"
                class="list-group-item list-group-item-action d-flex align-items-center"
                v-for="item in results.actions"
              >
                <div class="w-100">
                  <p class="mb-0">{{ item.action.action_name }}</p>
                  <p
                    v-for="(highlight, index) in item.highlighted"
                    :key="index"
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

        <section v-if="results.files && results.files.length > 0">
          <div class="section-header">
            <Icon family="far" name="file" class="mr-2" />
            <h4>{{ $t('general.files') }}</h4>
            <button
              class="btn btn-sm btn-ghost"
              @click="openModal('search-view', { tab: 'files', query })"
            >
              {{ $t('general.show-all') }}
            </button>
          </div>
          <div class="section-body">
            <div class="list-group popover-list popover-list--auto">
              <a
                @click="onClickFile(item.file)"
                class="list-group-item list-group-item-action d-flex align-items-center"
                v-for="item in results.files"
              >
                <div class="w-100">
                  <div class="d-flex justify-content-between">
                    <p class="mb-0">{{ item.file.name }}</p>
                    <div
                      v-if="item.file.is_wiki_file"
                      class="member-badge badge"
                    >
                      WIKI
                    </div>
                  </div>
                  <small class="text-muted"
                    >{{ bytesToSize(item.file.size) }} -
                    {{
                      $t('files.last-modified', {
                        time: parseTime(item.file.modification).fromNow()
                      })
                    }}</small
                  >
                  <p
                    v-for="(highlight, index) in item.highlighted"
                    :key="index"
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

        <section v-if="results.users && results.users.length > 0">
          <div class="section-header">
            <Icon family="far" name="user" class="mr-2" />
            <h4>{{ $t('general.users') }}</h4>
            <button
              class="btn btn-sm btn-ghost"
              @click="openModal('search-view', { tab: 'users', query })"
            >
              {{ $t('general.show-all') }}
            </button>
          </div>
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
                    v-for="(highlight, index) in item.highlighted"
                    :key="index"
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
      </perfect-scrollbar>
    </div>
  </form>
</template>
<script>
import Vue from 'vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import Avatar from 'airsend/components/Avatar.vue';
import { parseTime, bytesToSize, parseMessageContent } from 'airsend/utils';
import { EventBus } from 'airsend/event-bus.js';

export default {
  data() {
    return {
      timeout: null,
      searching: 0,
      isOpen: false,
      query: ''
    };
  },
  computed: {
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    results() {
      return this.$store.state.core.results.data;
    },
    isSearching() {
      return this.searching > 0;
    }
  },
  methods: {
    onSubmit(e) {
      e.preventDefault();
      e.stopPropagation();
    },
    onSearch: function(e) {
      const { value } = e.target;

      clearTimeout(this.timeout);

      // cancel search
      if (e.key === 'Escape') {
        this.onCancelSearch();
        return;
      }

      if (value !== '') {
        Vue.set(this, 'isOpen', true);

        this.timeout = setTimeout(async () => {
          Vue.set(this, 'searching', this.searching + 1);
          await this.$store.dispatch(
            'core/search',
            !this.channel
              ? { query: value }
              : { query: value, channel: this.channel.id }
          );
          Vue.set(this, 'searching', this.searching - 1);
        }, 250);
      } else {
        Vue.set(this, 'isOpen', false);
      }
    },
    onFocus() {
      if (this.query !== '') {
        Vue.set(this, 'isOpen', true);
      }
    },
    onClickOutside(e) {
      if (e.target.tagName !== 'INPUT') {
        Vue.set(this, 'isOpen', false);
      }
    },
    onCancelSearch() {
      this.query = '';
      Vue.set(this, 'isOpen', false);
      this.$emit('cancel', true);
    },
    onClickMessage(message) {
      if (message.id) {
        EventBus.$emit('jump-to', {
          target: message.id,
          channel: message.channel_id
        });
      }
    },
    onClickUser(item) {
      this.$modal.show('user-modal', item.user);
    },
    onClickFile(item) {
      if (item.is_wiki_file) {
        if (this.channel) {
          EventBus.$emit('wiki-preview', { file: item.fullpath.substring(1) });
        } else {
          this.$router.push({
            name: 'channel',
            params: { id: item.channel_id }
          });
          setTimeout(() => {
            EventBus.$emit('wiki-preview', {
              file: item.fullpath.substring(1)
            });
          }, 500);
        }
        Vue.set(this, 'isOpen', false);
      } else {
        EventBus.$emit(
          'file-preview',
          [
            {
              file: item.name,
              path: item.fullpath,
              size: item.size,
              parent: item.parent,
              show_dir: true
            }
          ],
          0
        );
      }
    },
    onClickAction(item) {
      const { action } = item;
      this.$store.commit('actions/setHighlightAction', {
        id: action.id,
        channel_id: action.channel_id
      });
      this.$modal.show('action-full-view-modal', {
        channel_id: action.channel_id,
        search: action.action_name,
        sort: '3',
        action_status: null
      });
    },
    getChannel(id) {
      return this.$store.getters['channels/getChannelById'](id);
    },
    openModal(name, payload) {
      this.isOpen = false;
      this.$modal.show(name, payload);
    },
    parseTime: parseTime,
    parseMessageContent: parseMessageContent,
    bytesToSize: bytesToSize
  },
  components: {
    Icon,
    Avatar,
    Loader
  }
};
</script>
