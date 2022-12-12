import _ from 'lodash';
import moment from 'moment';
import {
  parseMessages,
  parseMessagesHierarchy,
  parseMessageContent
} from 'airsend/utils';

class Worker {
  constructor(worker) {
    this.worker = worker;

    this.user = {};

    // single object
    this.singleChannel = {};
    this.allChannels = [];

    this.messagesPerPage = 20;

    // observables
    this.observableSorts = {
      /*
      'switcher': {
        sortBy: ['is_favorite-desc', 'unread_count-desc', 'last_active_on_ts-desc' ],
        filterBy: 'active',
      }
      */
    };
  }

  sortChannels(id) {
    if (!this.observableSorts[id]) return;

    let { filterBy, sortBy, teams } = this.observableSorts[id];
    let channels = [...this.allChannels];

    if (typeof sortBy === 'string') {
      sortBy = ['is_favorite-desc', sortBy];
    }

    // set filters
    if (filterBy && filterBy !== 'all') {
      channels = _.filter(channels, {
        channel_status: filterBy === 'active' ? 1 : 2
      });
    }

    // set team filters
    if (teams && Object.keys(teams).length) {
      channels = _.filter(channels, item => {
        return teams.indexOf(item.team_id) > -1;
      });
    }

    // set sort
    if (sortBy && typeof sortBy === 'string') {
      const [field, type] = sortBy.split('-');
      channels = _.orderBy(channels, field, type);
    }

    // set multiple sort
    if (sortBy && typeof sortBy === 'object') {
      let fields = [];
      let types = [];

      sortBy.forEach(sortByOption => {
        const [field, type] = sortByOption.split('-');
        fields.push(field);
        types.push(type);
      });

      channels = _.orderBy(channels, fields, types);
    }

    // check if it's autohidden
    channels = channels.map(channel => {
      channel.is_autoarchived = moment
        .utc(channel.last_active_on, 'YYYY-MM-DD HH:mm:ss')
        .local()
        .isBefore(moment().subtract(7, 'days'))
        ? true
        : false;
      return channel;
    });

    // send to main thread
    this.worker.postMessage({
      type: 'channels/sorted',
      data: {
        id,
        list: channels
      },
      commit: true
    });
  }

  setObservable({ id, filterBy, sortBy, teams }) {
    this.observableSorts[id] = {
      filterBy,
      sortBy,
      teams
    };
    this.sortChannels(id);
  }

  // list of functions that will be trigged when channels list is changed
  observables(channels) {
    if (channels) {
      this.allChannels = channels;
    }

    // check counterparts
    for (var i = 0; i < this.allChannels.length; i++) {
      let channel = this.allChannels[i];

      // check counterpart
      if (channel.one_one) {
        channel.counterpart =
          channel.members[0].id !== this.user.id
            ? channel.members[0]
            : channel.members[1];
      }

      // OPTMIZE
      // check last message
      if (channel.latest_message && channel.latest_message.content) {
        channel.last_message_content = parseMessageContent(
          typeof channel.latest_message.content === 'string'
            ? channel.latest_message.content
            : channel.latest_message.content.bot_message,
          channel,
          true
        );

        channel.last_message_author = channel.latest_message.display_name.split(
          ' '
        )[0];
      }
    }

    this.sortChannels('home');
    this.sortChannels('switcher');
  }

  list(channels) {
    this.observables(channels);

    // send to main thread
    this.worker.postMessage({
      type: 'channels/list',
      data: channels,
      commit: true
    });
  }

  // parse single channel data
  single(channel) {
    const inMemoryChannel = this.singleChannel[channel.id];

    // map member ids
    channel.member = {};
    channel.members.forEach(member => {
      channel.member[member.id] = member;
    });

    // check counterpart
    if (channel.one_one) {
      channel.counterpart =
        channel.members[0].id !== this.user.id
          ? channel.members[0]
          : channel.members[1];
    }

    channel.typing = [];
    channel.typingTimeout = {};
    channel.chat = inMemoryChannel ? inMemoryChannel.chat : {};

    this.singleChannel[channel.id] = channel;

    // send to main thread
    this.worker.postMessage({
      type: 'channels/single',
      data: channel,
      commit: true
    });
  }

  clearChannelsCache(channelToPreserve) {
    // send to main thread
    this.worker.postMessage({
      type: 'channels/clearChannelsCache',
      data: channelToPreserve,
      commit: true
    });

    if (channelToPreserve) {
      this.singleChannel = {
        [channelToPreserve]: {
          ...this.singleChannel[channelToPreserve]
        }
      };
    } else {
      this.singleChannel = {};
    }
  }

  clearChannel(id) {
    if (this.singleChannel[id]) {
      delete this.singleChannel[id];
    }
  }

  history(data) {
    const channel = this.singleChannel[data.channel_id];
    let { messages } = data;

    // reverse messages
    messages.reverse();

    let buffer = {};
    let history = [];

    // if it's not next page
    if (!data.is_next) {
      messages = parseMessages(messages, channel);

      let [older, current, newer] = _.chunk(messages, 20);

      // if there is not enough older messages, store to current state
      if (older && older.length < 20) {
        current = older;
        older = [];
      }

      // if there are not enough messages to fill current state
      if (!current || (current && current.length < 10)) {
        current = messages;
        older = [];
      }

      if (data.has_more_newer && !newer) {
        newer = current;
        current = older;
        older = [];
      }

      buffer = {
        older: older ? older : [],
        newer: newer ? newer : []
      };

      messages = current ? current : [];

      history = parseMessagesHierarchy(messages);
    }

    let chat = {
      ...channel.chat
    };

    // if it's next page, add tokens
    if (data.is_next) {
      // is it's newer add tokens
      if (data.is_newer) {
        chat.has_more_newer = data.has_more_newer;
        chat.cursor_newer = data.cursor_newer;

        chat.buffer.newer = parseMessages(data.messages, channel);
      } else {
        chat.has_more = data.has_more;
        chat.cursor = data.cursor;

        chat.buffer.older = parseMessages(data.messages, channel);
      }
    } else {
      chat = {
        ...chat,
        buffer,
        messages,
        history,
        has_more: data.has_more,
        cursor: data.next_cursor,
        has_more_newer: data.has_more_newer,
        cursor_newer: data.next_cursor_newer
      };
    }

    this.singleChannel[channel.id].chat = chat;

    // send to main thread
    this.worker.postMessage({
      type: 'channels/chat',
      data: { channel_id: data.channel_id, chat },
      commit: true
    });
  }

  buffer(payload) {
    let { channel_id, is_newer } = payload;
    const channel = this.singleChannel[channel_id];

    let messages = parseMessages(
      this.singleChannel[channel_id].chat.buffer[is_newer ? 'newer' : 'older'],
      channel
    );

    // used to mutate buffer or chat objects
    let newBuffer = {};
    let newChat = {};

    let history = [];

    // merge new and old messages
    if (is_newer) {
      if (
        this.singleChannel[channel_id].chat.messages.length >=
        this.messagesPerPage + this.messagesPerPage / 2
      ) {
        let messagesToPreserve = this.singleChannel[
          channel_id
        ].chat.messages.slice(
          this.singleChannel[channel_id].chat.messages.length - messages.length,
          this.singleChannel[channel_id].chat.messages.length
        );
        let messagesToBuffer = this.singleChannel[
          channel_id
        ].chat.messages.slice(
          0,
          this.singleChannel[channel_id].chat.messages.length - messages.length
        );

        if (messagesToBuffer.length > 0) {
          newBuffer.older = messagesToBuffer;

          // if buffer is already there
          if (this.singleChannel[channel_id].chat.buffer.older.length > 0) {
            newChat.has_more = true;
            newChat.cursor = btoa(messagesToBuffer[0].id);
          }
        }

        messages = [...messagesToPreserve, ...messages];

        history = parseMessagesHierarchy(messages);
      } else {
        history = parseMessagesHierarchy(
          null,
          this.singleChannel[channel_id].chat.history,
          messages
        );

        messages = [
          ...this.singleChannel[channel_id].chat.messages,
          ...messages
        ];
      }
    } else {
      if (
        this.singleChannel[channel_id].chat.messages.length >=
        this.messagesPerPage * 2
      ) {
        let messagesToPreserve = this.singleChannel[
          channel_id
        ].chat.messages.slice(
          0,
          this.singleChannel[channel_id].chat.messages.length - messages.length
        );
        let messagesToBuffer = this.singleChannel[
          channel_id
        ].chat.messages.slice(
          this.singleChannel[channel_id].chat.messages.length - messages.length,
          this.singleChannel[channel_id].chat.messages.length
        );

        if (messagesToBuffer.length > 0) {
          newBuffer.newer = messagesToBuffer;

          // if buffer is already there
          if (this.singleChannel[channel_id].chat.buffer.newer.length > 0) {
            newChat.has_more_newer = true;
            newChat.cursor_newer = btoa(
              messagesToBuffer[messagesToBuffer.length - 1].id
            );
          }
        }

        messages = [...messages, ...messagesToPreserve];

        history = parseMessagesHierarchy(messages);
      } else {
        history = parseMessagesHierarchy(
          messages,
          this.singleChannel[channel_id].chat.history
        );

        messages = [
          ...messages,
          ...this.singleChannel[channel_id].chat.messages
        ];
      }
    }

    const chat = {
      ...this.singleChannel[channel_id].chat,
      ...newChat,
      messages,
      history,
      // clean only newer or older buffer
      buffer: {
        ...this.singleChannel[channel_id].chat.buffer,
        ...newBuffer,
        [is_newer ? 'newer' : 'older']: []
      }
    };

    this.singleChannel[channel_id].chat = chat;

    // send to main thread
    this.worker.postMessage({
      type: 'channels/chat',
      data: { channel_id: channel_id, chat },
      commit: true
    });
  }

  send(payload) {
    let chat = this.singleChannel[payload.channel_id].chat;
    let channel = this.singleChannel[payload.channel_id];
    let messages = chat.messages;

    // presend message
    if (!payload.id) {
      const message = {
        ...payload,
        id: payload.temp_id,
        sending: true
      };

      // append message

      this.onReceiveMessage({
        message
      });

      return;

      /*
      messages.push(parseMessages(message, channel));
      chat.history = parseMessagesHierarchy(null, chat.history, [
        parseMessages(message, channel)
      ]);
      */
    } else {
      let index = _.findIndex(messages, {
        content: payload.content,
        sending: true
      });
      messages[index] = parseMessages(payload, channel);

      let historyIndex = _.findIndex(chat.history, {
        content: payload.content,
        sending: true
      });
      chat.history[historyIndex] = {
        ...chat.history[historyIndex],
        ...parseMessages(payload, channel)
      };
    }

    // send to main thread
    this.worker.postMessage({
      type: 'channels/chat',
      data: {
        channel_id: payload.channel_id,
        chat
      },
      commit: true
    });
  }

  onReceiveMessage(payload) {
    const channel = this.singleChannel[payload.message.channel_id];

    // if channel exists and there is no new messages left
    if (channel && !channel.has_more_newer) {
      let { buffer } = channel.chat;

      // if there are messages in the buffer, push new one to buffer
      if (buffer && buffer.newer && buffer.newer.length > 0) {
        buffer.newer.push(parseMessages(payload.message, channel));
      } else {
        channel.chat.messages.push(parseMessages(payload.message, channel));

        if (channel.chat.messages.length <= this.messagesPerPage * 2) {
          channel.chat.history = parseMessagesHierarchy(
            null,
            channel.chat.history,
            [parseMessages(payload.message, channel)]
          );
        } else {
          const messageToBuffer = channel.chat.messages.slice(0, 1);
          const messagesToPreserve = channel.chat.messages.slice(
            1,
            channel.chat.messages.length
          );

          if (
            channel.chat.history[2] &&
            channel.chat.history[2].component === 'chat-divider'
          ) {
            channel.chat.history = channel.chat.history.slice(
              2,
              channel.chat.history.length
            );
          } else {
            channel.chat.history = [
              channel.chat.history[0],
              ...channel.chat.history.slice(2, channel.chat.history.length)
            ];
          }

          // message
          channel.chat.history = parseMessagesHierarchy(
            null,
            channel.chat.history,
            [parseMessages(payload.message, channel)]
          );

          channel.chat.messages = messagesToPreserve;

          // buffer
          if (buffer.older) {
            buffer.older.push(messageToBuffer[0]);
            buffer.older = buffer.older.slice(1, buffer.older.length);

            if (channel.chat.has_more) {
              channel.chat.cursor = btoa(buffer.older[0].id);
            }
          }
        }
      }

      // send to main thread
      this.worker.postMessage({
        type: 'channels/chat',
        data: {
          channel_id: payload.message.channel_id,
          chat: {
            ...channel.chat
          }
        },
        commit: true
      });
    } else {
      console.log(
        'TODO: Received message when channel is not loaded to memory'
      );
    }
  }

  onUpdateMessage(message) {
    // update channel last message
    const channelIndex = _.findIndex(this.allChannels, {
      id: message.channel_id
    });
    if (
      this.allChannels[channelIndex] &&
      this.allChannels[channelIndex].latest_message.id === message.id
    ) {
      this.onUpdateChannel({ id: message.channel_id, latest_message: message });
    }

    // add link if message attachments is a link
    if (message.attachments) {
      message.attachments.forEach(attachment => {
        if (attachment.ctp !== 'ATTACHMENT_TYPE_UNFURL') return;

        this.worker.postMessage({
          type: 'files/handleLinkUpdate',
          data: {
            message,
            attachment
          },
          commit: true,
          deep: true
        });
      });
    }

    if (!this.singleChannel[message.channel_id]) {
      console.log('[UNHANDLED MESSAGE UPDATE]');
      return;
    }

    let { messages, history } = this.singleChannel[message.channel_id].chat;
    let channel = this.singleChannel[message.channel_id];

    let index = _.findIndex(messages, { id: parseInt(message.id) });

    // no index found
    if (index === -1) return;

    if (
      messages[index].emitted_on &&
      message.emitted_on &&
      messages[index].emitted_on > message.emitted_on
    ) {
      console.log('[UNHANDLED MESSAGE UPDATE! MESSAGE ALREADY UPDATED]');
      return;
    }

    messages[index] = parseMessages(message, channel);

    let historyIndex = _.findIndex(history, { id: parseInt(message.id) });

    // target message on history
    let target = history[historyIndex];

    // no target
    if (!target) return;

    history[historyIndex] = { ...target, ...parseMessages(message, channel) };

    this.worker.postMessage({
      type: 'channels/handleMessageUpdate',
      data: {
        channel_id: message.channel_id,
        message: {
          index: index,
          data: messages[index]
        },
        history: {
          index: historyIndex,
          data: history[historyIndex]
        }
      },
      commit: true
    });
  }

  onUpdateUser(payload) {
    const { channel_id, user } = payload;

    const channel = this.singleChannel[channel_id];

    if (channel && channel.members) {
      channel.member[user.id] = { ...channel.member[user.id], ...user };

      const index = _.findIndex(channel.members, { id: user.id });

      channel.members[index] = { ...channel.members[index], ...user };

      // send to main thread
      this.worker.postMessage({
        type: 'channels/single',
        data: channel,
        commit: true
      });

      // update user on channel list
      this.worker.postMessage({
        type: 'channels/updateMembers',
        data: { channel_id, members: channel.members },
        commit: true
      });
    }
  }

  onUserAdded(payload) {
    const { channel_id, user } = payload;

    if (
      this.singleChannel[channel_id] &&
      _.findIndex(this.singleChannel[channel_id].members, {
        id: user.id
      }) === -1
    ) {
      this.singleChannel[channel_id].members.push(user);
      this.singleChannel[channel_id].member[user.id] = user;
    }

    // send to main thread
    this.worker.postMessage({
      type: 'channels/onUserAdded',
      data: payload,
      commit: true
    });
  }

  onUpdateReadStatus({ channel_id, read_watermark_id, user_id }) {
    try {
      if (this.singleChannel[channel_id]) {
        let channel = this.singleChannel[channel_id];
        let { member } = channel;

        // update in channel indexes
        const statusIndex = _.findIndex(channel.read_status, { user_id });
        if (statusIndex > -1) {
          this.singleChannel[channel_id].read_status[statusIndex] = {
            user_id,
            read_watermark: read_watermark_id
          };
        } else {
          this.singleChannel[channel_id].read_status.push({
            user_id,
            read_watermark: read_watermark_id
          });
        }

        // send to main thread
        this.worker.postMessage({
          type: 'channels/update',
          data: {
            id: channel_id,
            read_status: this.singleChannel[channel_id].read_status
          },
          commit: true
        });

        // parse affected messages
        for (var i = channel.chat.messages.length - 1; i >= 0; i--) {
          let message = channel.chat.messages[i];

          if (!message.read_by) {
            message.read_by = [];
          }

          if (
            message.id <= read_watermark_id &&
            message.user_id !== user_id &&
            message.read_by.findIndex(
              receipt => receipt.user_id === user_id
            ) === -1
          ) {
            message.read_by.unshift({
              user_id,
              display_name: member[user_id]
                ? member[user_id].display_name
                : null,
              has_avatar: member[user_id] ? member[user_id].has_avatar : null,
              updated_on_ts: member[user_id]
                ? member[user_id].updated_on_ts
                : null
            });

            // check on history
            let historyIndex = _.findIndex(channel.chat.history, {
              id: parseInt(message.id)
            });

            channel.chat.history[historyIndex].read_by = message.read_by;

            this.worker.postMessage({
              type: 'channels/handleMessageUpdate',
              data: {
                channel_id: channel_id,
                message: {
                  index: i,
                  data: message
                },
                history: {
                  index: historyIndex,
                  data: channel.chat.history[historyIndex]
                }
              },
              commit: true
            });
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  onUpdateChannel(channel) {
    const fieldsToPick = [
      'id',
      'channel_name',
      'blurb',
      'has_logo',
      'has_background',
      'updated_on_ts',
      'last_active_on',
      'last_active_on_ts',
      'members',
      'pending_members',
      'user_role',
      'owned_by',
      'muted',
      'public_url',
      'unread_count',
      'latest_message',
      'read_watermark_id',
      'channel_group_id',
      'is_favorite',
      'channel_status',
      'meeting',
      'team_id',
      'blocked_on',
      'one_one_approved'
    ];

    // if it's a full channel event
    if (channel._isComplete && !channel.meeting) {
      channel.meeting = null;
      console.log('[MP] The meeting is done for', channel.display_name);
    }

    if (channel._isComplete && !channel.public_url) {
      channel.public_url = null;
    }

    if (channel._isComplete && !channel.blocked_on) {
      channel.blocked_on = null;
    }

    // pick necessary fields from object
    const pickedChannel = _.pick(channel, fieldsToPick);
    const { id } = pickedChannel;

    // get channel index
    const channelIndex = _.findIndex(this.allChannels, { id: id });

    this.allChannels[channelIndex] = {
      ...this.allChannels[channelIndex],
      ...pickedChannel
    };

    if (this.singleChannel[id]) {
      // update fields
      this.singleChannel[id] = {
        ...this.singleChannel[id],
        ...pickedChannel
      };
    }

    /*
    // observable
    if(this.observableSorts.home) {
      this.sortChannels('home');
    }

    if(this.observableSorts.switcher) {
      this.sortChannels('switcher');
    }
    */

    this.observables();

    // send to main thread
    this.worker.postMessage({
      type: 'channels/update',
      data: pickedChannel,
      commit: true
    });
  }

  updateUnreadCounter({ channel_id, type, message_id }) {
    const channelIndex = _.findIndex(this.allChannels, { id: channel_id });

    if (channelIndex > -1) {
      const channel = this.allChannels[channelIndex];

      let unread_count =
        type === 'all'
          ? 0
          : type === '+'
          ? channel.unread_count + 1
          : channel.unread_count - 1;

      this.onUpdateChannel({
        id: channel_id,
        unread_count,
        last_active_on:
          type === '+'
            ? moment.utc().format('YYYY-MM-DD HH:mm:ss')
            : channel.last_active_on,
        last_active_on_ts:
          type === '+' ? moment().unix() : channel.last_active_on_ts,
        read_watermark_id:
          message_id && message_id > channel.read_watermark_id
            ? message_id
            : channel.read_watermark_id
      });
    }
  }

  updateUnreadCounterBellow({ channel_id, type, expandedGroups }) {
    if (channel_id) {
      let channelIndex = _.findIndex(this.allChannels, { id: channel_id });
      let channel = this.allChannels[channelIndex];
      let group_id =
        channel.channel_group_id !== -1
          ? channel.channel_group_id
          : channel.one_one
          ? 'dm'
          : 'all';

      let isGroupExpanded = expandedGroups[group_id];

      if (isGroupExpanded) {
        this.worker.postMessage({
          type: 'channels/updateUnreadMessagesBellowViewport',
          data: {
            type,
            channel_id
          },
          commit: true
        });
      } else {
        this.worker.postMessage({
          type: 'channels/updateUnreadMessagesBellowViewport',
          data: {
            type,
            group_id
          },
          commit: true
        });
      }
    }
  }

  onClear() {
    this.user = null;

    this.user = {};

    // single object
    this.singleChannel = {};
    this.allChannels = [];

    // observables
    this.observableSorts = {
      switcher: {
        sortBy: [
          'is_favorite-desc',
          'unread_count-desc',
          'last_active_on_ts-desc'
        ],
        filterBy: 'active'
      }
    };

    this.worker.postMessage({
      type: 'channels/clear',
      commit: true
    });
  }

  setUser(user) {
    this.user = user;
  }

  onMessage(event) {
    const { type, data } = event.data;
    this[type].call(this, data);
  }
}

const worker = new Worker(self, { type: 'module' });

self.addEventListener('message', worker.onMessage.bind(worker));
