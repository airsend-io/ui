<template>
  <fragment>
    <div
      v-if="!IS_READONLY && channel && !channel.blocked_on"
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
        <EmojiPicker @picked="onPickEmoji" @picked-gif="onPickGif" />

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
            <EditorContent :editor="editor" />
          </div>
        </div>

        <div class="btn btn-icon btn-send" @click="submitMessage">
          <Icon
            v-if="!isEditing && !shouldSendEmail"
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
import tippy from 'tippy.js';
import _ from 'lodash';
import Fuse from 'fuse.js';
import store from 'store';
import moment from 'moment';
import MentionList from './ChatbarMentionList.vue';
import ActionMentionList from './ChatbarActionMentionList.vue';

import acl from 'main/mixins/acl';

import EmojiPicker from 'airsend/components/EmojiPicker.vue';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Popover from 'airsend/components/Popover.vue';
import FileIcon from 'airsend/components/FileIcon.vue';
import { EventBus } from 'airsend/event-bus.js';

// tiptap v2
import { Editor, EditorContent, Extension, VueRenderer } from '@tiptap/vue-2';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from './ChatbarMentionNode.js';
import Link from './ChatbarLinks.js';
import ActionMention from './ChatbarActionMentionNode.js';
import History from '@tiptap/extension-history';

import {
  retrieveFiles,
  bytesToSize,
  parseMentions,
  parseTime,
  htmlToMessage,
  wrapText
} from 'airsend/utils';

export default {
  components: {
    EmojiPicker,
    Icon,
    FileIcon,
    Popover,
    Avatar,
    Loader,
    EditorContent
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
      node: null,
      query: '',
      tipVal: 1,
      editor: null,
      isMentioning: false
    };
  },
  computed: {
    isLoading() {
      return this.$store.state.loading['chat.command'];
    },
    currentChannelId() {
      return parseInt(this.$route.params.id);
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
        : this.$t(`channels.chat-say-something-${this.tipVal}`, {
            metaKey: /Mac|iPod|iPhone|iPad/.test(navigator.platform)
              ? 'Cmd'
              : 'Ctrl'
          });
    }
  },
  watch: {
    $route(to, from) {
      if (from.params.id != to.params.id || from.name !== 'channel') {
        this.load();
      }
    }
  },
  async mounted() {
    // listen to paste event
    window.addEventListener('paste', this.onPaste);

    this.editor = new Editor({
      extensions: [
        Document,
        Paragraph,
        Text,
        Link,
        History,
        Placeholder.configure({
          placeholder: this.placeholderText,
          emptyEditorClass: 'is-editor-empty'
        }),
        // handle enter key
        Extension.create({
          addKeyboardShortcuts: () => {
            return {
              Enter: ({ editor }) => {
                const parentContext = editor.contentComponent.$parent;

                // prevent submiting when shift is true
                if (editor._hasShift) {
                  editor._hasShift = false;
                  return false;
                }

                if (
                  !editor.isEmpty ||
                  (parentContext.files && parentContext.files.length > 0)
                ) {
                  parentContext.submitMessage(true);
                }

                return true;
              },
              'Shift-Enter': ({ editor }) => {
                editor._hasShift = true;
                editor.commands.enter();
              },
              ArrowUp: ({ editor }) => {
                const parentContext = editor.contentComponent.$parent;

                if (editor.isEmpty) {
                  parentContext.onEditMessage(true);
                  return true;
                }

                return false;
              },
              // cancel message
              Escape: ({ editor }) => {
                if (this.isMentioning) return false;

                const parentContext = editor.contentComponent.$parent;

                parentContext.cancelMessageEdit();
                parentContext.cancelQuote();
                parentContext.cancelFiles();

                return true;
              }
            };
          }
        }),
        Mention.configure({
          HTMLAttributes: {
            class: 'mention mention-user'
          },
          suggestion: {
            allowSpaces: true,
            items: query => {
              if (query !== '') {
                const fuse = new Fuse(this.users, {
                  threshold: 0.2,
                  includeScore: true,
                  keys: ['display_name']
                });

                const results = fuse.search(query).filter(item => {
                  return item.score < 0.1;
                });

                return results.slice(0, 5).map(({ item }) => item);
              } else {
                return this.users.slice(0, 5);
              }
            },
            render: () => {
              let component;
              let popup;
              let asset = 'users';

              return {
                onStart: props => {
                  this.$set(this, 'isMentioning', true);

                  component = new VueRenderer(MentionList, {
                    parent: this,
                    propsData: {
                      ...props,
                      asset
                    }
                  });

                  popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start'
                  });
                },
                onUpdate(props) {
                  component.updateProps({
                    ...props,
                    asset
                  });
                  popup[0].setProps({
                    getReferenceClientRect: props.clientRect
                  });
                },
                onKeyDown(props) {
                  if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                  }

                  return component ? component.ref.onKeyDown(props) : null;
                },
                onExit: () => {
                  this.$set(this, 'isMentioning', false);
                  popup[0].destroy();
                  component.destroy();
                }
              };
            }
          }
        }),

        // action mention
        ActionMention.configure({
          HTMLAttributes: {
            class: 'mention mention-action'
          },
          suggestion: {
            allowSpaces: true,
            char: '#',
            render: () => {
              let component;
              let popup;
              let asset = 'actions';

              return {
                onStart: props => {
                  this.$set(this, 'isMentioning', true);

                  component = new VueRenderer(ActionMentionList, {
                    parent: this,
                    propsData: {
                      ...props,
                      asset
                    }
                  });

                  popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start'
                  });
                },
                onUpdate(props) {
                  component.updateProps({
                    ...props,
                    asset
                  });
                  popup[0].setProps({
                    getReferenceClientRect: props.clientRect
                  });
                },
                onKeyDown(props) {
                  if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                  }

                  return component ? component.ref.onKeyDown(props) : null;
                },
                onExit: () => {
                  this.$set(this, 'isMentioning', false);
                  popup[0].destroy();
                  component.destroy();
                }
              };
            }
          }
        })
      ],
      useBuiltInExtensions: false,
      parseOptions: {
        preserveWhitespace: true
      },
      content: '',
      onUpdate() {
        const parentContext = this.contentComponent.$parent;

        // parse message content
        const html = this.getHTML();
        const message = htmlToMessage(html);

        parentContext.message = message;
        parentContext.isCommand = message[0] === '/';

        store.set(`message_${parentContext.channel.id}`, message);

        if (message !== '' && parentContext.channel) {
          parentContext.$store.dispatch(
            'channels/sendTypingEvent',
            parentContext.channel.id
          );
        }

        if (message === '' && parentContext.isEditing) {
          parentContext.isEditing = null;
        }

        return false;
      }
    });

    window.editor = this.editor;

    this.load();
  },

  destroyed() {
    // unlisten to events
    window.removeEventListener('paste', this.onPaste);
  },
  methods: {
    load() {
      // change placeholder
      if (this.editor && this.editor.extensionManager) {
        for (
          var i = 0;
          i < this.editor.extensionManager.extensions.length;
          i++
        ) {
          if (
            this.editor.extensionManager.extensions[i].options &&
            this.editor.extensionManager.extensions[i].options.placeholder
          ) {
            this.editor.extensionManager.extensions[
              i
            ].options.placeholder = this.placeholderText;
          }
        }
      }

      Vue.set(this, 'tipVal', this.tipVal < 4 ? this.tipVal + 1 : 1);

      Vue.set(this, 'isEditing', null);

      const { id } = this.$route.params;

      // if has message saved locally
      if (store.get(`message_${id}`)) {
        this.setMessage(store.get(`message_${id}`));
      } else {
        this.clearEditor();
      }

      // focus on chatbar
      if (this.editor && this.editor.commands) this.editor.commands.focus();

      // send email param
      this.shouldSendEmail = store.get(`send_type_${id}`)
        ? store.get(`send_type_${id}`)
        : false;
    },

    async jumpToRecent() {
      this.$store.commit('channels/clearMessages', this.$route.params.id);
      await this.$store.dispatch('channels/history', this.$route.params.id);

      await this.$store.dispatch('channels/readAll', {
        channel_id: this.channel.id,
        channel_name: this.channel.channel_name
      });
    },

    async submitMessage(e) {
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

      if (messageToEdit && messageToEdit.content && this.editor.isEmpty) {
        Vue.set(this, 'isEditing', messageToEdit);
        this.setMessage(messageToEdit.content);
      }
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

      this.editor.commands.setContent(wrapText(parseMentions(message)), false, {
        preserveWhitespace: 'full'
      });

      this.editor.commands.focus();
    },

    clearEditor() {
      const { id } = this.$route.params;
      this.editor.commands.clearContent();
      this.editor.commands.focus();
      store.remove(`message_${id}`);
      this.isCommand = false;
    },

    // insert text to editor
    onPickEmoji(emoji) {
      this.editor
        .chain()
        .focus()
        .insertContent(emoji)
        .run();
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
      if (this.editor && this.editor.commands) this.editor.commands.focus();
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
    onClickLink(e, modal) {
      if (e.target.nodeName === 'A') {
        this.$modal.show(modal);
      }
    },
    bytesToSize,
    parseTime
  }
};
</script>
