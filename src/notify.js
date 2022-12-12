import Push from 'push.js';
import { Howl } from 'howler';
const { ipcRenderer } = window;
import isElectron from 'is-electron';
import store from 'store';
import { v1 as uuid } from 'uuid';

export default class Notify {
  constructor() {
    this.push = Push;

    this.notificationSound = new Howl({
      src: ['/notification.mp3']
    });

    this.messageSound = new Howl({
      src: ['/message.mp3']
    });

    this.meetingSound = new Howl({
      src: ['/new-meeting.wav']
    });

    this.callbacks = {};

    if (window.ipcRenderer) {
      window.ipcRenderer.on('notification-click', (e, id) => {
        if (this.callbacks[id]) {
          this.callbacks[id].call();
        }
        delete this.callbacks[id];
      });
      window.ipcRenderer.on('notification-reply', (e, id, reply) => {
        if (this.callbacks[id]) {
          this.callbacks[id].call(this, reply);
        }
        delete this.callbacks[id];
      });
    }
  }

  create({ title, body, onClick, onReply, muted, isMeetingActive }) {
    try {
      if (isElectron()) {
        const id = uuid();
        this.callbacks[id] = onClick;

        const replyId = onReply ? uuid() : null;

        if (onReply) {
          this.callbacks[replyId] = onReply;
        }

        ipcRenderer.send('new-message', {
          title,
          body,
          id,
          replyId,
          isMeetingActive
        });
      } else {
        this.push.create(title, {
          body: body,
          icon: '/airsend-icon.png',
          timeout: 4000,
          onClick: onClick,
          silent: true
        });
      }

      if (
        !store.get('muteNotifications') &&
        !store.get('muteSounds') &&
        !muted
      ) {
        this.notificationSound.volume(isMeetingActive ? 0.15 : 0.5);
        this.notificationSound.play();
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}
