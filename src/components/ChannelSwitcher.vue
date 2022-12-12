<template>
  <fragment>
    <aside
      class="channel-switcher"
      :class="{ [`channel-switcher--minified`]: isMinified }"
      v-hotkey="keymap"
    >
      <div
        class="channel-switcher-toggle-button"
        :class="{
          ['has-unread']:
            $store.getters['channels/getUnreadCount'] > 0 && isMinified
        }"
        @click="toggleMinification"
      >
        <Icon
          family="far"
          :name="isMinified ? 'arrow-to-right' : 'arrow-to-left'"
        />
      </div>

      <Loader full :loading="loading" />

      <div class="channel-switcher-header">
        <button
          v-tooltip="{
            delay: 1000,
            html: true,
            content: $t('channels.forms.create-channel')
          }"
          type="button"
          class="btn btn-primary btn-sm btn-add-channel"
          @click="$modal.show('channel-create')"
        >
          <Icon class="mx-0" family="far" name="plus" />
        </button>
        <Popover
          class="mr-auto"
          ref="createGroupPop"
          @update:open="createGroupOpened"
        >
          <button
            v-tooltip="{
              delay: { show: 1000, hide: 0 },
              html: true,
              content: `<div class='create-channel-popup'><div>${$t(
                'channels.groups.create-group'
              )}</div><span>${$t(
                'channels.groups.create-group-description'
              )}</span></div>`
            }"
            type="button"
            class="btn btn-sm ml-1 btn-add-group"
          >
            <Icon class="mx-0" family="far" name="layer-group" />
          </button>
          <template slot="popover">
            <Loader
              full
              :loading="$store.state.loading['channel.group.create']"
            />
            <div class="wrapper create-group-popup dropdown-items">
              <div class="form-group">
                <label for="channel_name" class="mb-2 title-text">{{
                  $t('channels.groups.create-group')
                }}</label>
                <input
                  id="channel_name"
                  ref="inputCreateGroup"
                  v-model="newGroupName"
                  class="form-control form-control-sm"
                  type="text"
                  :placeholder="$t('channels.groups.create-group-label')"
                />
                <button
                  class="btn btn-primary btn-sm"
                  @click="onSubmitCreateGroup"
                  :disabled="!newGroupName.trim()"
                >
                  {{ $t('general.create') }}
                </button>
                <button
                  class="btn ml-3 btn-sm btn-primary btn-ghost"
                  @click="cancelGroupCreation"
                >
                  {{ $t('general.cancel') }}
                </button>
              </div>
            </div>
          </template>
        </Popover>

        <button
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: toggleCollapseTooltip
          }"
          type="button"
          class="btn btn-icon btn-sm toggle-group-collapse"
          @click="onToggleGroupCollapse"
          v-if="showGroups"
        >
          <ToggleGroupCollapse v-if="!hasExpandedGroups" />
          <ToggleGroupExpand v-else />
        </button>

        <button
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('channels.switcher-compact')
          }"
          type="button"
          class="btn btn-icon btn-sm"
          :class="{ compact: isCompactView }"
          @click="onToggleView"
        >
          <Icon v-if="isCompactView" family="far" name="arrows-v" />

          <Icon v-if="!isCompactView" family="far" name="grip-lines" />
          <Icon v-else family="far" name="bars" />
        </button>
      </div>

      <div class="channel-switcher-subheader">
        <div class="form-group form-group--icon form-group--search">
          <Icon family="far" name="filter" />
          <input
            ref="input"
            v-model="query"
            class="form-control form-control-sm form-control--rounded form-control--large"
            :class="{ 'has-pos-icon': query !== '' }"
            type="text"
            :placeholder="$t('channels.switcher-filter')"
            aria-label="Search"
            @keyup="onSearch"
          />
          <button
            v-if="query !== ''"
            type="button"
            class="btn btn-icon btn-sm"
            @click="onCancelSearch"
          >
            <Icon family="far" name="times" class="icon-close" />
          </button>
        </div>
        <div>
          <Popover popover-class="channel-switcher-settings">
            <button type="button" class="btn btn-icon btn-sm">
              <Icon family="far" name="sort-amount-down" />
            </button>
            <template slot="popover">
              <div class="dropdown-items">
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  @click="() => onChangeFilter('showGroups', true)"
                >
                  <Icon
                    family="fal"
                    name="check"
                    :class="{ active: showGroups }"
                  />
                  {{ $t('channels.filters.show-categories') }}
                </button>
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  @click="() => onChangeFilter('showGroups', false)"
                >
                  <Icon
                    family="fal"
                    name="check"
                    :class="{ active: !showGroups }"
                  />{{ $t('channels.filters.hide-categories') }}
                </button>
                <div class="dropdown-divider"></div>
                <div class="dropdown-title">
                  <span>{{ $t('channels.filters.sorting') }}</span>
                </div>

                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  @click="
                    () => onChangeFilter('sortBy', 'last_active_on_ts-desc')
                  "
                >
                  <Icon
                    family="fal"
                    name="check"
                    :class="{ active: sortingByRecent }"
                  />{{ $t('channels.filters.most-recently-active') }}
                </button>
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  @click="() => onChangeFilter('sortBy', 'unread_count-desc')"
                >
                  <Icon
                    family="fal"
                    name="check"
                    :class="{ active: sortingByUnread }"
                  />{{ $t('channels.filters.unread-count') }}
                </button>
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  @click="() => onChangeFilter('sortBy', 'created_on_ts-desc')"
                >
                  <Icon
                    family="fal"
                    name="check"
                    :class="{ active: sortingByCreation }"
                  />{{ $t('channels.filters.new-channels') }}
                </button>

                <div class="dropdown-divider"></div>
                <div class="dropdown-title">
                  <span>{{ $t('general.view') }}</span>
                </div>
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  @click="() => onChangeFilter('filterBy', 'all')"
                >
                  <Icon
                    family="fal"
                    name="check"
                    :class="{ active: filteringByAll }"
                  />{{ $t('channels.filters.show-all') }}
                </button>
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  @click="() => onChangeFilter('filterBy', 'active')"
                >
                  <Icon
                    family="fal"
                    name="check"
                    :class="{ active: filteringByActive }"
                  />{{ $t('channels.filters.show-active') }}
                </button>
                <button
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  @click="() => onChangeFilter('filterBy', 'closed')"
                >
                  <Icon
                    family="fal"
                    name="check"
                    :class="{ active: filteringByClosed }"
                  />{{ $t('channels.filters.show-closed') }}
                </button>

                <fragment v-if="useTeams">
                  <div class="dropdown-divider"></div>
                  <div class="dropdown-title">
                    <span>{{ $t('general.teams') }}</span>
                  </div>
                  <button
                    v-close-popover
                    class="dropdown-item"
                    type="button"
                    @click="() => onChangeFilter('teams', [])"
                  >
                    <Icon
                      family="fal"
                      name="check"
                      :class="{ active: showChannelsFromAllTeams }"
                    />{{ $t('teams.forms.show-all') }}
                  </button>

                  <Popover
                    trigger="hover"
                    placement="left-start"
                    popoverArrowClass="d-none"
                    :offset="-12"
                  >
                    <button
                      class="dropdown-item icon-padding dropdown-tree"
                      type="button"
                    >
                      {{ $t('teams.forms.show-only') }}
                      <Icon family="fal" name="chevron-right" class="active" />
                    </button>
                    <template slot="popover">
                      <div class="dropdown-items team-filter-switcher">
                        <button
                          v-close-popover
                          class="dropdown-item"
                          type="button"
                          v-for="team in teams"
                          :key="team.id"
                          @click="() => onToggleTeamFilter(team)"
                        >
                          <Icon
                            family="fal"
                            name="check"
                            :class="{
                              invisible: teamFilters.indexOf(team.id) === -1
                            }"
                            v-if="!showChannelsFromAllTeams"
                          />
                          <span>{{ team.name }}</span>
                          <div
                            class="color-item"
                            :style="{
                              'background-color': getTeamColor(team.id)
                            }"
                          ></div>
                        </button>
                      </div>
                    </template>
                  </Popover>
                </fragment>
              </div>
            </template>
          </Popover>
        </div>
      </div>

      <!-- Groups -->
      <perfect-scrollbar
        class="channel-switcher-body list-group"
        id="#channel-switcher-scroll-area"
        ref="viewport"
      >
        <!-- Search results -->
        <div v-if="query.trim()" class="search-result">
          <div
            v-if="
              channels &&
                channels.length === 0 &&
                suggestedChannels.length === 0
            "
            class="empty-wrapper"
          >
            <div class="empty-box">
              <Icon family="fal" name="filter" />
              <h4>{{ $t('channels.switcher-no-channels') }}</h4>
              <p>{{ $t('general.try-another-keyword') }}</p>
              <button
                class="btn btn-primary mx-auto"
                @click="onShowAllChannels"
              >
                {{ $t('channels.show-all') }}
              </button>
            </div>
          </div>
          <div v-else>
            <ChannelsList
              :channels="channels"
              :isCompactView="isCompactView"
              @unblocked="$emit('unblocked', true)"
              @moveToGroup="moveToGroup"
              @onDrag="onDrag"
            />
            <div
              v-for="suggestion in suggestedChannels"
              class="list-group-item list-group-item-action list-group-item--suggestion"
              @click="$modal.show('user-modal', suggestion.user)"
              :key="suggestion.id"
            >
              <Avatar
                :name="suggestion.user.display_name"
                :active="suggestion.user.online_status"
                :user-id="suggestion.user.id"
                :has-avatar="suggestion.user.has_avatar"
                :cache="suggestion.user.updated_on_ts"
                size="small"
                class="opacity-3"
                light
              />
              <div class="list-group-item-content">
                <h5>
                  {{ suggestion.user.display_name }}
                </h5>
                <div class="last-message">
                  {{ $t('channels.sidebar.start-a-new-conversation') }}
                </div>
                <div class="floating-controlls">
                  <div class="join-meeting">
                    <button
                      v-tooltip="{
                        delay: 1000,
                        offset: -5,
                        content: $t(
                          'channels.sidebar.start-a-new-conversation-tooltip'
                        )
                      }"
                      @click="createOneToOne($event, suggestion.user.id)"
                      class="btn btn-icon btn-sm btn-primary"
                    >
                      <Icon family="fas" name="paper-plane" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="showGroups" class="vue-frag">
          <!-- groups -->
          <div v-if="!hasChannelsAfterFilter" class="empty-wrapper">
            <div class="empty-box">
              <Icon family="fal" name="filter" />
              <h4>{{ $t('channels.switcher-no-channels') }}</h4>
              <p>
                {{
                  $t(
                    `home.filter-not-found-${userPreferences.listing.filterBy}`
                  )
                }}
              </p>
              <button
                class="btn btn-primary mx-auto"
                @click="onShowAllChannels"
              >
                {{ $t('channels.show-all') }}
              </button>
            </div>
          </div>
          <Drop
            v-else
            @drop="(data, event) => handleDrop(data, event, group)"
            @dragleave="(data, event) => handleDropLeave(data, event, group)"
            @dragover="(data, event) => handleDropEnter(data, event, group)"
            class="channel-group"
            :class="{
              collapsed: !group.expanded,
              ['drop-active']: draggingToGroupId === group.id
            }"
            :ref="`channel-group-${group.id}`"
            v-for="(group, index) in groups"
            :key="group.id"
            :data-group_id="group.id"
            :data-unread_count="group.unread_count"
          >
            <div
              class="channel-group--name d-flex align-items-center"
              @click="toggleExpandedGroup(group)"
            >
              <Icon
                name="chevron-right"
                class="channel-name-direction"
                v-if="!group.fixed"
              />
              <span class="name">
                {{
                  group.virtual
                    ? $t(`channels.groups.virtual-${group.id}`)
                    : group.name
                }}
              </span>
              <UnreadBadge
                class="ml-3"
                v-if="!group.expanded"
                :unread_count="group.unread_count"
              />
              <div
                class="more-options ml-auto"
                v-if="!group.fixed"
                @click.prevent.stop
              >
                <Popover>
                  <button
                    v-tooltip="{
                      delay: 1000,
                      offset: 10,
                      content: $t('general.more-options')
                    }"
                    class="btn btn-icon btn-sm"
                  >
                    <Icon family="far" name="ellipsis-h" />
                  </button>
                  <template slot="popover">
                    <div class="dropdown-items">
                      <button
                        v-if="!group.virtual"
                        v-close-popover
                        class="dropdown-item"
                        type="button"
                        @click="showAddChannelsGroup(group)"
                      >
                        <Icon family="fal" name="plus-circle" />
                        {{ $t('channels.groups.add-or-remove-channels') }}
                      </button>
                      <button
                        v-if="!group.virtual"
                        v-close-popover
                        class="dropdown-item"
                        type="button"
                        @click="showRenameGroup(group)"
                      >
                        <Icon family="fal" name="money-check-edit" />
                        {{ $t('channels.groups.rename-group') }}
                      </button>

                      <button
                        v-if="index != 0"
                        v-close-popover
                        class="dropdown-item"
                        type="button"
                        @click="moveGroup(group, 'up')"
                      >
                        <Icon family="fal" name="chevron-up" />
                        {{ $t('channels.groups.move-up') }}
                      </button>

                      <button
                        v-if="index < groups.length - 1"
                        v-close-popover
                        class="dropdown-item"
                        type="button"
                        @click="moveGroup(group, 'down')"
                      >
                        <Icon family="fal" name="chevron-down" />
                        {{ $t('channels.groups.move-down') }}
                      </button>
                      <Popover v-if="!group.virtual">
                        <button class="dropdown-item" type="button">
                          <Icon family="fal" name="trash-alt" />
                          {{ $t('channels.groups.delete') }}
                        </button>
                        <template slot="popover">
                          <div class="dropdown-items">
                            <div class="dropdown-text">
                              {{ $t('general.are-you-sure') }}
                            </div>
                            <button
                              v-close-popover
                              class="dropdown-item btn btn-danger"
                              type="button"
                              @click.prevent.stop="onSubmitDelGroup(group)"
                            >
                              {{ $t('general.delete-now') }}
                            </button>
                          </div>
                        </template>
                      </Popover>
                    </div>
                  </template>
                </Popover>
              </div>
            </div>
            <transition name="fade" mode="out-in">
              <div
                class="group-channels-body"
                v-if="group.expanded || group.fixed"
              >
                <div
                  v-if="!group.channels || group.channels.length === 0"
                  class="group-channels-empty"
                >
                  <div v-if="group.id == 'dm'">
                    {{ $t('channels.groups.no-dms') }}
                  </div>
                  <div v-else-if="group.id == 'all'">
                    {{ $t('channels.groups.no-channels-all') }}
                  </div>
                  <div v-else @click="showAddChannelsGroup(group)">
                    {{ $t('channels.groups.no-channels-custom') }}
                  </div>
                </div>
                <div v-else>
                  <ChannelsList
                    :channels="group.channels"
                    :isCompactView="isCompactView"
                    :unreadChannelsList="group.unreadChannelsList"
                    :groupId="group.id"
                    :index="index"
                    :ref="`channel-list-${group.id}`"
                    @unblocked="$emit('unblocked', true)"
                    @moveToGroup="moveToGroup"
                    @unreadChannel="onUnreadChannel"
                    @unreadChannelRemoved="onUnreadChannelRemoved"
                    @elementMoved="onElementMoved"
                    @onDrag="onDrag"
                  />
                </div>
              </div>
            </transition>
          </Drop>
        </div>
        <div v-else>
          <!-- Hide -->
          <div v-if="!hasChannelsAfterFilter" class="empty-wrapper">
            <div class="empty-box">
              <Icon family="fal" name="filter" />
              <h4>{{ $t('channels.switcher-no-channels') }}</h4>
              <p>
                {{
                  $t(
                    `home.filter-not-found-${userPreferences.listing.filterBy}`
                  )
                }}
              </p>
              <button
                class="btn btn-primary mx-auto"
                @click="onShowAllChannels"
              >
                {{ $t('channels.show-all') }}
              </button>
            </div>
          </div>
          <ChannelsList
            v-else
            :channels="sortedChannels.channels"
            :isCompactView="isCompactView"
            :unreadChannelsList="sortedChannels.unreadChannelsList"
            :ref="`channel-list`"
            @unblocked="$emit('unblocked', true)"
            @moveToGroup="moveToGroup"
            @unreadChannel="onUnreadChannel"
            @unreadChannelRemoved="onUnreadChannelRemoved"
            @elementMoved="onElementMoved"
            @onDrag="onDrag"
          />
        </div>
      </perfect-scrollbar>
      <div class="unread-viewport" v-if="!query.trim()">
        <transition name="fade">
          <div
            class="unread-background"
            v-if="unreadMessagesBellowViewport > 0"
          ></div>
        </transition>
        <transition name="slide">
          <div class="unread-bubble" v-if="unreadMessagesBellowViewport > 0">
            <span @click="jumpToFirstUnreadChannel"
              ><AnimatedNumber
                :number="unreadMessagesBellowViewport"
                :i18n="'channels.sidebar.unread-messages-below'"
            /></span>
          </div>
        </transition>
      </div>
    </aside>

    <ChannelCreateModal />
    <AddChannelModal :group="currentGroup" :channels="channels" />
    <RenameGroupModal :group="currentGroup" @onSubmit="onSubmitRenameGroup" />
    <MoveToGroupModal :channel="selectedChannel" />
  </fragment>
</template>

<script>
import _ from 'lodash';
import store from 'store';
import Fuse from 'fuse.js';
import posed from 'vue-pose';

import Icon from 'airsend/components/Icon.vue';
import AnimatedNumber from 'airsend/components/AnimatedNumber.vue';
import UnreadBadge from 'airsend/components/UnreadBadge.vue';
import ToggleGroupCollapse from 'airsend/assets/close_groups.svg';
import ToggleGroupExpand from 'airsend/assets/open_groups.svg';
import DmIcon from 'airsend/assets/dm-icon.svg';
import ChannelsList from './ChannelsListSideBar.vue';
import Loader from 'airsend/components/Loader.vue';
import Avatar from 'airsend/components/Avatar.vue';
import Popover from 'airsend/components/Popover.vue';
import ChannelCreateModal from './Modals/ChannelCreateV2.vue';
import AddChannelModal from './Modals/AddChannels.vue';
import RenameGroupModal from './Modals/renameGroup.vue';
import MoveToGroupModal from './Modals/moveToGroup.vue';
import { Drag, Drop } from 'vue-drag-drop';

import { parseMessageContent } from 'airsend/utils';

export default {
  data: function() {
    const channels = this.$store.state.channels.all;
    const user = this.$store.state.core.user;

    // check if user is alone (one channel, and not the owner)
    let isAlone =
      channels &&
      user &&
      channels.length === 1 &&
      channels[0].created_by !== user.id;

    return {
      query: '',
      newGroupName: '',
      currentGroup: {},
      selectedChannel: null,
      dropActive: false,
      draggingToGroupId: -1,
      selectedTab: store.get('selectedTab') || 'channels',
      optionKeyStr: window.navigator.platform === 'MacIntel' ? 'opt' : 'alt',
      isMinified:
        store.get('isChannelSwitcherMinified') || isAlone ? true : false,
      isCompactView: store.get('isChannelSwitcherCompact') ? true : false,
      observer: null,
      scrollingToChannel: null,
      showChannelsFromAllTeams: false
    };
  },
  beforeMount() {
    this.localStore = store;
  },
  computed: {
    userPreferences() {
      return this.$store.getters['core/getUserPreferences'];
    },
    teamFilters() {
      return this.userPreferences.listing.teams;
    },
    showGroups() {
      return this.userPreferences.listing.showGroups;
    },
    sortingByRecent() {
      return this.userPreferences.listing.sortBy === 'last_active_on_ts-desc';
    },
    sortingByUnread() {
      return this.userPreferences.listing.sortBy === 'unread_count-desc';
    },
    sortingByCreation() {
      return this.userPreferences.listing.sortBy === 'created_on_ts-desc';
    },
    filteringByAll() {
      return this.userPreferences.listing.filterBy === 'all';
    },
    filteringByActive() {
      return this.userPreferences.listing.filterBy === 'active';
    },
    filteringByClosed() {
      return this.userPreferences.listing.filterBy === 'closed';
    },
    sortedChannels() {
      return this.$store.getters['channels/getSortedChannels']('switcher');
    },
    teams() {
      return this.$store.state.teams.all || [];
    },
    useTeams() {
      return this.$store.state.core.useTeams;
    },
    hasChannelsAfterFilter() {
      if (this.userPreferences.listing.showGroups) {
        return this.groups.some(
          group => group.channels && group.channels.length > 0
        );
      } else {
        return (
          this.sortedChannels &&
          this.sortedChannels.channels &&
          this.sortedChannels.channels.length > 0
        );
      }
    },
    keymap() {
      return {
        'alt+shift+c': this.onToggleGroupCollapse
      };
    },
    hasExpandedGroups() {
      return this.groups.some(group => group.expanded);
    },
    toggleCollapseTooltip() {
      let key = 'c';
      return `${this.$t('channels.switcher-group-collapse')} (${
        this.optionKeyStr
      } + shift + ${key})`;
    },
    loading() {
      return this.$store.state.loading['channel.one-on-one'];
    },
    siblingMembers() {
      return this.$store.getters['channels/getSiblingMembers'];
    },
    channels() {
      // fuzzy search
      if (this.query) {
        const fuse = new Fuse(this.sortedChannels.channels, {
          threshold: 0.2,
          keys: ['channel_name', 'counterpart.display_name']
        });

        return fuse.search(this.query);
      }

      return this.sortedChannels.channels;
    },
    suggestedChannels() {
      if (this.query) {
        const fuse = new Fuse(this.siblingMembers, {
          threshold: 0.2,
          keys: ['user.display_name']
        });

        // get users ids for who user already has a one_one channel
        let directMessageUsers = _.filter(this.channels, { one_one: true }).map(
          channel => {
            return this.getCounterpart(channel).id;
          }
        );

        // filter only not repeated entries
        return _.filter(fuse.search(this.query), item => {
          return directMessageUsers.indexOf(item.value) === -1;
        });
      }

      return [];
    },

    user() {
      return this.$store.state.core.user;
    },

    groups() {
      return this.$store.getters['channels/getGroupedChannels'];
    },
    unreadMessagesBellowViewport() {
      return this.$store.getters['channels/getUnreadMessagesBellowViewport'];
    },
    channelsBellowViewport() {
      return this.$store.getters['channels/getChannelsBellowViewport'];
    },
    collapsedGroupsBellowViewport() {
      return this.$store.getters['channels/getCollapsedGroupsBellowViewport'];
    }
  },
  methods: {
    onChangeFilter(type, value) {
      this.$store.dispatch('core/setUserPreference', {
        [`listing.${type}`]: value
      });
    },
    onToggleTeamFilter(team) {
      const teamFilters = this.teamFilters;

      if (teamFilters.indexOf(team.id) > -1) {
        this.onChangeFilter(
          'teams',
          teamFilters.filter(item => item != team.id)
        );
      } else {
        this.onChangeFilter('teams', [team.id, ...teamFilters]);
      }
    },
    getTeamColor(team_id) {
      return this.$store.getters['teams/getTeamColor'](team_id);
    },
    onShowAllChannels() {
      this.query = '';
      this.$store.dispatch('channels/setUserPreferences', {
        userPreferences: {
          ...this.userPreferences,
          filterBy: 'all'
        },
        id: 'switcher'
      });
    },
    handleDrop(channel, e, group) {
      this.draggingToGroupId = -1; //remove drag effect

      let fromGroupId =
        channel.channel_group_id != -1
          ? channel.channel_group_id
          : channel.one_one
          ? 'dm'
          : 'all';

      if (fromGroupId === group.id) {
        //prevent from moving to the same channel
        return;
      } else if (channel.one_one && group.id === 'dm') {
        //Moving a DM channel from custom group to DM group. Remove from group
        this.toggleExpandedGroup(group, true);
        this.$store.dispatch('channels/removeFromGroup', {
          channel_group_id: fromGroupId,
          channel_id: channel.id
        });
      } else if (!channel.one_one && group.id === 'all') {
        //Moving a channel from custom group to ALL group. Remove from group
        this.toggleExpandedGroup(group, true);
        this.$store.dispatch('channels/removeFromGroup', {
          channel_group_id: fromGroupId,
          channel_id: channel.id
        });
      } else if (group.id == 'favs') {
        //adding group to favs
        this.addToFavorite({
          id: channel.id
        });
      } else if (
        (channel.one_one && group.id === 'all') ||
        (!channel.one_one && group.id === 'dm')
      ) {
        //prevent moving a DM to ALL or Group to DM
        this.$store.dispatch('channels/cannotAddtoGroup');
        return;
      } else {
        //adding group to a custom group
        this.toggleExpandedGroup(group, true);
        this.$store.dispatch('channels/addToGroup', {
          channel_group_id: group.id,
          old_channel_group_id: channel.channel_group_id,
          channel_id: channel.id
        });
      }
    },
    handleDropEnter(channel, e, group) {
      if (
        (channel.one_one && group.id === 'all') ||
        (!channel.one_one && group.id === 'dm')
      ) {
        //prevent moving a DM to ALL or Group to DM
        return;
      }

      this.draggingToGroupId = group.id;
    },
    handleDropLeave(channel, e, group) {
      this.draggingToGroupId = -1;
    },
    onSearch(e) {
      if (e.key === 'Escape') this.onCancelSearch();
    },
    onCancelSearch() {
      this.query = '';
    },

    onToggleTab() {
      this.selectedTab =
        this.selectedTab === 'channels' ? 'directMessages' : 'channels';
      store.set('selectedTab', this.selectedTab);
    },
    onToggleView() {
      store.set('isChannelSwitcherCompact', !this.isCompactView);
      this.isCompactView = !this.isCompactView;
    },

    onToggleGroupCollapse() {
      let hasExpandedGroups = this.groups.some(group => group.expanded);
      this.$store.dispatch('channels/toggleGroupExpanded', {
        status: !hasExpandedGroups
      });

      this.$refs['viewport'].$el.scrollTop = 0;
    },

    toggleExpandedGroup(group, forceState = null) {
      let _state = forceState === null ? !group.expanded : forceState;
      this.$store.dispatch('channels/toggleGroupExpanded', {
        group_id: group.id,
        status: _state
      });

      this.$nextTick(() => {
        let groupEl = this.$refs[`channel-group-${group.id}`][0].$el;
        this.handleIntersection(groupEl);
      });
    },

    toggleMinification() {
      store.set('isChannelSwitcherMinified', !this.isMinified);
      this.isMinified = !this.isMinified;
    },

    async createOneToOne(e, id) {
      e.stopPropagation();
      await this.$store.dispatch('channels/createOneOnOne', id);
    },

    getCounterpart(channel) {
      return _.find(channel.members, member => {
        return member.id !== this.user.id;
      });
    },

    customChannels(id, returnAll = true) {
      let channels = this.sortedChannels;
      if (returnAll) {
        return channels.filter(channel => channel.channel_group_id == id);
      }
      return channels.filter(channel => {
        // return true if channel has group id
        // and if channel is dm and selected tab is not channels (not dm and selected tab is channels)
        return (
          channel.channel_group_id == id &&
          channel.one_one != (this.selectedTab == 'channels')
        );
      });
    },

    addToFavorite({ id }) {
      this.$store.dispatch('channels/addToFav', { id });
    },

    async onSubmitLeaveChannel({ id, channel_name }) {
      await this.$store.dispatch('channels/leave', {
        ...this.form,
        channel_id: id,
        channel_name
      });
    },

    // Group operations

    createGroupOpened() {
      setTimeout(() => {
        if (this.$refs.inputCreateGroup) this.$refs.inputCreateGroup.focus();
      }, 200);
    },

    cancelGroupCreation(e) {
      this.$refs.createGroupPop.hide();
      e.preventDefault();
    },

    showAddChannelsGroup(group) {
      this.currentGroup = group;
      this.$modal.show('add-channels');
    },

    showRenameGroup(group) {
      this.currentGroup = group;
      this.$modal.show('rename-group');
    },

    moveGroup(selectedGroup, direction) {
      let groups = this.groups;
      let index = groups.findIndex(group => group.id == selectedGroup.id);
      let nextGroupID = direction === 'up' ? index - 1 : index + 1;

      let afterGroupId =
        direction === 'up'
          ? index == 1
            ? 0
            : groups[index - 2].id
          : groups[nextGroupID].id;

      // Swap group
      let toSwap = { index, nextGroupID };

      this.$store.dispatch('channels/reorderGroups', {
        group_id: selectedGroup.id,
        after: afterGroupId,
        toSwap
      });
    },

    moveToGroup(channel) {
      this.selectedChannel = channel;
      this.$modal.show('move-to-group');
    },

    async onSubmitCreateGroup(e) {
      e.preventDefault();

      this.$store.dispatch('channels/setUserPreferences', {
        userPreferences: {
          ...this.userPreferences,
          showGroups: true
        },
        id: 'switcher'
      });

      const response = await this.$store.dispatch(
        'channels/createChannelGroup',
        {
          name: this.newGroupName
        }
      );
      if (response.ok) {
        this.newGroupName = '';
        this.$refs.createGroupPop.hide();
      }
    },

    async onSubmitDelGroup(group) {
      const response = await this.$store.dispatch(
        'channels/deleteChannelGroup',
        group
      );
    },

    async onSubmitRenameGroup({ name, channel_group_id }) {
      const response = await this.$store.dispatch(
        'channels/renameChannelGroup',
        {
          channel_group_id,
          name
        }
      );
      if (response.ok) {
        this.$modal.hide('rename-group');
      }
    },

    isdefaultGroup(id) {
      return ['all', 'dm', 'favs'].includes(id);
    },
    onIntersectViewport(e) {
      e.forEach(intersection => {
        this.handleIntersection(intersection.target);
      });
    },
    handleIntersection(target) {
      let viewport = this.$refs['viewport'].$el;
      if (target.classList.contains('channel-group')) {
        //Group intersection
        let isGroupExpanded = !target.classList.contains('collapsed');

        let isBellowViewport = this.isBellowViewport(target, viewport);

        if (!isGroupExpanded && isBellowViewport) {
          this.$store.dispatch('channels/setCollapsedGroupsBellowViewport', {
            group_id: target.dataset.group_id,
            isBellowViewport: true,
            unreadCount: parseInt(target.dataset.unread_count)
          });
        } else {
          this.$store.dispatch('channels/setCollapsedGroupsBellowViewport', {
            group_id: target.dataset.group_id,
            isBellowViewport: false,
            unreadCount: parseInt(target.dataset.unread_count)
          });
        }
      } else {
        //Channel intersection
        let isBellowViewport = this.isBellowViewport(target, viewport);

        if (isBellowViewport) {
          this.$store.dispatch('channels/setChannelsBellowViewport', {
            channel_id: target.dataset.channel_id,
            isBellowViewport: true,
            unreadCount: parseInt(target.dataset.unread_count)
          });
        } else {
          if (this.scrollingToChannel == target.dataset.channel_id)
            this.scrollingToChannel = null;
          this.$store.dispatch('channels/setChannelsBellowViewport', {
            channel_id: target.dataset.channel_id,
            isBellowViewport: false,
            unreadCount: parseInt(target.dataset.unread_count)
          });
        }
      }
    },
    getFirstUnreadChannel() {
      //loop throught loops in order that they are showing
      if (this.userPreferences.listing.showGroups) {
        for (let group of this.groups) {
          if (this.collapsedGroupsBellowViewport[group.id] !== undefined) {
            // group collapsed
            return {
              group,
              channel: Object.values(group.unreadChannelsList)[0]
            };
          }

          if (
            group.expanded &&
            Object.keys(group.unreadChannelsList).length > 0
          ) {
            // group expanded and has unread channels
            let unreadChannelsList = Object.values(group.unreadChannelsList);

            for (let channel of unreadChannelsList) {
              if (this.channelsBellowViewport[channel.id] !== undefined) {
                //channel is bellow viewport
                return { group, channel };
              }
            }
          }
        }
      } else {
        for (let channel of Object.values(
          this.sortedChannels.unreadChannelsList
        )) {
          if (this.channelsBellowViewport[channel.id] !== undefined) {
            //channel is bellow viewport
            return { group: null, channel };
          }
        }
      }

      return { group: null, channel: null };
    },
    jumpToFirstUnreadChannel() {
      if (this.scrollingToChannel !== null) return; //already scrolling
      let { group, channel } = this.getFirstUnreadChannel();
      if (!channel) {
        console.log('UNHANDLED JUMP TO CHANNEL');
        return;
      }
      this.scrollingToChannel = channel.id;

      if (this.userPreferences.listing.showGroups) {
        this.toggleExpandedGroup(group, true);
        this.$nextTick(() => {
          //group has to expand
          let viewportEl = this.$refs['viewport'].$el;
          let channelEl = this.$refs[`channel-list-${group.id}`][0].$refs[
            `${channel.id}-channel-item`
          ][0];
          if (channelEl) {
            viewportEl.scrollTo({
              top: channelEl.offsetTop,
              behavior: 'smooth'
            });
          } else {
            // jump to group
            let groupEl = this.$refs[`channel-group-${group.id}`][0].$el;
            viewportEl.scrollTo({ top: groupEl.offsetTop, behavior: 'smooth' });
          }
        });
      } else {
        let viewportEl = this.$refs['viewport'].$el;
        let channelEl = this.$refs['channel-list'].$refs[
          `${channel.id}-channel-item`
        ][0];
        viewportEl.scrollTo({ top: channelEl.offsetTop, behavior: 'smooth' });
      }
    },
    onUnreadChannel(event) {
      let { group_id, element } = event;
      if (this.observer) {
        this.observer.observe(element);
      }
    },
    onElementMoved(event) {
      this.handleIntersection(event.element);
    },
    onUnreadChannelRemoved(event) {
      let { group_id, channel_id, unreadChannel } = event;
      if (unreadChannel) {
        this.observer.unobserve(unreadChannel);
      }
      this.$store.dispatch('channels/setChannelsBellowViewport', {
        channel_id,
        isBellowViewport: false
      });
    },
    isBellowViewport(element, viewport) {
      let groupOffsetTop = element.offsetTop;
      let scrollTop = viewport.scrollTop;
      let viewportHeight = viewport.clientHeight;

      if (scrollTop + viewportHeight < groupOffsetTop) {
        //add a margin
        return true;
      }
      return false;
    },
    onDrag(e) {
      let scrollElem = this.$refs['viewport'].$el;
      if (e.clientY < 200 && scrollElem.scrollTop !== 0) {
        // Dragged item is at the top, and pscroller is not scrolled all the way to top
        scrollElem.scrollTop -= 10;
      } else if (e.clientY > window.innerHeight - 50) {
        // dragged item is at bottom, but pscroller is not scrolled all the way to bottom
        if (
          scrollElem.scrollTop + scrollElem.offsetHeight <
          scrollElem.scrollHeight
        ) {
          scrollElem.scrollTop += 10;
        }
      }
    },
    // this will update the worker observer to remount the listing
    updateObserver(newPreferences = null) {
      const preferences = newPreferences
        ? newPreferences
        : this.userPreferences;

      this.$store.dispatch('channels/setObservable', {
        id: 'switcher',
        params: {
          filterBy: preferences.listing.filterBy,
          sortBy: preferences.listing.sortBy,
          teams: this.teamFilters.length > 0 ? this.teamFilters : []
        }
      });
    },
    parseMessageContent: parseMessageContent
  },
  mounted() {
    // listing
    this.updateObserver();

    let rootElement = this.$refs['viewport'].$el;
    let options = {
      root: rootElement,
      rootMargin: '0px',
      threshold: 0
    };
    this.observer = new IntersectionObserver(this.onIntersectViewport, options);

    this.$nextTick(() => {
      for (let group of this.groups) {
        let el =
          this.$refs[`channel-group-${group.id}`] &&
          this.$refs[`channel-group-${group.id}`][0].$el;
        if (el) this.observer.observe(el);
      }
    });
  },
  beforeDestroy() {
    this.observer.disconnect();
  },
  watch: {
    groups() {
      if (!this.userPreferences.listing.showGroups) return;
      this.$nextTick(() => {
        for (let group of this.groups) {
          let el =
            this.$refs[`channel-group-${group.id}`] &&
            this.$refs[`channel-group-${group.id}`][0] &&
            this.$refs[`channel-group-${group.id}`][0].$el;
          if (el) this.observer.observe(el);
        }
      });
    },
    userPreferences: {
      immediate: true,
      deep: true,
      handler(preferences) {
        this.updateObserver(preferences);
      }
    },
    'userPreferences.showGroups'() {
      this.$refs['viewport'].$el.scrollTop = 0;
      this.observer.disconnect();
      this.$store.dispatch('channels/resetUnreadCountBellow');
    },
    'userPreferences.listing.teams': {
      immediate: true,
      deep: true,
      handler(teamFilters) {
        this.showChannelsFromAllTeams = teamFilters.length === 0;
      }
    }
  },
  components: {
    Icon,
    Loader,
    AnimatedNumber,
    Avatar,
    Popover,
    ChannelCreateModal,
    AddChannelModal,
    RenameGroupModal,
    MoveToGroupModal,
    Drag,
    Drop,
    ChannelsList,
    ToggleGroupCollapse,
    ToggleGroupExpand,
    DmIcon,
    UnreadBadge,
    Toggle: posed.div({
      visible: { x: '0%' },
      hidden: { x: '-100%' }
    })
  }
};
</script>

<style scoped>
.fade-enter-active {
  transition: opacity 0.2s;
}
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active {
  transition: all 0.3s;
}
.slide-leave-active {
  transition: all 0.3s;
}
.slide-enter {
  transform: translateY(25px);
  opacity: 1;
}
.slide-leave-to {
  transform: translateY(25px);
  opacity: 0;
}
</style>
