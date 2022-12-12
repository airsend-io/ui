<template>
  <fragment>
    <div
      v-if="!IS_READONLY"
      class="chat-fragment-footer"
      :class="{
        [`chat-fragment-footer--loading`]: isLoading
      }"
    >
      <ul
        v-if="isCommand && message !== '' && commands.length > 0"
        class="chatbar-commands"
      >
        <li v-for="item in commands" @click="setCommand(item)">
          {{ item.command }} <small>{{ item.description }}</small>
        </li>
      </ul>

      <fragment v-if="!channel || user.role.can('channel.message')">
        <EmojiPicker @picked="insertText" @picked-gif="onPickGif" />

        <button
          v-if="!isEditing"
          class="btn btn-icon"
          @click="() => this.$refs.file.click()"
        >
          <input
            ref="file"
            type="file"
            hidden
            multiple
            @change="onChooseFile"
          />
          <Icon family="far" name="paperclip" />
        </button>

        <div class="chatbar">
          <div v-if="quote" class="chatbar-extension chatbar-extension--quote">
            <Icon family="fad" name="quote-left" />
            <button class="btn btn-icon" @click="cancelQuote">
              <Icon family="far" name="times" class="close-btn" />
            </button>
            <div class="quote-content" v-html="quote.content_rich"></div>
            <div class="quote-author">
              <a>{{ quote.display_name }}</a
              ><small>
                -
                {{ parseTime(quote.created_on).format('dddd, hh:mm A') }}</small
              >
            </div>
          </div>

          <div
            v-if="files && files.length > 0"
            class="chatbar-extension chatbar-extension--attachments"
          >
            <button class="btn btn-icon" @click="cancelFiles">
              <Icon family="far" name="times" class="close-btn" />
            </button>

            <ul class="attachment-list">
              <li
                v-for="(file, index) in files.slice(
                  0,
                  files.length > 3 ? 2 : 3
                )"
                :key="index"
              >
                <div class="single-attachment">
                  <button class="btn btn-icon" @click="cancelFile(index)">
                    <Icon family="far" name="times" class="close-btn" />
                  </button>
                  <FileIcon :name="file.name" :thumb="file.thumb" />
                  <div>
                    <p>{{ file.name }}</p>
                    <small>{{ bytesToSize(file.size) }}</small>
                  </div>
                </div>
              </li>

              <li v-if="files.length > 3">
                <Popover
                  :boundaries-element="$refs.container"
                  popover-base-class="popover tooltip popover-attachments"
                >
                  <div class="single-attachment">
                    <FileIcon name="more" />
                    <div>
                      <p>
                        {{ $tc('channels.chat-more-files', files.length - 2) }}
                      </p>
                      <small>{{
                        $t('channels.chat-more-files-description')
                      }}</small>
                    </div>
                  </div>
                  <template slot="popover">
                    <perfect-scrollbar
                      class="attachment-list attachment-list-popover"
                    >
                      <li v-for="(file, index) in files.slice(2)" :key="index">
                        <div class="single-attachment pr-5">
                          <button
                            class="btn btn-icon"
                            @click="cancelFile(index)"
                          >
                            <Icon family="far" name="times" class="close-btn" />
                          </button>
                          <FileIcon :name="file.file" :thumb="file.thumb" />
                          <div class="single-attachment-info">
                            <p>{{ file.name }}</p>
                            <small>{{ bytesToSize(file.size) }}</small>
                          </div>
                        </div>
                      </li>
                    </perfect-scrollbar>
                  </template>
                </Popover>
              </li>
            </ul>
          </div>

          <div class="chatbar-holder">
            <div
              class="popover fade popover-dark bs-popover-top"
              x-placement="top"
              v-bind:style="{
                left: leftPopoverBound + 'px',
                bottom: topPopoverBound + 'px'
              }"
              :class="{
                show:
                  (isMentioningUser && filteredUsers.length > 0) ||
                  (isMentioningResource &&
                    !isLoadingMentionableContent &&
                    lastResourceQueryFetched == query &&
                    filteredMentionableResource.length > 0) ||
                  (isMentioningResource && this.channel.action_count === 0)
              }"
              ref="popover"
            >
              <div class="popover-body">
                <ul
                  class="popover-mention"
                  v-if="filteredUsers.length > 0 && isMentioningUser"
                >
                  <li
                    v-for="(user, index) in filteredUsers"
                    :class="{ 'is-selected': navigatedUserIndex === index }"
                    :key="user.id"
                  >
                    <a @click="insertMention(user)">
                      <Avatar
                        :name="user.display_name"
                        :user-id="user.id"
                        :has-avatar="user.has_avatar"
                        :cache="user.updated_on_ts"
                        size="medium"
                        v-if="user.id !== 'all'"
                      />
                      <div class="avatar" v-else>
                        <Icon family="fas" name="users" />
                      </div>
                      {{ user.display_name }}
                    </a>
                  </li>
                </ul>
                <ul
                  v-else-if="
                    isMentioningResource && this.channel.action_count === 0
                  "
                  class="popover-mention"
                >
                  <li>
                    <span class="no-content">{{
                      $t('actions.no-actions-for-the-channel')
                    }}</span>
                  </li>
                  <li>
                    <a class="add-action" @click="onAddActionClick">
                      <div class="avatar">
                        <Icon family="fas" name="plus" />
                      </div>
                      {{ $t('actions.add-action') }}
                    </a>
                  </li>
                </ul>
                <ul
                  class="popover-mention"
                  v-else-if="
                    filteredMentionableResource.length > 0 &&
                      isMentioningResource
                  "
                >
                  <li
                    v-for="(content, index) in filteredMentionableResource"
                    :class="{ 'is-selected': navigatedUserIndex === index }"
                    :key="`mentionable-content-${index}`"
                  >
                    <a @click="insertMention(content)">
                      <div class="avatar">
                        <Icon family="fas" name="bolt" />
                      </div>
                      <span v-html="content.resource_name" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div
              ref="editor"
              class="chatbar-editable"
              contenteditable="true"
              :placeholder="placeholderText"
              @keydown="onKeyDown"
              @keyup="onKeyUp"
              @input="onChangeMessage"
            ></div>
          </div>
        </div>

        <div class="btn btn-icon btn-send" @click="submitMessage">
          <Loader loading v-if="isFetchingMentionableResource" />
          <Icon
            v-else-if="!isEditing && !shouldSendEmail"
            family="fas"
            name="paper-plane"
          />
          <Icon
            v-else-if="!isEditing && shouldSendEmail"
            family="fas"
            name="envelope"
          />
          <Icon v-if="isEditing" family="fal" name="times" />
        </div>

        <Popover
          v-if="this.channel && !channel.public_url"
          popover-base-class="popover tooltip popover-attachments"
        >
          <div class="btn btn-icon">
            <Icon family="fal" name="ellipsis-h" />
          </div>
          <template slot="popover">
            <div class="dropdown-items">
              <button
                v-close-popover
                class="dropdown-item"
                :class="{ active: !shouldSendEmail }"
                type="button"
                @click="onSelectSendType(false)"
              >
                <Icon family="fal" name="paper-plane" />
                {{ $t('channels.chat-message-only') }}
              </button>
              <button
                v-close-popover
                class="dropdown-item"
                :class="{ active: shouldSendEmail }"
                type="button"
                @click="onSelectSendType(true)"
              >
                <Icon family="fal" name="envelope" />
                {{ $t('channels.chat-message-email') }}
              </button>
            </div>
          </template>
        </Popover>
      </fragment>
      <fragment v-else>
        <div class="chat-fragment-footer--read-only">
          {{ $t('channels.not-allowed-to-chat') }}
        </div>
      </fragment>
    </div>
    <div v-else-if="IS_READONLY" class="chat-fragment-footer">
      <div
        v-if="this.$router.history.current.query.hash"
        class="chat-fragment-footer--read-only"
        @click="onClickLink($event, user.id ? 'join-channel' : 'auth')"
        v-html="$t(`channels.chat-public-${user.id ? 'join' : 'auth'}`)"
      ></div>
      <div
        v-else
        class="chat-fragment-footer--read-only"
        @click="
          onClickLink($event, user.account_status === 50 ? 'finalize' : 'auth')
        "
        v-html="
          $t(
            `channels.chat-read-only-${
              user.account_status === 50 ? 'finalize' : 'auth'
            }`
          )
        "
      ></div>
    </div>
  </fragment>
</template>
<script>
import Vue from 'vue';
import _ from 'lodash';
import Fuse from 'fuse.js';
import store from 'store';
import moment from 'moment';
import Mentionable from '../Mentionable.js';

import acl from 'main/mixins/acl';

import EmojiPicker from 'airsend/components/EmojiPicker.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Popover from 'airsend/components/Popover.vue';
import FileIcon from 'airsend/components/FileIcon.vue';
import { EventBus } from 'airsend/event-bus.js';

import {
  retrieveFiles,
  bytesToSize,
  parseMentions,
  parseTime,
  htmlToMessage
} from 'airsend/utils';

export default {
  components: {
    EmojiPicker,
    Icon,
    FileIcon,
    Mentionable,
    Popover,
    Avatar,
    Loader
  },
  mixins: [acl],
  data() {
    return {
      message: '',
      quote: null,
      files: null,
      isEditing: null, // stores message id
      isCommand: false,
      isSendingMessage: false,
      shouldSendEmail: false,
      ismtng: false,
      range: null,
      isMentioning: null,
      startOffset: 0,
      endOffset: 0,
      node: null,
      query: '',
      navigatedUserIndex: 0,
      leftPopoverBound: 0,
      topPopoverBound: 0,
      shouldStartMentionOfType: null,
      mentionableActions: [],
      lastResourceQueryFetched: '',
      tipVal: 0,
      isFetchingMentionableResource: false
    };
  },
  computed: {
    isLoading() {
      return this.$store.state.loading['chat.command'];
    },
    isLoadingMentionableContent() {
      return this.$store.state.loading['actions/searchMentionableActions'];
    },
    currentChannelId() {
      return parseInt(this.$route.params.id);
    },
    shouldStartUserMention() {
      return this.shouldStartMentionOfType === 'user';
    },
    shouldStartResourceMention() {
      return this.shouldStartMentionOfType === 'resource';
    },
    isMentioningUser() {
      return this.isMentioning === 'user';
    },
    isMentioningResource() {
      return this.isMentioning === 'resource';
    },
    tribute() {
      return {
        values:
          this.channel && this.channel.members
            ? [
                {
                  key: 'all',
                  value: 'all',
                  is_all: true,
                  id: 'all'
                },
                ...this.channel.members.map(member => {
                  return {
                    key: member.display_name,
                    value: member.display_name,
                    has_avatar: member.has_avatar,
                    id: member.id,
                    last_active_on_ts: member.last_active_on_ts
                  };
                })
              ]
            : [],
        menuItemLimit: 5,
        selectTemplate: function(item) {
          return `<span class="mention" contenteditable="false" data-mention-id="${item.original.id}">${item.original.value}</span>`;
        },
        menuItemTemplate: item => {
          let avatar = '';

          if (item.original.is_all) {
            avatar =
              '<div class="avatar"><i class="inline-icon fa fa-users"></i></div>';
          } else if (item.original.has_avatar) {
            avatar = `<div class="avatar avatar--has-image"><img src="${process.env.VUE_APP_ROOT_API}/v1/user.image.get?user_id=${item.original.id}&image_class=small&v=${item.original.last_active_on_ts}&token=${this.user.token}" /></div>`;
          } else {
            var names = item.original.value.split(' '),
              initials = names[0].substring(0, 1).toUpperCase();

            if (names.length > 1) {
              initials += names[names.length - 1].substring(0, 1).toUpperCase();
            }

            avatar = `<div class="avatar">${initials}</div>`;
          }

          return `${avatar} ${item.original.key}`;
        }
      };
    },
    users() {
      return this.channel && this.channel.members
        ? [
            {
              display_name: 'all',
              is_all: true,
              id: 'all'
            },
            ...this.channel.members
          ]
        : [];
    },
    filteredUsers() {
      if (this.query) {
        const fuse = new Fuse(this.users, {
          threshold: 0.2,
          keys: ['display_name']
        });
        return fuse.search(this.query).slice(0, 5);
      } else {
        return this.users.slice(0, 5);
      }
    },
    filteredMentionableResource() {
      let content = [];

      //actions
      const actions = this.mentionableActions;
      content = content.concat(actions);

      //TODO files and wiki

      return content.slice(0, 10);
    },
    contextActions() {
      return this.$store.getters['actions/getActionsByChannel'](
        this.$route.params.id
      );
    },
    commands() {
      return this.channel
        ? _.filter(this.channel.commands, item => {
            return (
              this.channel &&
              _.startsWith(item.command, this.message) &&
              (this.user.role.level >= item.level ||
                this.user.id === this.channel.created_by)
            );
          })
        : [];
    },

    isMobile() {
      return this.$store.state.core.isMobile;
    },
    placeholderText() {
      return this.isMobile || this.tipVal === 0
        ? this.$t('channels.chat-say-something')
        : this.$t(`channels.chat-say-something-${this.tipVal}`);
    }
  },
  watch: {
    $route(to, from) {
      if (from.params.id != to.params.id || from.name !== 'channel') {
        this.load();
      }
    },
    query(query) {
      if (this.isMentioningResource) {
        this.isFetchingMentionableResource = true;
        this.debouncedFetchMentionableResource(query);
      }
    }
  },
  async mounted() {
    // listen to paste event
    window.addEventListener('paste', this.onPaste);

    if (this.$refs.editor) {
      this.$refs.editor.addEventListener('paste', e => {
        e.preventDefault();
        this.range = null;
        this.insertText(e.clipboardData.getData('Text'));
      });
    }

    this.load();
  },

  destroyed() {
    // unlisten to events
    window.removeEventListener('paste', this.onPaste);
  },
  methods: {
    load() {
      Vue.set(this, 'tipVal', this.tipVal < 3 ? this.tipVal + 1 : 1);

      Vue.set(this, 'isEditing', null);
      Vue.set(this, 'isMentioning', null);
      Vue.set(this, 'mentionableActions', []);

      console.log('LOADING');

      return;

      this.fetchMentionableResource();

      const { id } = this.$route.params;

      // if has message saved locally
      if (store.get(`message_${id}`)) {
        this.setMessage(store.get(`message_${id}`));
      } else {
        this.clearEditor();
      }

      // send email param
      this.shouldSendEmail = store.get(`send_type_${id}`)
        ? store.get(`send_type_${id}`)
        : false;

      if (this.$refs.editor) this.$refs.editor.focus();
    },
    onAddActionClick() {
      this.$router.push(`/channel/${this.channel.id}/actions`);
      this.$modal.show('action-create', {
        context: 'create',
        message: { content: this.message },
        name: this.query
      });
      this.isMentioning = null;
      this.query = '';
    },
    async fetchMentionableResource(query) {
      if (query === '') {
        this.lastResourceQueryFetched = '';
        this.getResourcesFromContext();
        this.isFetchingMentionableResource = false;
      } else if (query !== this.lastResourceQueryFetched) {
        this.$store
          .dispatch('actions/searchMentionableActions', {
            channel_id: this.currentChannelId,
            query
          })
          .then(actions => {
            this.mentionableActions = actions;
            this.isFetchingMentionableResource = false;
          });
        this.lastResourceQueryFetched = query || '';
      }
    },

    debouncedFetchMentionableResource: _.debounce(function(query) {
      this.fetchMentionableResource(query);
    }, 400),

    async jumpToRecent() {
      this.$store.commit('channels/clearMessages', this.$route.params.id);
      await this.$store.dispatch('channels/history', this.$route.params.id);

      await this.$store.dispatch('channels/readAll', {
        channel_id: this.channel.id,
        channel_name: this.channel.channel_name
      });
    },

    async submitMessage(e) {
      // if (this.isSendingMessage) return;

      this.isSendingMessage = true;

      // if on historical view, jump to recent
      if (
        this.channel.chat.has_more_newer ||
        (this.channel.chat.buffer &&
          this.channel.chat.buffer.newer &&
          this.channel.chat.buffer.newer.length > 0)
      ) {
        await this.jumpToRecent();
      }

      if (this.isEditing) {
        // it's a click on send/delete button
        if (typeof e === 'boolean') {
          this.submitUpdate();
        } else {
          this.cancelMessageEdit();
        }

        this.isSendingMessage = false;
        return;
      }

      let message = this.message;

      // check if it's a command
      if (message[0] === '/') {
        await this.$store.dispatch('channels/command', {
          text: message,
          channel_id: this.currentChannelId
        });

        this.clearEditor();

        this.isSendingMessage = false;

        // reset state
        this.message = '';
        this.files = null;
        this.quote = null;

        return;
      }

      let payload = {
        text: message,
        channel_id: this.currentChannelId,
        send_email: this.shouldSendEmail ? '1' : '0'
      };

      if (this.quote) {
        payload.quote_message_id = this.quote.id;
      }

      if (this.files && this.files.length > 0) {
        payload.files = await retrieveFiles(this.files);
        payload.channel = this.channel;

        // reset state
        this.message = '';
        this.files = null;
        this.quote = null;

        // clear chatbar content
        this.clearEditor();

        await this.$store.dispatch('channels/sendWithAttachments', payload);
      } else {
        // clear chatbar content
        this.clearEditor();

        // reset state
        this.message = '';
        this.quote = null;

        await this.$store.dispatch('channels/send', payload);
      }

      // emit to parent
      EventBus.$emit('message-sent', true);

      store.remove(`message_${this.currentChannelId}`);

      this.isSendingMessage = false;
    },

    async onPickGif(gif) {
      let payload = {
        text: gif,
        channel_id: this.currentChannelId,
        send_email: 0
      };

      if (this.quote) {
        payload.quote_message_id = this.quote.id;
      }

      this.quote = null;

      await this.$store.dispatch('channels/send', payload);
    },

    async submitUpdate() {
      await this.$store.dispatch('channels/handleUpdateMessage', {
        message_id: this.isEditing.id,
        text: this.message
      });

      Vue.set(this, 'isEditing', null);

      this.clearEditor();

      store.remove(`message_${this.currentChannelId}`);
    },

    updateRange() {
      var sel;
      if (window.getSelection) {
        sel = window.getSelection();
        this.range = sel.getRangeAt(0);
      }
    },

    onChangeMessage(e) {
      this.updateRange();

      const message = htmlToMessage(
        e ? e.target.innerHTML : this.$refs.editor.innerHTML
      );

      //this.message = _.unescape(message);

      this.message = message;
      this.isCommand = message[0] === '/';

      store.set(`message_${this.currentChannelId}`, message);

      if (message !== '' && this.channel) {
        this.$store.dispatch('channels/sendTypingEvent', this.channel.id);
      }

      if (message === '' && this.isEditing) {
        this.isEditing = null;
      }
    },

    cancelMessageEdit() {
      this.message = '';
      this.isEditing = null;
      this.clearEditor();
    },

    onEditMessage(messageToEdit) {
      // get last messageToEdit from user
      if (typeof messageToEdit === 'boolean') {
        messageToEdit = this.getLastMessage();
      }

      if (messageToEdit && messageToEdit.content && this.message === '') {
        Vue.set(this, 'isEditing', messageToEdit);
        this.setMessage(messageToEdit.content);
      }
    },

    moveCursorToEnd() {
      if (this.$refs.editor.innerText && document.createRange) {
        let sel = document.getSelection();
        let range = document.createRange();

        range.selectNodeContents(this.$refs.editor);
        range.collapse(false);

        sel.removeAllRanges();
        sel.addRange(range);
        this.$refs.editor.focus();
        range.detach(); // optimization
      }
    },
    getCharacterPrecedingCaret() {
      var precedingChar = '',
        sel,
        range,
        precedingRange;
      if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount > 0) {
          range = sel.getRangeAt(0).cloneRange();
          range.collapse(true);
          range.setStart(this.$refs.editor, 0);
          precedingChar = range.toString().slice(-1);
        }
      } else if ((sel = document.selection) && sel.type != 'Control') {
        range = this.range;
        precedingRange = range.duplicate();
        precedingRange.moveToElementText(this.$refs.editor);
        precedingRange.setEndPoint('EndToStart', range);
        precedingChar = precedingRange.text.slice(-1);
      }
      return precedingChar;
    },

    onKeyUp(e) {
      const { key, keyCode, shiftKey } = e;
      let sel = window.getSelection();

      if (key === 'Backspace') {
        //detect when the user exits from mentioning context by pressing space and wants to go back to the mentioning context
        let lastIndexOfSpace = this.message.lastIndexOf(' ');
        let lastIndexOfHashtag = this.message.lastIndexOf('#');
        let lastIndexOfAt = this.message.lastIndexOf('@');

        if (
          lastIndexOfHashtag > lastIndexOfSpace &&
          (lastIndexOfHashtag === 0 ||
            this.message[lastIndexOfHashtag - 1] === ' ')
        ) {
          // this is a test message with #mention...
          this.shouldStartMentionOfType = 'resource';
          this.startOffset = lastIndexOfHashtag + 1;
        }
        if (
          lastIndexOfAt > lastIndexOfSpace &&
          (lastIndexOfAt === 0 || this.message[lastIndexOfAt - 1] === ' ')
        ) {
          // this is a test message with @userName...
          this.shouldStartMentionOfType = 'user';
          this.startOffset = lastIndexOfAt + 1;
        }
      }

      // start mentioning when pressing @
      if (this.shouldStartUserMention || this.shouldStartResourceMention) {
        if (this.shouldStartResourceMention && key !== 'Backspace') {
          this.lastResourceQueryFetched = '';
          this.getResourcesFromContext();
        }

        this.isMentioning = this.shouldStartUserMention ? 'user' : 'resource';

        this.shouldStartMentionOfType = null;

        const bounds = sel.getRangeAt(0).getBoundingClientRect();
        const editorBounds = this.$refs.editor.getBoundingClientRect();
        const popoverBounds = this.$refs.popover.getBoundingClientRect();

        this.leftPopoverBound =
          bounds.left - editorBounds.left - popoverBounds.width / 2;
        this.topPopoverBound = window.innerHeight - bounds.bottom + 16;

        this.navigatedUserIndex = 0;

        if (key !== 'Backspace') {
          this.startOffset = sel.focusOffset;
        }

        this.node = sel.focusNode;
      }

      if (this.isMentioningUser || this.isMentioningResource) {
        this.endOffset = sel.focusOffset;

        // space
        if (keyCode === 32) {
          this.isMentioning = null;
          this.query = '';
        }

        // ESC
        if (keyCode === 27) {
          this.isMentioning = null;
          this.query = '';

          const range = sel.getRangeAt(0);
          range.setStart(this.node, this.startOffset - 1);
          range.deleteContents();

          return;
        }

        // Enter
        if (keyCode === 13) {
          if (
            this.isMentioningUser &&
            this.filteredUsers[this.navigatedUserIndex]
          ) {
            this.insertMention(this.filteredUsers[this.navigatedUserIndex]);
          } else if (
            this.isMentioningResource &&
            !this.isFetchingMentionableResource &&
            this.filteredMentionableResource[this.navigatedUserIndex]
          ) {
            this.insertMention(
              this.filteredMentionableResource[this.navigatedUserIndex]
            );
          }
          return;
        }

        // on delete @ or #
        if (this.endOffset < this.startOffset) {
          this.isMentioning = null;
          this.query = '';
          return;
        }

        var range = sel.getRangeAt(0).cloneRange();
        range.collapse(true);
        range.setStart(this.node, this.startOffset);

        const query = range.toString();

        if (query !== this.query) {
          this.navigatedUserIndex = 0;
        }

        this.query = query;
      }
    },

    onKeyDown(e) {
      const { key, keyCode, shiftKey } = e;
      const sel = window.getSelection();

      if (this.isMentioning) {
        if (key === 'Enter') {
          if (
            (this.isMentioningUser &&
              this.filteredUsers[this.navigatedUserIndex]) ||
            (this.isMentioningResource &&
              this.filteredMentionableResource[this.navigatedUserIndex])
          ) {
            //propagate event if there is no results
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }

        if (key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          if (this.isMentioningUser) {
            if (this.navigatedUserIndex < this.filteredUsers.length - 1)
              this.navigatedUserIndex++;
          } else if (this.isMentioningResource) {
            if (
              this.navigatedUserIndex <
              this.filteredMentionableResource.length - 1
            )
              this.navigatedUserIndex++;
          }
          return;
        }

        if (key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          if (this.navigatedUserIndex > 0) this.navigatedUserIndex--;
          return;
        }
      }

      // start mentioning user when pressing @
      if (key == '@') {
        if (
          this.message.length === 0 ||
          this.getCharacterPrecedingCaret() === ' '
        ) {
          //prevent start mentioning when typing an email
          this.shouldStartMentionOfType = 'user';
        }
      }

      // start mentioning content when pressing #
      if (key == '#') {
        if (
          this.message.length === 0 ||
          this.getCharacterPrecedingCaret() === ' '
        ) {
          this.shouldStartMentionOfType = 'resource';
        }
      }

      // enter to send message
      if (key === 'Enter' && !shiftKey) {
        e.preventDefault();
        e.stopPropagation();

        this.submitMessage(true);

        return false;
      }

      // cancel message
      if (key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();

        this.cancelMessageEdit();
        this.cancelQuote();
        this.cancelFiles();

        return false;
      }

      // edit last message
      if (key === 'ArrowUp' && this.message === '') {
        e.preventDefault();

        this.onEditMessage(true);

        return false;
      }
    },

    insertMention(resource) {
      this.range.setStart(this.node, this.startOffset - 1);
      this.range.deleteContents();

      if (this.isMentioningUser) {
        this.insertNode(
          `<span class="mention user-mention" contenteditable="false" data-mention-id="${resource.id}">${resource.display_name}</span>\n`
        );
      } else if (
        this.isMentioningResource &&
        resource.resource_type === 'action'
      ) {
        this.insertNode(
          `<span class="mention mention-action" contenteditable="false" data-mention-id="${resource.resource.id}">${resource.resource_name}</span>\n`
        );
      } //TODO files, wikis.... Dont forget to change utils.js > parseMentions() when adding support for other resources

      this.isMentioning = null;
      this.query = '';
    },

    setCommand({ result, hasParams }) {
      this.setMessage(result);
      this.isCommand = false;

      if (!hasParams) {
        this.submitMessage();
      }
    },

    setMessage(message) {
      Vue.set(this, 'message', message);

      if (!this.$refs.editor) return;

      this.$refs.editor.innerHTML = '';
      this.$refs.editor.focus();
      this.$refs.editor.innerHTML = parseMentions(message);
      this.moveCursorToEnd();
      this.updateRange();
    },

    clearEditor() {
      const { id } = this.$route.params;
      this.setMessage('');
      store.remove(`message_${id}`);
      this.isCommand = false;
    },

    // insert text to editor
    insertText(text) {
      let sel, range;

      this.$refs.editor.focus();
      if (window.getSelection) {
        sel = window.getSelection();
        range = this.range ? this.range : sel.getRangeAt(0);
        range.deleteContents();
        var textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
        this.onChangeMessage();
      }
    },

    insertNode(text) {
      if (window.getSelection) {
        const node = this.createElementFromHTML(text);
        var sel = window.getSelection();
        if (sel.rangeCount) {
          let range = this.range ? this.range : sel.getRangeAt(0);
          range.collapse(false);
          range.insertNode(node);
          range.setStartAfter(node);
          sel.removeAllRanges();
          sel.addRange(range);

          this.insertText(' '); // add space
        }
      }
    },

    createElementFromHTML(htmlString) {
      var div = document.createElement('div');
      div.innerHTML = htmlString.trim();

      // Change this to div.childNodes to support multiple top-level nodes
      return div.firstChild;
    },

    onChooseFile(e) {
      let files = [];
      let selectedFiles = e.target.files;

      if (!selectedFiles) {
        return;
      }

      [...selectedFiles].forEach(f => {
        files.push(f);
      });

      if (files.length) {
        this.onDropFile(files);
        this.$refs.file.value = null;
      }
    },
    async onDropFile(files) {
      if (this.files) {
        files = [...this.files, ...files];
      }

      this.files = await retrieveFiles(files);
    },
    // cancel all files
    cancelFiles() {
      this.files = null;
    },
    // cancel single file
    cancelFile(key) {
      Vue.delete(this.files, key);
    },

    onQuote(message) {
      this.quote = message;
      this.$refs.editor.focus();
    },
    cancelQuote() {
      this.quote = null;
    },

    onSelectSendType(type) {
      this.shouldSendEmail = type;
      store.set(`send_type_${this.currentChannelId}`, type);
    },
    // get last message from user
    getLastMessage() {
      if (!this.channel || !this.channel.chat || !this.channel.chat.history)
        return;
      const history = [...this.channel.chat.history].reverse();
      for (var i = 0; i < history.length; i++) {
        let message = history[i];
        if (message.user_id === this.user.id && !message.is_deleted) {
          return message;
        }
      }
    },
    onPaste(e) {
      const { items } = e.clipboardData;

      if (items) {
        let files = [];

        for (var i = 0; i < items.length; i++) {
          let file = items[i].getAsFile();
          if (file) {
            files.push(
              new File(
                [file],
                `clipboard-${moment().format('YYYY-MM-DD-hhmmss')}.png`
              )
            );
          }
        }

        // if there are files
        if (files.length > 0) {
          e.preventDefault();
          e.stopPropagation();

          this.onDropFile(files);
        }
      }
    },
    onToggleMentionable(visible) {
      this.ismtng = visible;
    },
    onClickLink(e, modal) {
      if (e.target.nodeName === 'A') {
        this.$modal.show(modal);
      }
    },
    getResourcesFromContext() {
      let actions = this.contextActions;
      if (actions.length > 0) {
        let resources = [];

        //Add all tasks that the user are seeing (tasks and subtasks of expanded tasks)
        actions.forEach(action => {
          resources.push({
            resource_name: action.action_name,
            resource_type: 'action',
            resource: action
          });
          if (action.meta.expanded) {
            action.children.forEach(child => {
              resources.push({
                resource_name: child.action_name,
                resource_type: 'action',
                resource: child
              });
            });
          }
        });

        this.mentionableActions = resources;
      }
    },
    bytesToSize,
    parseTime
  }
};
</script>
