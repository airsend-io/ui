/*
CONST TEAM_USER_ROLE_OWNER = 100;// can edit team 
CONST TEAM_USER_ROLE_MANAGER = 50; // cannot edit team add/update files to team, add channel to team 
CONST TEAM_USER_ROLE_COLLABORATOR = 20; // cannot edit team add/update files to team (no diff from manager at this point) 
CONST TEAM_USER_ROLE_MEMBER = 10;
*/

// default has permission
const can = function(perm) {
  return this.perms[perm] && this.perms[perm] === true;
};

const TeamRoles = {
  '10': {
    title: 'member',
    description: 'Team member. Does not have any control in the team',
    icon: 'user',
    perms: {
      'settings.tabs.members': true,
      'settings.add-channels': true,
      'settings.tabs.open-channels': true,
      'settings.tabs.announcements': true
    },
    level: 10,
    can
  },
  '50': {
    title: 'manager',
    description:
      'Can add channel to team, Cannot edit team add/update files to team',
    icon: 'user-edit',
    perms: {
      'settings.tabs.settings': true,
      'settings.tabs.members': true,
      'settings.tabs.channels': true,
      'settings.tabs.open-channels': true,
      'settings.tabs.announcements': true,
      'settings.tabs.files': true,
      'settings.members.invite': true,
      'settings.members.kick': true,
      'settings.add-channels': true,
      'settings.members.promote': true,
      'teams.manage': true, //usage card, open team settings from Manage Team, edit announcements
      'settings.take-channel-ownership': true,
      'channel.invite': true,
      'channel.kick': true
    },
    level: 50,
    can
  },
  '100': {
    title: 'owner',
    description: 'Manage team completely',
    icon: 'user-crown',
    perms: {
      super: true,
      'settings.tabs.settings': true,
      'settings.tabs.members': true,
      'settings.tabs.channels': true,
      'settings.tabs.files': true,
      'settings.tabs.open-channels': true,
      'settings.tabs.announcements': true,
      'settings.members.invite': true,
      'settings.members.kick': true,
      'settings.members.promote': true,
      'settings.add-channels': true,
      'teams.manage': true,
      'settings.take-channel-ownership': true,
      'channel.invite': true,
      'channel.kick': true
    },
    level: 100,
    can() {
      return true;
    }
  }
};
export default Object.freeze(TeamRoles);
