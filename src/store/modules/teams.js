import Vue from 'vue';
import Vuex from 'vuex';

import _ from 'lodash';
import AirSend from 'airsend/client';

Vue.use(Vuex);

const getDefaultState = () => {
  return {
    all: [],
    client: new AirSend(),
    single: {},
    members: {},
    teamColor: {}
  };
};

// initial state
const state = getDefaultState();

export default {
  namespaced: true,
  state,
  mutations: {
    set: (state, payload) => {
      Object.keys(payload).forEach(key => {
        Vue.set(state, key, payload[key]);
      });
    },
    update: (state, payload) => {
      const teamIndex = _.findIndex(state.all, { id: payload.id });
      if (teamIndex === -1) return;

      Vue.set(state.all, teamIndex, {
        ...state.all[teamIndex],
        ...payload
      });
    },
    single: (state, payload) => {
      let team = payload;
      Vue.set(state.single, payload.id, team);
    },
    members: (state, payload) => {
      let { members, team_id } = payload;
      Vue.set(state.members, team_id, members);
    },
    addTeam: (state, payload) => {
      state.all.push(payload);
    },
    resetState(state) {
      Object.assign(state, getDefaultState());
    }
  },
  actions: {
    async list(context) {
      const response = await context.state.client.get('team.list');

      const teams = response.data.teams;
      let colors = {};
      teams.forEach(team => {
        colors[team.id] = team.tag_color ? `#${team.tag_color}` : '';
      });

      context.commit('set', { all: teams, teamColor: colors });
      return response;
    },
    async create(context, payload) {
      const response = await context.state.client.post('team.create', {
        name: payload.name
      });

      if (response.ok) {
        context.commit('addTeam', response.data.team);
      }

      return response;
    },
    async get(context, { id }) {
      const response = await context.state.client.get('team.info', {
        team_id: id
      });

      if (response.ok) {
        context.commit('single', response.data.team);
      } else {
        this.commit('core/addToast', {
          id: 'team.info',
          content: 'Failed to get team information',
          contentType: 'text',
          type: 'danger',
          close: true
        });
      }
      return response;
    },
    async update(context, payload) {
      //update name and announcements
      const response = await context.state.client.post('team.update', payload);

      if (!response.ok) {
        this.commit('core/addToast', {
          id: 'team.setting',
          content: 'Failed to update team',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },
    async set(context, payload) {
      //change team settings, such as color_tag
      const response = await context.state.client.post('team.setting', payload);

      if (!response.ok) {
        this.commit('core/addToast', {
          id: 'team.setting',
          content: 'Failed to update team',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    async getMembers(context, { id, silent }) {
      const response = await context.state.client.get('team.members', {
        team_id: id
      });

      if (response.ok) {
        context.commit('members', {
          team_id: id,
          members: response.data.members
        });
      } else if (!response.ok && !silent) {
        this.commit('core/addToast', {
          id: 'team.members',
          content: 'Failed to get team members',
          contentType: 'text',
          type: 'danger',
          close: true
        });
      }

      return response;
    },

    async addMembers(context, payload) {
      let request = {
        team_id: payload.team_id
      };

      // if there are emails
      if (payload.emails.length > 0) {
        request.users = payload.emails
          .map(user => {
            return typeof user === 'string'
              ? user
              : user.email
              ? user.email
              : user.id;
          })
          .join(',');
      }

      // if there are channels
      if (payload.channels.length > 0) {
        request.channels = payload.channels
          .map(channel => channel.id)
          .join(',');
      }

      // fetch channels
      const response = await context.state.client.post('team.invite', request);

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'team.invite',
          content: 'Successfully added user(s) to the team',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      } else {
        this.commit('core/addToast', {
          id: 'team.invite',
          content: 'Failed to add user(s) to the team',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },
    async removeMember(context, { team_id, user_id }) {
      const response = await context.state.client.post('team.kick', {
        team_id,
        user_id
      });

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'team.kick',
          content: 'Successfully removed user from the team',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      } else {
        this.commit('core/addToast', {
          id: 'team.kick',
          content: 'Failed to remove member(s)',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
        return {
          ...response,
          error: 'Failed to remove member(s)'
        };
      }
      return response;
    },
    async setRole(context, payload) {
      //const { team_id, user_id, role } = payload;
      //role: [10, 50]

      const response = await context.state.client.post(
        'team.user.role',
        payload
      );

      if (!response.ok) {
        this.commit('core/addToast', {
          id: 'team.user.role',
          content: 'Failed to update role',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }
      return response;
    },

    async channelOpenStatus(context, payload) {
      const { channel_id, open } = payload;

      const response = await context.state.client.post(
        'team.channel.open_status',
        {
          channel_id,
          open: open ? 1 : 0
        }
      );

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'team.channel.open_status',
          content: 'Successfully updated channel',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      } else {
        this.commit('core/addToast', {
          id: 'team.channel.open_status',
          content: 'Failed to update channel',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    async transferChannelOwnership(context, payload) {
      //const {channel_id, new_owner_id} = payload;

      const response = await context.state.client.post(
        'team.channel.owner',
        payload
      );

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'team.channel.open_status',
          content: 'Successfully updated channel',
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 3000
        });
      } else {
        this.commit('core/addToast', {
          id: 'team.channel.open_status',
          content: 'Failed to update channel',
          contentType: 'text',
          type: 'danger',
          close: true,
          timeout: 3000
        });
      }

      return response;
    },

    async onMemberAdded(context, payload) {
      const { member, team_id } = payload;

      //member just added to the team
      const user = context.rootState.core.user;
      if (member.id === user.id) {
        await context.dispatch('list');
        return;
      }

      //update members Object
      let members = context.state.members[team_id] || [];
      const userAlreadyExists = _.find(members, { id: member.id });
      if (userAlreadyExists) return;

      members.push(member);
      context.commit('members', {
        team_id,
        members
      });

      //update members count in all
      let teamIndex = _.findIndex(context.state.all, { id: team_id });
      if (teamIndex > -1) {
        let team = context.state.all[teamIndex];
        team.members_count++;
        context.commit('update', team);
      }

      //update members count in Single
      if (context.state.single[team_id]) {
        let team = context.state.single[team_id];
        team.members_count++;
        context.commit('single', team);
      }
    },

    async onMemberRemoved(context, payload) {
      const { member, team_id } = payload;

      //member just removed from the team
      const user = context.rootState.core.user;
      if (member.id === user.id) {
        let teams = context.state.all;
        let teamIndex = _.findIndex(teams, { id: team_id });
        if (teamIndex > -1) {
          teams.splice(teamIndex, 1);
          context.commit('set', { all: teams });
        }

        let single = context.state.single;
        delete single[team_id];
        context.commit('set', { single: single });

        let teamColor = context.state.teamColor;
        delete teamColor[team_id];
        context.commit('set', { teamColor: teamColor });

        return;
      }

      //update members Object
      let members = _.cloneDeep(context.state.members[team_id] || []);

      const userIndex = _.findIndex(members, { id: member.id });
      if (userIndex === -1) return; //user does not exists

      members.splice(userIndex, 1);

      context.commit('members', {
        team_id,
        members
      });

      //update members count in all
      let teamIndex = _.findIndex(context.state.all, { id: team_id });
      if (teamIndex > -1) {
        let team = context.state.all[teamIndex];
        team.members_count--;
        context.commit('update', team);
      }

      //update members count in Single
      if (context.state.single[team_id]) {
        let team = context.state.single[team_id];
        team.members_count--;
        context.commit('single', team);
      }
    },

    async onMemberUpdated(context, payload) {
      const { team_id, member } = payload;

      const user = context.rootState.core.user;
      if (member.id === user.id) {
        context.dispatch('get', { id: team_id }); //team.info returns a different payload for each role.

        const teamIndex = _.findIndex(context.state.all, { id: team_id });
        if (teamIndex > -1) {
          context.commit('update', {
            ...context.state.all[teamIndex],
            role_id: member.role
          });
        }
      }

      if (!context.state.members[team_id]) return;
      let members = context.state.members[team_id];

      const memberIndex = _.findIndex(members, { id: member.id });
      if (memberIndex === -1) return;

      members.splice(memberIndex, 1, member);

      context.commit('members', { team_id, members });
    },

    async onChannelAdded(context, payload) {
      const { channel, team_id } = payload;

      if (!context.state.single[team_id]) return;

      //add in all_channels
      let channels = _.cloneDeep(context.state.single[team_id].all_channels);
      let channelAlreadyExists = _.find(channels, { id: channel.id });
      if (!channelAlreadyExists) {
        channels.push(channel);

        context.commit('single', {
          ...context.state.single[team_id],
          all_channels: channels
        });
      }

      //add in open_channels
      if (channel.open_team_join) {
        channels = _.cloneDeep(context.state.single[team_id].open_channels);
        channelAlreadyExists = _.find(channels, { id: channel.id });
        if (!channelAlreadyExists) {
          let openChannel = _.pick(channel, [
            'id',
            'blurb',
            'name',
            'has_logo'
          ]);
          openChannel.members_count = channel.members.length;
          openChannel.has_joined = channel.members.some(
            member => member.id === loggedUser.id
          );

          channels.splice(channelIndex, 1, openChannel);

          context.commit('single', {
            ...context.state.single[team_id],
            open_channels: channels
          });
        }
      }
    },

    async onChannelRemoved(context, payload) {
      const { channel, team_id } = payload;

      if (!context.state.single[team_id]) return;

      //remove from all_channels
      let channels = _.cloneDeep(
        context.state.single[team_id].all_channels || []
      );
      let channelIndex = _.findIndex(channels, { id: channel.id });
      if (channelIndex > -1) {
        channels.splice(channelIndex, 1);

        context.commit('single', {
          ...context.state.single[team_id],
          all_channels: channels
        });
      }

      //remove from open_channels
      channels = _.cloneDeep(context.state.single[team_id].open_channels);
      channelIndex = _.findIndex(channels, { id: channel.id });
      channels.splice(channelIndex, 1);

      context.commit('single', {
        ...context.state.single[team_id],
        open_channels: channels
      });
    },

    async onChannelUpdated(context, payload) {
      const { team_id, channel } = payload;

      if (!context.state.single[team_id]) return;

      //update 'all_channels'
      let channels = _.cloneDeep(context.state.single[team_id].all_channels);
      let channelIndex = _.findIndex(channels, { id: channel.id });
      if (channelIndex > -1) {
        channels.splice(channelIndex, 1, channel);
        context.commit('single', {
          ...context.state.single[team_id],
          all_channels: channels
        });
      }

      //update 'open_channels'
      channels = _.cloneDeep(context.state.single[team_id].open_channels);
      channelIndex = _.findIndex(channels, { id: channel.id });
      //add or update
      if (channel.open_team_join) {
        const user = context.rootState.core.user;
        let openChannel = _.pick(channel, ['id', 'blurb', 'has_logo']);
        openChannel.has_joined = channel.members.some(
          member => member.id === user.id
        );
        openChannel.members_count = channel.members.length;
        openChannel.name = channel.channel_name;

        if (channelIndex > -1) {
          //update
          channels.splice(channelIndex, 1, openChannel);
        } else {
          //insert
          channels.unshift(openChannel);
        }

        context.commit('single', {
          ...context.state.single[team_id],
          open_channels: channels
        });
      } else if (!channel.open_team_join && channelIndex > -1) {
        //was a open channel, but event is closing
        channels.splice(channelIndex, 1);

        context.commit('single', {
          ...context.state.single[team_id],
          open_channels: channels
        });
      }
    },

    async onTeamUpdated(context, payload) {
      const { team } = payload;
      const team_id = team.id;

      //update all
      let teamAll = _.pick(team, [
        'id',
        'members_count',
        'name',
        'role',
        'role_id',
        'tag_color'
      ]);
      context.commit('update', teamAll);

      context.commit('set', {
        teamColor: {
          ...context.state.teamColor,
          [team_id]: team.tag_color ? `#${team.tag_color}` : ''
        }
      });

      //update single
      if (!context.state.single[team_id]) return;
      context.commit('single', team);
    }
  },
  getters: {
    getTeamById: state => id => {
      if (state.single[id]) {
        return (
          {
            ...state.single[id],
            members: state.members[id]
          } || {}
        );
      } else {
        return _.find(state.all, { id: parseInt(id) }) || {};
      }
    },
    getTeamColor: state => id => {
      return state.teamColor[id];
    },
    getTeamName: state => team_id => {
      const team = _.find(state.all, { id: team_id });
      if (team) return team.name;
      return null;
    },
    isTeamMember: state => team_id => {
      const teamIndex = _.findIndex(state.all, { id: team_id });
      if (teamIndex === -1) return false;
      return true;
    },
    getMembers: state => {
      //members by key
      let members = state.members;
      for (const [key, value] of Object.entries(members)) {
        members[key] = _.keyBy(value, 'id');
      }
      return members;
    }
  }
};
