import Vue from 'vue';
import Vuex from 'vuex';

import { Device, parseScalabilityMode } from 'mediasoup-client';

import _ from 'lodash';
import store from 'store';
import harkLib from 'hark';
import { v4 as uuid } from 'uuid';
import { Howl } from 'howler';

import AirSend from 'airsend/client';
import {
  parseSingleMessage,
  parseMessageContent,
  parseTime
} from 'airsend/utils';
import getDeviceInfo from 'airsend/utils/device';
import ScreenShare from 'airsend/utils/ScreenShare';
import moment from 'moment';

import router from '../../router';

import {
  VIDEO_CONSTRAINS,
  PC_PROPRIETARY_CONSTRAINTS,
  VIDEO_SIMULCAST_ENCODINGS,
  VIDEO_KSVC_ENCODINGS,
  VIDEO_SVC_ENCODINGS
} from 'airsend/constants/webrtc';

Vue.use(Vuex);

export default {
  namespaced: true,
  state: {
    client: new AirSend(),
    toasts: [],
    closed: false,
    useSimulcast: false,
    useSharingSimulcast: false,
    capabilities: {},
    me: {},
    peers: [],
    peerVolumes: {},
    peerActivities: {},
    producers: [],
    consumers: [],
    singleConsumers: {}, // consumer id map
    settings: {
      selectedWebcam: store.get('selectedWebcam'),
      selectedAudioDevice: store.get('selectedAudioDevice'),
      selectedAudioOutputDevice: store.get('selectedAudioOutputDevice'),
      selectedScreen: store.get('selectedScreen'),
      sampleRate: 48000,
      channelCount: 1,
      volume: 1.0,
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      sampleSize: 16,
      voiceActivatedUnmute: false,
      noiseThreshold: -50,
      resolution: 'medium',
      frameRate: '15',
      screenSharingResolution: 'veryhigh',
      screenSharingFrameRate: '5',
      requestTimeout: 3000
    },
    // devices
    audioDevices: [],

    screens: [],

    // hark
    hark: null,
    harkStream: null,
    requests: {},
    chatHistory: [],
    chatUnreadCount: 0,
    isChatOpen: false
  },
  mutations: {
    set: (state, payload) => {
      Object.keys(payload).forEach(key => {
        Vue.set(state, key, payload[key]);
      });
    },
    setRequest: (state, { id, callback }) => {
      state.requests[id] = callback;
    },
    addMessage: (state, payload) => {
      state.chatHistory.push(payload);
      if (!state.isChatOpen) {
        state.chatUnreadCount++;
      }
    },
    deleteRequest: (state, id) => {
      Vue.delete(state.requests, id);
    },
    // current user details
    me: (state, payload) => {
      Object.keys(payload).forEach(key => {
        Vue.set(state.me, key, payload[key]);
      });
    },
    // current user details
    settings: (state, payload) => {
      Object.keys(payload).forEach(key => {
        Vue.set(state.settings, key, payload[key]);
      });
    },
    singleConsumer: (state, { id, consumer }) => {
      Vue.set(state.singleConsumers, id, consumer);
    },
    setConsumer: (state, { id, attr, value }) => {
      if (state.singleConsumers)
        Vue.set(state.singleConsumers[id], attr, value);
      const index = _.findIndex(state.consumers, { id });
      if (index > -1 && state.consumers[index]) {
        Vue.set(state.consumers[index], attr, value);
      }
    },
    setProducer: (state, { id, attr, value }) => {
      const index = _.findIndex(state.producers, { id });
      if (index > -1 && state.producers[index]) {
        Vue.set(state.producers[index], attr, value);
      }
    },
    setPeerVolume: (state, payload) => {
      Vue.set(state.peerVolumes, payload.peerId, payload.volume);
      if (payload.volume) {
        Vue.set(state.peerActivities, payload.peerId, moment().unix());
      }
    },

    // add resource
    addResource: (state, payload) => {
      state[payload.group].push(payload);
    },

    // remove resource
    removeResource: (state, { group, id }) => {
      const index = _.findIndex(state[group], { id });

      if (index > -1 && state[group][index]) {
        Vue.delete(state[group], index);
      }
    },

    addToast: (state, payload) => {
      const index = _.findIndex(state.toasts, { id: payload.id });
      if (index > -1) {
        console.log('[TOAST PREVENTED]');
        return;
      }
      state.toasts.push(payload);
      // automatically remove with timeout
      if (payload.timeout) {
        setTimeout(() => {
          const index = _.findIndex(state.toasts, { id: payload.id });
          Vue.delete(state.toasts, index);
        }, payload.timeout);
      }
    },
    dismissToast: (state, id) => {
      const index = _.findIndex(state.toasts, { id });
      Vue.delete(state.toasts, index);
    },
    clearToasts: state => {
      Vue.set(state, 'toasts', []);
    }
  },
  actions: {
    // init and bind events
    init(context) {
      context.dispatch('startDevicesListener');
    },

    createOrJoin(context, { is_public, channel_id }) {
      const channel = this.getters['channels/getChannelById'](channel_id);

      if (is_public) {
        context.dispatch('create', { is_public: 1 });
      } else if (channel.meeting) {
        context.dispatch('join', {
          room: channel.meeting.call_hash,
          channelId: channel_id
        });
      } else {
        context.dispatch('create', { channel_id, is_public: 0 });
      }
    },

    async create(context, payload) {
      const { id: currentChannelId } = router.history.current.params;

      if (!payload.is_public && currentChannelId != payload.channel_id) {
        router.push({
          name: 'channel',
          params: {
            id: payload.channel_id
          }
        });
      }

      // set data
      context.commit('set', {
        channelId: payload.channel_id,
        roomState: 'connecting'
      });

      const request = await context.state.client.post('call.create', payload);

      if (request.ok) {
        const { call } = request.data;

        // redirect to public url
        if (payload.is_public) {
          router.push({
            name: 'meeting',
            params: {
              hash: call.call_hash
            }
          });
        }

        context.dispatch('join', {
          room: call.call_hash,
          channelId: call.channel_id
        });
      } else {
        context.commit('addToast', {
          id: 'closing',
          content: 'Failed to join meeting, closing',
          timeout: 5000,
          type: 'danger',
          close: true
        });

        setTimeout(() => {
          context.dispatch('close');
        }, 5000);
      }
    },

    async invite(context, user_id) {
      return await context.state.client.get('call.invite', {
        call_hash: context.state.roomId,
        user_id
      });
    },

    async acceptInvite(context, payload) {
      return await context.state.client.get('call.invite.accept', payload);
    },

    // join meeting
    async join(context, { room, server_address, channelId, shouldJoinVideo }) {
      console.log('[MP] Joining', room);

      const { user, handshakeSettings } = context.rootState.core;
      const { roomId: currentMeeting } = context.state;

      if (!handshakeSettings.wrtcServerAddress) {
        console.log('[MP] Handshaking');
        await this.dispatch('core/handshake');
        context.dispatch('join', {
          room,
          server_address,
          channelId,
          shouldJoinVideo
        });
        return;
      }

      if (
        currentMeeting &&
        currentMeeting === room &&
        context.state.roomState !== 'reconnecting' &&
        context.state.roomState !== 'closed'
      ) {
        return;
      } else if (currentMeeting && context.state.roomState !== 'reconnecting') {
        await context.dispatch('close');
      }

      console.log('[MP] Connecting to', handshakeSettings.wrtcServerAddress);

      const ws = new WebSocket(handshakeSettings.wrtcServerAddress);

      const deviceInfo = getDeviceInfo();
      const screenSharing = ScreenShare.create(deviceInfo);

      const peerId = user.id ? user.id : uuid();

      // set data
      context.commit('set', {
        roomId: room,
        channelId,
        peerId,
        ws,
        screenSharing,
        deviceInfo,
        shouldProduce: true, // TODO: move back to true
        shouldForceTcp: false,
        shouldJoinVideo,
        isMuted: false,
        invite: null,
        roomState: 'connecting',
        chatHistory: [],
        chatUnreadCount: 0,
        isChatOpen: false,
        isMeetingInfoVisible: true
      });

      // set sounds
      if (!context.state.sounds) {
        context.commit('set', {
          sounds: {
            reconnecting: new Howl({
              src: ['/meeting-reconnecting.wav'],
              loop: true
            }),
            headsup: new Howl({
              src: ['/meeting-headsup.wav']
            })
          }
        });
      }

      context.commit('set', {
        onConnectListener: context.dispatch.bind(this, 'onConnect')
      });
      context.state.ws.addEventListener(
        'open',
        context.state.onConnectListener
      );

      context.commit('set', {
        onMessageListener: context.dispatch.bind(this, 'onMessage')
      });
      context.state.ws.addEventListener(
        'message',
        context.state.onMessageListener
      );

      context.commit('set', {
        onCloseListener: context.dispatch.bind(this, 'onClose')
      });
      context.state.ws.addEventListener('close', context.state.onCloseListener);
    },

    onConnect(context) {
      console.log('[MP] Connected to Websockets');

      // authenticate using JWT
      context.state.ws.send(
        JSON.stringify({
          type: 'auth',
          peerId: context.state.peerId,
          rtmToken: context.rootState.websocket.rtm_token
            ? context.rootState.websocket.rtm_token
            : context.state.roomId,
          roomId: context.state.roomId
        })
      );
    },

    onMessage(context, e) {
      const event = JSON.parse(e.data);
      switch (event.type) {
        case 'notification':
          context.dispatch('onNotification', event);
          break;
        case 'request':
          if (context.state.requests && context.state.requests[event.id]) {
            context.state.requests[event.id](event.err, event.response);
          } else {
            context.dispatch('onRequest', event);
          }
          break;
        default:
          console.log('[UNHANDLED EVENT]', event);
      }
    },

    onClose(context, e) {
      const { code } = e;

      // reconnect
      if (e.code !== 1005 && code !== 1011) {
        setTimeout(
          () => {
            context.dispatch('reconnect');
          },
          context.state.roomState !== 'connecting' ? 0 : 1000
        );
      } else {
        if (e.reason !== '') context.state.sounds.headsup.play();
        context.commit('set', {
          roomState: 'closed',
          closeReason: e.reason !== '' ? e.reason : null
        });
      }

      if (context.state.screenSharingProducer) {
        context.state.screenSharingProducer.close();
        context.commit('set', { screenSharingProducer: null });
      }

      if (context.state.webcamProducer) {
        context.state.webcamProducer.close();
        context.commit('set', { webcamProducer: null });
      }

      if (context.state.micProducer) {
        context.state.micProducer.close();
        context.commit('set', { micProducer: null });
      }

      if (context.state.sendTransport) {
        context.state.sendTransport.close();
        context.commit('set', { sendTransport: null });
      }

      if (context.state.recvTransport) {
        context.state.recvTransport.close();
        context.commit('set', { recvTransport: null });
      }

      context.commit('set', {
        peers: [],
        consumers: [],
        producers: []
      });

      /*

      switch (e.reason) {
        case 'auth.invalid':

          break;

        case '': {

          if(code === 1005) {
            console.log("Socket connection is now closed by the client");
          } else {

          }

        }

      }
      */
    },

    reconnect(context, payload) {
      console.log('Trying to reconnect', context.state.roomState);

      if (context.state.roomState === 'closed') {
        context.state.sounds.reconnecting.stop();
        return;
      }

      if (!context.state.isReconnecting) {
        context.state.sounds.reconnecting.play();
        context.commit('addToast', {
          id: 'reconnecting',
          content: { message: 'meeting.toasts.disconnected-reconnecting' },
          contentType: 'text',
          type: 'primary',
          close: true
        });
      }

      context.commit('set', {
        roomState: 'reconnecting',
        isReconnecting: true
      });

      context.state.ws.removeEventListener(
        'open',
        context.state.onConnectListener
      );

      context.state.ws.removeEventListener(
        'close',
        context.state.onCloseListener
      );

      context.state.ws.removeEventListener(
        'message',
        context.state.onMessageListener
      );

      clearInterval(context.state.pingInterval);

      context.state.ws.close(3000);

      context.dispatch('join', {
        room: context.state.roomId,
        channelId: context.state.channelId
      });
    },

    onCallInvite(context, payload) {
      context.commit('set', { invite: payload });
    },

    onCallInviteAccept(context, payload) {
      if (payload.call_hash === context.state.invite.call_hash) {
        context.commit('set', { invite: null });
      }
    },

    async onRequest(context, request) {
      console.log('[MP] Request', request.method);

      switch (request.method) {
        // ready to join
        case 'newConsumer': {
          console.log('[MP] New Consumer');

          const {
            peerId,
            producerId,
            id,
            kind,
            rtpParameters,
            type,
            appData,
            producerPaused
          } = request.data;

          console.log('APP DATA', appData);

          const consumer = await context.state.recvTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            appData: { ...appData, peerId } // Trick.
          });

          context.commit('singleConsumer', { id: consumer.id, consumer });

          consumer.on('transportclose', () => {
            context.commit('singleConsumer', {
              id: consumer.id,
              consumer: null
            });
          });

          const { spatialLayers, temporalLayers } = parseScalabilityMode(
            consumer.rtpParameters.encodings[0].scalabilityMode
          );

          context.commit('addResource', {
            group: 'consumers',
            id: consumer.id,
            peerId: peerId,
            kind: kind,
            type: type,
            locallyPaused: false,
            remotelyPaused: producerPaused,
            rtpParameters: consumer.rtpParameters,
            source: consumer.appData.source,
            spatialLayers: spatialLayers,
            temporalLayers: temporalLayers,
            preferredSpatialLayer: spatialLayers - 1,
            preferredTemporalLayer: temporalLayers - 1,
            priority: 1,
            codec: consumer.rtpParameters.codecs[0].mimeType.split('/')[1],
            track: consumer.track
          });

          consumer.resume();

          // We are ready. Answer the request so the server will
          // resume this Consumer (which was paused for now).
          const { ws } = context.state;

          // send command
          ws.send(
            JSON.stringify({
              type: 'callback',
              id: request.data.id,
              method: request.method,
              data: true
            })
          );

          if (kind === 'audio') {
            consumer.volume = 0;

            const stream = new MediaStream();

            stream.addTrack(consumer.track);

            if (!stream.getAudioTracks()[0])
              throw new Error(
                'request.newConsumer | given stream has no audio track'
              );

            consumer.hark = harkLib(stream, { play: false });

            consumer.hark.on('volume_change', volume => {
              // conver dB to volume level
              volume = volume > -100 ? volume + 100 : 0;
              if (consumer && volume !== consumer.volume) {
                consumer.volume = volume;
                context.commit('setPeerVolume', { peerId, volume });
              }
            });
          }

          break;
        }

        default: {
          console.log('[MP] Unknown Request', request.method);
        }
      }
    },

    onNotification(context, notification) {
      console.log('[MP] Notification', notification.method);

      switch (notification.method) {
        // ready to join
        case 'roomReady': {
          const { turnServers } = notification.data;
          // set data
          context.commit('set', { turnServers });
          context.dispatch('joinRoom');
          break;
        }

        case 'roomBack': {
          context.dispatch('joinRoom');
          break;
        }

        case 'activeSpeaker': {
          const { peerId } = notification.data;

          // set data
          context.commit('set', {
            activeSpeaker: peerId ? peerId.toString() : null
          });

          if (
            peerId &&
            peerId !== '' &&
            peerId !== context.state.lastActiveSpeaker &&
            peerId != context.state.peerId
          ) {
            context.commit('set', { lastActiveSpeaker: peerId });
          }

          break;
        }

        // PEERS
        case 'newPeer': {
          const { id, displayName, picture, roles } = notification.data;

          context.commit('addResource', {
            group: 'peers',
            id,
            displayName,
            picture,
            roles,
            consumers: []
          });

          context.commit('addToast', {
            id: 'joinRoom',
            content: {
              message: 'meeting.toasts.someone-joined',
              meta: { userId: id, userName: displayName }
            },
            contentType: 'text',
            type: 'primary',
            close: true,
            timeout: 6000
          });

          break;
        }

        case 'peerClosed': {
          const { peerId } = notification.data;

          const index = _.findIndex(context.state.peers, { id: peerId });

          if (index > -1 && context.state.peers[index]) {
            const { displayName } = context.state.peers[index];
            context.commit('addToast', {
              id: 'peerClosed-' + peerId,
              content: {
                message: 'meeting.toasts.someone-left',
                meta: { userId: peerId, userName: displayName }
              },
              contentType: 'text',
              type: 'primary',
              close: true,
              timeout: 6000
            });
          }

          if (context.state.lastActiveSpeaker === peerId) {
            context.commit('set', { lastActiveSpeaker: null });
          }

          context.commit('removeResource', {
            group: 'peers',
            id: peerId
          });

          break;
        }

        // CONSUMERS
        case 'consumerClosed': {
          const { consumerId } = notification.data;
          const consumer = context.state.singleConsumers[consumerId];

          if (!consumer) break;

          consumer.close();

          if (consumer.hark != null) consumer.hark.stop();

          context.commit('singleConsumer', {
            id: consumerId,
            consumer: null
          });

          const { peerId } = consumer.appData;

          context.commit('removeResource', {
            id: consumerId,
            group: 'consumers'
          });

          break;
        }

        case 'consumerPaused': {
          const { consumerId } = notification.data;
          const consumer = context.state.singleConsumers[consumerId];

          if (!consumer) break;

          context.commit('setConsumer', {
            id: consumerId,
            attr: 'remotelyPaused',
            value: true
          });

          break;
        }

        case 'consumerResumed': {
          const { consumerId } = notification.data;
          const consumer = context.state.singleConsumers[consumerId];

          if (!consumer) break;

          context.commit('setConsumer', {
            id: consumerId,
            attr: 'remotelyPaused',
            value: false
          });

          break;
        }

        case 'consumerLayersChanged': {
          const { consumerId, spatialLayer, temporalLayer } = notification.data;
          const consumer = context.state.singleConsumers[consumerId];

          if (!consumer) break;

          context.commit('setConsumer', {
            id: consumerId,
            attr: 'spatialLayers',
            value: spatialLayer
          });
          context.commit('setConsumer', {
            id: consumerId,
            attr: 'temporalLayers',
            value: temporalLayer
          });

          break;
        }

        case 'consumerScore': {
          const { consumerId, score } = notification.data;
          context.commit('setConsumer', {
            id: consumerId,
            attr: 'score',
            value: score
          });
          break;
        }

        case 'producerScore': {
          const { producerId, score } = notification.data;
          context.commit('setProducer', {
            id: producerId,
            attr: 'score',
            value: score
          });
          break;
        }

        case 'moderator:mute': {
          context.commit('addToast', {
            id: 'moderator:mute',
            content: {
              message: 'meeting.toasts.moderaror-mute'
            },
            contentType: 'text',
            type: 'primary',
            close: true,
            timeout: 6000
          });

          context.dispatch('muteMic');

          context.state.sounds.headsup.play();

          break;
        }

        case 'moderator:stopVideo': {
          context.commit('addToast', {
            id: 'moderator:mute',
            content: {
              message: 'meeting.toasts.moderaror-stop-video'
            },
            contentType: 'text',
            type: 'primary',
            close: true,
            timeout: 6000
          });

          context.dispatch('disableWebcam');

          context.state.sounds.headsup.play();

          break;
        }

        case 'moderator:stopScreenSharing': {
          context.commit('addToast', {
            id: 'moderator:mute',
            content: {
              message: 'meeting.toasts.moderaror-stop-screen'
            },
            contentType: 'text',
            type: 'primary',
            close: true,
            timeout: 6000
          });

          context.dispatch('disableScreenSharing');

          break;
        }

        case 'moderator:goPublic': {
          context.dispatch('onGoPublic', notification.data);
          break;
        }

        case 'chatMessage': {
          context.dispatch('onReceiveMessage', notification.data);
          break;
        }
      }
    },

    // join room
    async joinRoom(context) {
      const {
        shouldProduce,
        shouldForceTcp,
        shouldJoinVideo,
        turnServers,
        isMuted,
        deviceInfo,
        screenSharing
      } = context.state;

      try {
        const mediasoupDevice = new Device();

        // get routerRtpCapabilities
        const routerRtpCapabilities = await context.dispatch('sendRequest', {
          method: 'getRouterRtpCapabilities'
        });

        console.log('CAPABILITIES', routerRtpCapabilities);
        routerRtpCapabilities.headerExtensions = routerRtpCapabilities.headerExtensions.filter(
          ext => ext.uri !== 'urn:3gpp:video-orientation'
        );

        await mediasoupDevice.load({ routerRtpCapabilities });

        if (shouldProduce) {
          // create producing transport
          const transportInfo = await context.dispatch('sendRequest', {
            method: 'createWebRtcTransport',
            data: {
              forceTcp: shouldForceTcp,
              producing: true,
              consuming: false
            }
          });

          const {
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters
          } = transportInfo;

          const sendTransport = mediasoupDevice.createSendTransport({
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
            iceServers: turnServers,
            iceTransportPolicy:
              deviceInfo.flag === 'firefox' && turnServers
                ? 'relay'
                : undefined,
            proprietaryConstraints: PC_PROPRIETARY_CONSTRAINTS
          });

          sendTransport.on(
            'connect',
            ({ dtlsParameters }, callback, errback) => {
              console.log('[MP] Connected to sendTransport');

              context
                .dispatch('sendRequest', {
                  method: 'connectWebRtcTransport',
                  data: {
                    transportId: sendTransport.id,
                    dtlsParameters
                  }
                })
                .then(callback)
                .catch(errback);
            }
          );

          sendTransport.on(
            'produce',
            async ({ kind, rtpParameters, appData }, callback, errback) => {
              console.log('[MP] Producing to sendTransport');

              try {
                const response = await context.dispatch('sendRequest', {
                  method: 'produce',
                  data: {
                    transportId: sendTransport.id,
                    kind,
                    rtpParameters,
                    appData
                  }
                });

                console.log('RESPONSE', response, appData);

                callback({ id: response.id });
              } catch (err) {
                errback(err);
              }
            }
          );

          // set data
          context.commit('set', { sendTransport });
          context.commit('set', { lastActiveSpeaker: null });
        }

        // create consuming transport
        const transportInfo = await context.dispatch('sendRequest', {
          method: 'createWebRtcTransport',
          data: {
            forceTcp: shouldForceTcp,
            producing: false,
            consuming: true
          }
        });

        const {
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters
        } = transportInfo;

        const recvTransport = mediasoupDevice.createRecvTransport({
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters,
          iceServers: turnServers,
          iceTransportPolicy:
            deviceInfo.flag === 'firefox' && turnServers ? 'relay' : undefined
        });

        recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
          console.log('[MP] Connected to recvTransport');

          context
            .dispatch('sendRequest', {
              method: 'connectWebRtcTransport',
              data: {
                transportId: recvTransport.id,
                dtlsParameters
              }
            })
            .then(callback)
            .catch(errback);
        });

        // set data
        context.commit('set', {
          recvTransport,
          capabilities: {
            canSendMic: mediasoupDevice.canProduce('audio'),
            canSendWebcam: mediasoupDevice.canProduce('video'),
            canShareScreen:
              mediasoupDevice.canProduce('video') &&
              screenSharing.isScreenShareAvailable()
          }
        });

        // get current user display name
        const { display_name, has_avatar, updated_on_ts } = this.getters[
          'core/getUser'
        ]();

        // join room
        const {
          authenticated,
          roles,
          peers,
          tracker,
          roomPermissions,
          allowWhenRoleMissing,
          chatHistory,
          fileHistory,
          lastNHistory,
          locked,
          lobbyPeers,
          accessCode
        } = await context.dispatch('sendRequest', {
          method: 'join',
          data: {
            displayName: display_name
              ? display_name
              : context.state.guest.display_name,
            picture: has_avatar ? updated_on_ts : null,
            rtpCapabilities: mediasoupDevice.rtpCapabilities
          }
        });

        context.commit('addToast', {
          id: 'joinRoom',
          content: { message: 'meeting.toasts.you-joined' },
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 6000
        });

        console.log('[MP] Joined room', authenticated, peers, roles);

        context.commit('dismissToast', 'reconnecting');

        context.state.sounds.reconnecting.stop();

        // set data
        context.commit('me', {
          authenticated,
          roomPermissions,
          roles
        });

        // set room infos
        context.commit('set', {
          peers,
          locked,
          accessCode,
          allowWhenRoleMissing,
          mediasoupDevice,
          chatHistory: Array.isArray(chatHistory)
            ? chatHistory.map(message => parseSingleMessage(message))
            : chatHistory,
          consumers: [],
          isReconnecting: false
        });

        if (shouldProduce) {
          if (mediasoupDevice.canProduce('audio')) {
            // if user is not muted
            if (!isMuted) {
              await context.dispatch('updateMic', { start: true });

              // auto mute if there are more than 4 peers
              let autoMuteThreshold = 4;

              if (autoMuteThreshold && peers.length >= autoMuteThreshold) {
                console.log('[MP] Automatically muting microphone');
                await context.dispatch('muteMic');
              }
            }

            if (shouldJoinVideo) {
              await context.dispatch('updateWebcam', { start: true });
            }
          }
        }

        await context.dispatch('updateAudioOutputDevices');

        let { audioOutputDevices } = context.state;
        let { selectedAudioOutputDevice } = context.state.settings;

        // set default output device
        if (!selectedAudioOutputDevice && audioOutputDevices !== {}) {
          context.commit('settings', {
            selectedAudioOutputDevice: Object.keys(audioOutputDevices)[0]
          });
        }

        context.commit('set', { roomState: 'connected' });
      } catch (err) {
        console.log('[MP] Failed', err);
      }
    },

    async close(context, force) {
      let { closed, ws, sendTransport, recvTransport } = context.state;

      // if it's a public meeting and has history
      if (
        !context.state.channelId &&
        context.state.chatHistory.length > 0 &&
        router.history.current.name !== 'meeting'
      ) {
        router.push({
          name: 'meeting',
          params: {
            hash: context.state.roomId,
            preventJoin: true
          }
        });
      }

      context.commit('set', {
        closed: true,
        roomId: null,
        channelId: null,
        roomState: 'closed'
      });

      context.state.sounds.reconnecting.stop();

      await context.dispatch('disableMic');

      if (ws) ws.close();

      if (sendTransport) sendTransport.close();
      if (recvTransport) recvTransport.close();

      if (force && router.currentRoute.name == 'meeting') {
        router.push('/');
      }
    },

    async updatePreferredDevice(context, { mic, webcam, speaker, screen }) {
      // if it's a microphone change
      if (mic) {
        store.set('selectedAudioDevice', mic);

        context.commit('settings', {
          selectedAudioDevice: mic
        });

        await context.dispatch('updateMic', {
          restart: true,
          newDeviceId: mic
        });
      }

      // if it's a webcam change
      if (webcam) {
        store.set('selectedWebcam', webcam);

        context.commit('settings', {
          selectedWebcam: webcam
        });

        await context.dispatch('updateWebcam', {
          restart: true,
          newDeviceId: webcam
        });
      }

      // if it's a speaker change
      if (speaker) {
        store.set('selectedAudioOutputDevice', speaker);

        context.commit('settings', {
          selectedAudioOutputDevice: speaker
        });
      }

      // if it's a screen change
      if (screen) {
        store.set('selectedScreen', screen);

        context.commit('settings', {
          selectedScreen: screen
        });

        console.log('selectedScreen', screen);
      }

      console.log('Updating preferred');
    },

    async loadScreens(context) {
      console.log('[MP] Updating Screens');

      let { screenSharing } = context.state;

      try {
        const available = screenSharing.isScreenShareAvailable();
        if (!available) throw new Error('screen sharing not available');

        const screens = await screenSharing.getDevices();

        console.log(screens);

        context.commit('set', { screens });
      } catch (err) {
        console.log(err);

        context.commit('addToast', {
          id: 'loadScreens',
          content: { message: 'meeting.toasts.failed-load-screens' },
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 6000
        });
      }
    },

    async updateScreenSharing(
      context,
      { start = false, newResolution = null, newFrameRate = null } = {}
    ) {
      console.log('[MP] Updating ScreenShare');

      let {
        mediasoupDevice,
        sendTransport,
        screenSharing,
        useSharingSimulcast,
        screenSharingProducer,
        peerId,
        screens
      } = context.state;
      let { selectedScreen } = context.state.settings;

      selectedScreen =
        selectedScreen && screens[selectedScreen]
          ? selectedScreen
          : Object.keys(screens)[0];

      let track;

      try {
        const available = screenSharing.isScreenShareAvailable();

        if (!available) throw new Error('screen sharing not available');
        if (!mediasoupDevice.canProduce('video'))
          throw new Error('cannot produce video');

        /*
        if (newResolution)
          store.dispatch(settingsActions.setScreenSharingResolution(newResolution));

        if (newFrameRate)
          store.dispatch(settingsActions.setScreenSharingFrameRate(newFrameRate));
        */

        const {
          screenSharingResolution,
          screenSharingFrameRate
        } = context.state.settings;

        if (start) {
          const stream = await screenSharing.start(
            {
              ...VIDEO_CONSTRAINS[screenSharingResolution],
              frameRate: screenSharingFrameRate
            },
            selectedScreen
          );

          [track] = stream.getVideoTracks();

          if (useSharingSimulcast) {
            // If VP9 is the only available video codec then use SVC.
            const firstVideoCodec = mediasoupDevice.rtpCapabilities.codecs.find(
              c => c.kind === 'video'
            );

            let encodings;

            if (firstVideoCodec.mimeType.toLowerCase() === 'video/vp9') {
              encodings = VIDEO_SVC_ENCODINGS;
            } else {
              encodings = VIDEO_SIMULCAST_ENCODINGS.map(encoding => ({
                ...encoding,
                dtx: true
              }));
            }

            screenSharingProducer = await sendTransport.produce({
              track,
              encodings,
              codecOptions: {
                videoGoogleStartBitrate: 1000
              },
              appData: {
                source: 'screen'
              }
            });
          } else {
            screenSharingProducer = await sendTransport.produce({
              track,
              appData: {
                source: 'screen'
              }
            });
          }

          context.commit('set', { screenSharingProducer });

          context.commit('addResource', {
            group: 'producers',
            id: screenSharingProducer.id,
            peerId,
            deviceLabel: 'screen',
            source: 'screen',
            paused: screenSharingProducer.paused,
            track: screenSharingProducer.track,
            rtpParameters: screenSharingProducer.rtpParameters,
            codec: screenSharingProducer.rtpParameters.codecs[0].mimeType.split(
              '/'
            )[1]
          });

          screenSharingProducer.on('transportclose', () => {
            context.commit('set', { screenSharingProducer: null });
          });

          screenSharingProducer.on('trackended', () => {
            // TODO: add toast telling that the screensharing is disconnected
            context.dispatch('disableScreenSharing');
          });
        }
      } catch (err) {
        console.log(err);

        context.commit('addToast', {
          id: 'updateScreensharing',
          content: { message: 'meeting.toasts.failed-screensharing' },
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 6000
        });
      }
    },

    async disableScreenSharing(context) {
      let { screenSharingProducer, screenSharing } = context.state;

      console.log('[MP] Disabling ScreenSharing', screenSharingProducer);

      if (!screenSharingProducer) return;

      screenSharingProducer.close();

      context.commit('removeResource', {
        group: 'producers',
        id: screenSharingProducer.id
      });

      try {
        await context.dispatch('sendRequest', {
          method: 'closeProducer',
          data: { producerId: screenSharingProducer.id }
        });
      } catch (err) {
        console.log('[MP] Failed to disable screenshare', err);
      }

      context.commit('set', { screenSharingProducer: null });

      screenSharing.stop();
    },

    async updateWebcam(
      context,
      {
        start = false,
        restart = false,
        newDeviceId = null,
        newResolution = null,
        newFrameRate = null
      } = {}
    ) {
      console.log('[MP] Updating Webcam');

      let {
        mediasoupDevice,
        webcamProducer,
        sendTransport,
        useSimulcast
      } = context.state;

      let track;

      try {
        if (!mediasoupDevice.canProduce('video'))
          throw new Error('cannot produce video');
        if (newDeviceId && !restart)
          throw new Error('changing device requires restart');

        /*
        if (newDeviceId)
  				store.dispatch(settingsActions.setSelectedWebcamDevice(newDeviceId));

  			if (newResolution)
  				store.dispatch(settingsActions.setVideoResolution(newResolution));

  			if (newFrameRate)
  				store.dispatch(settingsActions.setVideoFrameRate(newFrameRate));
        */

        const deviceId = await context.dispatch('getWebcamDeviceId');
        const device = context.state.webcams[deviceId];

        if (!device) throw new Error('no webcam devices');

        const { resolution, frameRate } = context.state.settings;

        if ((restart && webcamProducer) || start) {
          if (webcamProducer) await context.dispatch('disableWebcam');

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { ideal: deviceId },
              ...VIDEO_CONSTRAINS[resolution],
              frameRate
            }
          });

          [track] = stream.getVideoTracks();

          const { deviceId: trackDeviceId } = track.getSettings();

          context.commit('set', { webcamDevice: trackDeviceId });

          if (useSimulcast) {
            const firstVideoCodec = mediasoupDevice.rtpCapabilities.codecs.find(
              c => c.kind === 'video'
            );

            let encodings;

            if (firstVideoCodec.mimeType.toLowerCase() === 'video/vp9') {
              encodings = VIDEO_KSVC_ENCODINGS;
            } else {
              encodings = VIDEO_SIMULCAST_ENCODINGS;
            }

            webcamProducer = await sendTransport.produce({
              track,
              encodings,
              codecOptions: {
                videoGoogleStartBitrate: 1000
              },
              appData: {
                source: 'webcam'
              }
            });
          } else {
            webcamProducer = await sendTransport.produce({
              track,
              appData: {
                source: 'webcam'
              }
            });
          }

          context.commit('set', { webcamProducer });

          context.commit('addResource', {
            group: 'producers',
            id: webcamProducer.id,
            source: 'webcam',
            paused: webcamProducer.paused,
            track: webcamProducer.track,
            rtpParameters: webcamProducer.rtpParameters,
            codec: webcamProducer.rtpParameters.codecs[0].mimeType.split('/')[1]
          });

          webcamProducer.on('transportclose', () => {
            context.commit('set', { webcamProducer: null });
          });

          webcamProducer.on('trackended', () => {
            // TODO: add toast telling that the webcam is disconnected
            context.dispatch('disableWebcam');
          });
        }
      } catch (err) {
        context.commit('addToast', {
          id: 'updateWebcam',
          content: { message: 'meeting.toasts.failed-webcam' },
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 6000
        });

        console.log(err);
      }
    },

    async disableWebcam(context) {
      let { webcamProducer } = context.state;

      console.log('[MP] Disabling Webcam', webcamProducer);

      if (!webcamProducer) return;

      webcamProducer.close();

      if (webcamProducer.track) webcamProducer.track.stop();

      context.commit('removeResource', {
        group: 'producers',
        id: webcamProducer.id
      });

      try {
        await context.dispatch('sendRequest', {
          method: 'closeProducer',
          data: { producerId: webcamProducer.id }
        });
      } catch (err) {
        console.log('[MP] Failed to disable webcam', err);
      }

      context.commit('set', { webcamProducer: null });
    },

    async muteMic(context) {
      let { micProducer } = context.state;

      console.log('[MP] Mutting Mic', micProducer);

      if (!micProducer) return;

      micProducer.pause();

      try {
        await context.dispatch('sendRequest', {
          method: 'pauseProducer',
          data: { producerId: micProducer.id }
        });
        context.commit('setProducer', {
          id: micProducer.id,
          attr: 'paused',
          value: true
        });
      } catch (err) {
        micProducer.resume();

        context.commit('addToast', {
          id: 'muteMic',
          content: { message: 'meeting.toasts.failed-mute-microphone' },
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 6000
        });

        console.log('[MP] Failed to mute Mic');
      }
    },

    async unmuteMic(context) {
      let { micProducer } = context.state;

      console.log('[MP] Unmutting Mic', micProducer);

      if (!micProducer) {
        await context.dispatch('updateMic', { start: true });
      } else {
        micProducer.resume();

        try {
          await context.dispatch('sendRequest', {
            method: 'resumeProducer',
            data: { producerId: micProducer.id }
          });
          context.commit('setProducer', {
            id: micProducer.id,
            attr: 'paused',
            value: false
          });
        } catch (err) {
          console.log('[MP] Failed to unmute Mic');
        }
      }
    },

    async disableMic(context) {
      let { micProducer } = context.state;

      console.log('[MP] Disabling Mic', micProducer);

      context.dispatch('disconnectLocalHark');

      if (!micProducer) return;

      micProducer.close();

      context.commit('removeResource', {
        group: 'producers',
        id: micProducer.id
      });

      try {
        await context.dispatch('sendRequest', {
          method: 'closeProducer',
          data: { producerId: micProducer.id }
        });
      } catch (err) {
        console.log('[MP] Failed to disable Mic', err);
      }

      context.commit('set', { micProducer: null });
    },

    // Peripherals management
    async updateMic(
      context,
      { start = false, restart = false, newDeviceId = null } = {}
    ) {
      console.log('[MP] Updating Mic');

      let { mediasoupDevice, micProducer, sendTransport } = context.state;

      let track;

      try {
        if (!mediasoupDevice.canProduce('audio'))
          throw new Error('cannot produce audio');
        if (newDeviceId && !restart)
          throw new Error('changing device requires restart');

        /*
        if (newDeviceId)
        store.dispatch(settingsActions.setSelectedAudioDevice(newDeviceId));
        */

        const deviceId = await context.dispatch('getAudioDeviceId');
        const device = context.state.audioDevices[deviceId];

        console.log('DEVICE ID', deviceId);

        if (!device) throw new Error('no audio devices');

        const {
          sampleRate,
          channelCount,
          volume,
          autoGainControl,
          echoCancellation,
          noiseSuppression,
          sampleSize
        } = context.state.settings;

        if ((restart && micProducer) || start) {
          context.dispatch('disconnectLocalHark');

          // disable mic
          if (micProducer) await context.dispatch('disableMic');

          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { ideal: deviceId },
              sampleRate,
              channelCount,
              volume,
              autoGainControl,
              echoCancellation,
              noiseSuppression,
              sampleSize
            }
          });

          [track] = stream.getAudioTracks();

          const { deviceId: trackDeviceId } = track.getSettings();

          context.commit('set', { audioDevice: trackDeviceId });

          micProducer = await sendTransport.produce({
            track,
            codecOptions: {
              opusStereo: false,
              opusDtx: true,
              opusFec: true,
              opusPtime: '3',
              opusMaxPlaybackRate: 48000
            },
            appData: { source: 'mic' }
          });

          context.commit('set', { micProducer });

          context.commit('addResource', {
            group: 'producers',
            id: micProducer.id,
            source: 'mic',
            paused: micProducer.paused,
            track: micProducer.track,
            rtpParameters: micProducer.rtpParameters,
            codec: micProducer.rtpParameters.codecs[0].mimeType.split('/')[1]
          });

          micProducer.on('transportclose', () => {
            context.commit('set', { micProducer: null });
          });

          micProducer.on('trackended', () => {
            context.dispatch('disableMic');

            context.commit('addToast', {
              id: 'disableMic',
              content: { message: 'meeting.toasts.disconnected-microphone' },
              contentType: 'text',
              type: 'primary',
              close: true,
              timeout: 6000
            });
          });

          // set my volume to 0
          micProducer.volume = 0;

          context.dispatch('connectLocalHark', track);
        } else if (micProducer) {
          ({ track } = this.micProducer);

          await track.applyConstraints({
            sampleRate,
            channelCount,
            volume,
            autoGainControl,
            echoCancellation,
            noiseSuppression,
            sampleSize
          });

          let { harkStream } = context.state;

          if (harkStream != null) {
            const [harkTrack] = harkStream.getAudioTracks();

            harkTrack &&
              (await harkTrack.applyConstraints({
                sampleRate,
                channelCount,
                volume,
                autoGainControl,
                echoCancellation,
                noiseSuppression,
                sampleSize
              }));
          }
        }

        console.log('Device', device);
      } catch (err) {
        if (context.state.micProducer) {
          let { track } = context.state.micProducer;
          if (track) track.stop();
        }

        context.commit('addToast', {
          id: 'updateMic',
          content: { message: 'meeting.toasts.failed-microphone' },
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 6000
        });

        console.log('[MP] Failed to update mic', err);
      }
    },

    // watch voice track to automatically mute and unmute
    connectLocalHark(context, track) {
      console.log('[MP] Connecting Local Hark');

      const { micProducer, peerId, me, settings } = context.state;
      const { noiseThreshold } = context.state.settings;

      // clone stream
      const harkStream = new MediaStream();
      const newTrack = track.clone();
      harkStream.addTrack(newTrack);
      newTrack.enabled = true;

      const hark = harkLib(harkStream, {
        play: false,
        interval: 10,
        threshold: noiseThreshold,
        history: 100
      });

      context.commit('set', { harkStream, hark });

      hark.lastVolume = -100;

      hark.on('volume_change', volume => {
        // conver dB to volume level
        volume = volume > -100 ? volume + 100 : 0;
        context.commit('setPeerVolume', { peerId, volume });
      });

      hark.on('speaking', () => {
        context.commit('me', { isSpeaking: true });

        if (micProducer && micProducer.paused) {
          context.commit('addToast', {
            id: 'muteSpeaking',
            content: { message: 'meeting.toasts.you-are-muted' },
            contentType: 'text',
            type: 'primary',
            close: true,
            timeout: 6000
          });
        }

        if (
          settings.voiceActivatedUnmute &&
          me.isAutoMuted &&
          micProducer &&
          micProducer.paused
        ) {
          micProducer.resume();
        }

        context.commit('me', { isAutoMuted: false });
      });

      hark.on('stopped_speaking', () => {
        context.commit('me', { isSpeaking: false });

        if (
          settings.voiceActivatedUnmute &&
          micProducer &&
          !micProducer.paused
        ) {
          micProducer.pause();
          context.commit('me', { isAutoMuted: true });
        }
      });
    },

    disconnectLocalHark(context) {
      console.log('[MP] Disconnectnig Local Hark');

      const { harkStream, hark } = context.state;

      if (harkStream != null) {
        let [track] = harkStream.getAudioTracks();

        track.stop();
        track = null;

        context.commit('set', { harkStream: null });
      }

      if (hark != null) {
        hark.stop();
      }
    },

    async getAudioDeviceId(context) {
      console.log('[MP] Getting Audio Device');

      try {
        await context.dispatch('updateAudioDevices');

        const { selectedAudioDevice } = context.state.settings;
        const { audioDevices } = context.state;

        if (selectedAudioDevice && audioDevices[selectedAudioDevice]) {
          return selectedAudioDevice;
        } else {
          const currentAudioDevices = Object.values(audioDevices);
          return currentAudioDevices[0]
            ? currentAudioDevices[0].deviceId
            : null;
        }
      } catch (err) {
        console.log('[MP] Failed to Update Audio Devices', err);
      }
    },

    async updateAudioDevices(context) {
      // reset the list
      let audioDevices = {};

      console.log('[MP] Updating Audio Devices');

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        for (const device of devices) {
          if (device.kind !== 'audioinput') continue;
          audioDevices[device.deviceId] = device;
        }

        // set audio devices
        context.commit('set', {
          audioDevices
        });
      } catch (err) {
        console.log('[MP] Failed to Update Audio Devices', err);
      }
    },

    async getWebcamDeviceId(context) {
      console.log('[MP] Getting Webcam Device');

      try {
        await context.dispatch('updateWebcams');

        const { selectedWebcam } = context.state.settings;
        const { webcams } = context.state;

        if (selectedWebcam && audioDevices[selectedWebcam]) {
          return selectedWebcam;
        } else {
          const currentWebcams = Object.values(webcams);
          return currentWebcams[0] ? currentWebcams[0].deviceId : null;
        }
      } catch (err) {
        console.log('[MP] Failed to Update Audio Devices', err);
      }
    },

    async updateWebcams(context) {
      // reset the list
      let webcams = {};

      console.log('[MP] Updating Webcams');

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        for (const device of devices) {
          if (device.kind !== 'videoinput') continue;

          webcams[device.deviceId] = device;
        }

        // set audio devices
        context.commit('set', {
          webcams
        });
      } catch (err) {
        console.log('[MP] Failed to Update Webcams', err);
      }
    },

    async updateAudioOutputDevices(context) {
      // reset the list
      let audioOutputDevices = {};

      console.log('[MP] Updating Audio Output Devices');

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        for (const device of devices) {
          if (device.kind !== 'audiooutput') continue;

          audioOutputDevices[device.deviceId] = device;
        }

        // set audio devices
        context.commit('set', {
          audioOutputDevices
        });
      } catch (err) {
        console.log('[MP] Failed to Update Webcams', err);
      }
    },

    startDevicesListener(context) {
      if (!navigator.mediaDevices) return;
      navigator.mediaDevices.addEventListener('devicechange', async () => {
        console.log('[MP] Device Changed');

        await context.dispatch('updateAudioDevices');
        await context.dispatch('updateWebcams');
        await context.dispatch('updateAudioOutputDevices');
      });
    },

    // send request trough websockets TODO: handle errors
    async sendRequest(context, { method, data }) {
      return new Promise((resolve, reject) => {
        const { ws, settings } = context.state;
        const requestId = uuid();

        // send command
        ws.send(
          JSON.stringify({
            type: 'request',
            id: requestId,
            method,
            data
          })
        );

        const timeout = setTimeout(() => {
          console.log('[MP] Timeout', method);
          reject('timeout');
        }, settings.requestTimeout);

        // wait for the ws to reply
        context.commit('setRequest', {
          id: requestId,
          callback: (err, response) => {
            clearTimeout(timeout);
            if (err) reject(response);
            context.commit('setRequest', requestId);
            resolve(response);
          }
        });
      });
    },

    // MODERATION

    async kickPeer(context, peerId) {
      await context.dispatch('sendRequest', {
        method: 'moderator:kickPeer',
        data: {
          peerId
        }
      });
    },

    async mutePeer(context, peerId) {
      await context.dispatch('sendRequest', {
        method: 'moderator:mute',
        data: {
          peerId
        }
      });
    },

    async muteAll(context) {
      await context.dispatch('sendRequest', {
        method: 'moderator:muteAll'
      });
    },

    async stopPeerVideo(context, peerId) {
      await context.dispatch('sendRequest', {
        method: 'moderator:stopVideo',
        data: {
          peerId
        }
      });
    },

    async stopPeerScreen(context, peerId) {
      await context.dispatch('sendRequest', {
        method: 'moderator:stopScreenSharing',
        data: {
          peerId
        }
      });
    },

    async stopAllVideo(context) {
      await context.dispatch('sendRequest', {
        method: 'moderator:stopAllVideo'
      });
    },

    async closeMeeting(context) {
      await context.dispatch('sendRequest', {
        method: 'moderator:closeMeeting'
      });
    },

    async goPublic(context) {
      return await context.dispatch('sendRequest', {
        method: 'moderator:goPublic'
      });
    },

    onGoPublic(context) {
      if (
        router.currentRoute.name == 'channel' ||
        router.currentRoute.name == 'channel-sub'
      ) {
        context.commit('set', { channelId: null });
        router.push(`/meeting/${context.state.roomId}`);
      }

      context.commit('addToast', {
        id: 'goPublic',
        content: {
          message: 'meeting.toasts.is-now-public'
        },
        contentType: 'text',
        type: 'primary',
        close: true,
        timeout: 6000
      });
    },

    // message
    async sendMessage(context, message) {
      if (message == '') return;

      const response = await context.dispatch('sendRequest', {
        method: 'chatMessage',
        data: {
          chatMessage: message
        }
      });

      context.commit('addMessage', parseSingleMessage(response));
    },

    onReceiveMessage(context, message) {
      const { notify } = context.rootState.core;

      context.commit('addMessage', parseSingleMessage(message));

      if (document.hasFocus() && router.currentRoute.name == 'meeting') {
        notify.messageSound.play();
      } else {
        notify.create({
          title: message.author.display_name,
          body: parseMessageContent(message.content, null, true),
          isMeetingActive: this.getters['meeting/isMeetingActive'],
          onClick: function() {
            window.focus();

            if (router.currentRoute.name !== 'meeting') {
              router.push({
                name: 'meeting',
                params: {
                  hash: context.state.roomId
                }
              });
            }

            // set audio devices
            context.commit('set', {
              isChatOpen: true,
              chatUnreadCount: 0
            });

            this.close();
          }
        });
      }
    },

    downloadChat(context) {
      const parsedChat = context.state.chatHistory.map(message => {
        return `${message.author.display_name} - ${parseTime(
          message.created_on
        ).format('hh:mm A')}: ${parseMessageContent(
          message.content,
          null,
          true
        )}`;
      });

      var blob = new Blob([parsedChat.join('\n')], { type: 'text/csv' });
      if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, 'meeting.txt');
      } else {
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = 'meeting.txt';
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
      }
    }
  },
  getters: {
    getPeer: state => id => {
      return _.find(state.peers, { id });
    },
    getMappedPeers: state => {
      let map = {};
      state.peers.forEach(peer => {
        map[peer.id] = peer;
      });
      return map;
    },
    getConsumers: state => peerId => {
      return _.filter(state.consumers, { peerId });
    },
    getAudioConsumers: state => {
      return _.filter(state.consumers, { source: 'mic' });
    },
    getConsumerByType: state => peerId => {
      let consumersObject = {};
      const consumers = _.filter(state.consumers, { peerId });

      consumers.forEach(consumer => {
        consumersObject[consumer.source] = consumer;
      });

      return consumersObject;
    },
    getScreenConsumers: state => {
      return _.filter(state.consumers, { source: 'screen' });
    },

    getProducersByType: state => {
      let producersObject = {};
      const producers = state.producers;

      producers.forEach(producer => {
        producersObject[producer.source] = producer;
      });

      return producersObject;
    },

    getAllProducersByType: state => {
      let producersObject = {};
      const producers = state.producers;

      producers.forEach(producer => {
        if (producersObject[producer.source]) {
          producersObject[producer.source].push(producer);
        } else {
          producersObject[producer.source] = [producer];
        }
      });

      return producersObject;
    },

    isMeetingActive: state => {
      return !!state.roomId && state.roomState === 'connected';
    },

    hasScreenShare: state => {
      return _.find(state.consumers, { source: 'screen' });
    },
    isScreenSharing: state => {
      return _.find(state.producers, { source: 'screen' });
    },
    getMe: state => {
      if (!state.me.roomPermissions) return null;

      let me = { ...state.me, id: state.peerId, permissions: {} };

      Object.keys(me.roomPermissions).forEach(item => {
        me.permissions[item] =
          me.roles.indexOf(me.roomPermissions[item][0].id) > -1;
      });

      return me;
    },
    selfPeer: (state, getters, store) => {
      if (state.peerId) {
        return {
          displayName: state.guest
            ? state.guest.display_name
            : store.core.user.display_name,
          id: state.peerId,
          consumers: {},
          permissions: state.me.roles
        };
      }
      return {};
    }
  }
};
