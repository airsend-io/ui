<template>
  <fragment>
    <div
      v-if="!IS_READONLY"
      class="meeting-chat-fragment-footer"
      :class="{
        [`chat-fragment-footer--loading`]: isLoading
      }"
    >
      <fragment v-if="meeting.roomState !== 'closed'">
        <EmojiPicker @picked="insertText" @picked-gif="onPickGif" />

        <div class="chatbar">
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
                <ul class="popover-mention" v-if="filteredUsers.length > 0">
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
              </div>
            </div>

            <div
              ref="editor"
              class="chatbar-editable"
              contenteditable="true"
              :placeholder="$t(`channels.chat-say-something`)"
              @keydown="onKeyDown"
              @keyup="onKeyUp"
              @input="onChangeMessage"
            ></div>
          </div>
        </div>

        <div class="btn btn-icon btn-send" @click="submitMessage">
          <Icon family="fas" name="paper-plane" />
        </div>
      </fragment>
      <fragment v-else>
        <div class="chat-fragment-footer--read-only">
          {{ $t('meeting.closed-default-title') }}
        </div>
      </fragment>
    </div>
  </fragment>
</template>
<script>
import Vue from 'vue';
import _ from 'lodash';
import Fuse from 'fuse.js';
import store from 'store';
import moment from 'moment';
import Mentionable from '../../Mentionable.js';

import acl from 'main/mixins/acl';

import EmojiPicker from 'airsend/components/EmojiPicker.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Popover from 'airsend/components/Popover.vue';
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
    meeting() {
      return this.$store.state.meeting;
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
      Vue.set(this, 'isEditing', null);
      Vue.set(this, 'isMentioning', null);
      Vue.set(this, 'mentionableActions', []);

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

    async submitMessage(e) {
      await this.$store.dispatch('meeting/sendMessage', this.message);

      // reset state
      this.message = '';

      // clear chatbar content
      this.clearEditor();
    },

    async onPickGif(gif) {
      await this.$store.dispatch('meeting/sendMessage', gif);
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

      this.message = message;
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

    onKeyUp(e) {},

    onKeyDown(e) {
      const { key, keyCode, shiftKey } = e;
      const sel = window.getSelection();

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
          `<span class="mention action-mention" contenteditable="false" data-mention-id="${resource.resource.id}">${resource.resource_name}</span>\n`
        );
      } //TODO files, wikis.... Dont forget to change utils.js > parseMentions() when adding support for other resources

      this.isMentioning = null;
      this.query = '';
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
