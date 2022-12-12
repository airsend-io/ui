/*
CONST CHANNEL_USER_ROLE_OWNER              = 100; // can edit the channel,  can add user to channel, update action, file, wiki, message
CONST CHANNEL_USER_ROLE_MANAGER            = 50;  // cannot edit channel, can add user to channel, update action, file, wiki, message
CONST CHANNEL_USER_ROLE_COLLABORATOR_WIKI  = 30;  // cannot edit channel, cannot add user to channel, can update action, file, wiki, message
CONST CHANNEL_USER_ROLE_COLLABORATOR       = 20;  // cannot edit channel, cannot add user to channel, can update action, file, message
CONST CHANNEL_USER_ROLE_VIEWER             = 10;  // only read access to channel
*/

// default has permission
const can = function(perm) {
  return this.perms[perm] && this.perms[perm] === true;
};

const ChannelRoles = {
  '10': {
    title: 'viewer',
    description: 'Read Messages, Wiki and Download Files',
    icon: 'user',
    perms: {},
    level: 10,
    can
  },
  '20': {
    title: 'collaborator',
    description: 'Post Messages, Read Wiki and Upload Files',
    icon: 'user-edit',
    perms: {
      'action.create': false,
      'action.update': false,
      'file.upload': true,
      'channel.message': true
    },
    level: 20,
    can
  },
  '30': {
    title: 'full-collaborator',
    description: 'Post Messages, Edit Wiki and Upload Files',
    icon: 'user-tie',
    perms: {
      'action.create': true,
      'action.update': true,
      'file.upload': true,
      'wiki.edit': true,
      'channel.message': true
    },
    level: 30,
    can
  },
  '50': {
    title: 'manager',
    description: 'Post Messages, Edit Wiki, Upload Files and Managing users',
    icon: 'user-shield',
    perms: {
      'channel.invite': true,
      'channel.kick': true,
      'action.create': true,
      'action.update': true,
      'wiki.edit': true,
      'file.upload': true,
      'channel.message': true,
      'channel.manage': true,
      'channel.approve': true
    },
    level: 50,
    can
  },
  '100': {
    title: 'admin',
    description: 'Manage channel completely',
    icon: 'user-crown',
    perms: {
      super: true
    },
    level: 100,
    can() {
      return true;
    }
  }
};
export default Object.freeze(ChannelRoles);
