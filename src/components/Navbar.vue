<template>
  <div>
    <nav
      class="navbar navbar-expand-lg main-navbar"
      v-bind:class="{
        [`navbar--guest`]:
          !user ||
          (!user.display_name &&
            !$route.query.hash &&
            $route.name !== 'meeting') ||
          (['oauth'].indexOf(this.$router.history.current.name) > -1 &&
            !isChannel),
        [`navbar--searching`]: this.isSearching,
        [`navbar--channel`]: channel,
        ['no-use-teams']: !useTeams
      }"
    >
      <div class="navbar-wrapper">
        <div class="navbar-main-content">
          <a
            class="navbar-toggle"
            v-if="!isChannel && !IS_READONLY && currentRoute !== 'meeting'"
            @click="toggleAside"
            v-tooltip="{
              delay: 1000,
              offset: -5,
              content: $t('navbar.toggle-sidebar-hint')
            }"
          >
            <Icon family="far" name="bars" />
          </a>
          <router-link
            :to="
              userPreferences.listing && userPreferences.listing.lastTeam
                ? `/team/${userPreferences.listing.lastTeam}`
                : '/'
            "
            class="navbar-toggle"
            v-else-if="!IS_READONLY"
          >
            <Icon family="far" name="arrow-left" />
          </router-link>

          <a
            class="navbar-brand"
            v-bind:class="{ [`navbar-brand--in-channel`]: channel }"
            :set="
              (counterpart =
                channel && channel.one_one ? getCounterpart(channel) : null)
            "
          >
            <div class="navbar-brand-logo">
              <Avatar
                :name="channel.channel_name"
                :type="'logo'"
                :channel-id="channel.id"
                :has-avatar="channel.has_logo"
                :cache="channel.updated_on_ts"
                size="small"
                v-if="channel && channel.has_logo"
              />
              <Avatar
                :name="counterpart.display_name"
                :active="counterpart.online_status"
                :user-id="counterpart.id"
                :has-avatar="counterpart.has_avatar"
                :cache="counterpart.updated_on_ts"
                size="small"
                v-else-if="channel && channel.one_one && counterpart"
              />
              <Logo class="brand-icon" @click="navtoDashboard" v-else />
              <LogoText class="brand-text" @click="navtoDashboard" />
            </div>
            <div class="navbar-brand-channel">
              <div class="avatar"></div>
              <span v-if="channel"
                ><span
                  >{{
                    !channel.one_one
                      ? channel.channel_name
                      : counterpart
                      ? counterpart.display_name
                      : $t('channels.direct-conversation')
                  }}
                  <small>{{ channel.blurb }}</small></span
                ></span
              >
            </div>
          </a>

          <div
            class="collapse navbar-collapse"
            v-if="!IS_READONLY || meeting.guest"
            v-bind:class="{ [`collapse--in-channel`]: channel }"
          >
            <ul class="navbar-nav mr-2 channel-nav">
              <li
                class="nav-item nav-item--meeting"
                v-if="
                  user &&
                    user.id &&
                    (!meeting.roomId || meeting.roomState === 'closed')
                "
              >
                <Popover>
                  <a
                    class="nav-link nav-link--icon"
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('meeting.title')
                    }"
                  >
                    <Icon
                      family="fas"
                      :name="
                        channel && channel.meeting ? 'phone' : 'phone-plus'
                      "
                    />
                  </a>
                  <template slot="popover">
                    <div class="dropdown-items">
                      <a
                        class="dropdown-item"
                        v-close-popover
                        @click="
                          $store.dispatch('meeting/createOrJoin', {
                            channel_id: channel.id
                          })
                        "
                        v-if="
                          channel &&
                            !channel.public_url &&
                            user &&
                            user.role &&
                            user.role.level >= 30 &&
                            channel.meeting
                        "
                        ><Icon family="far" name="phone" />
                        {{ $t('meeting.join-meeting') }}</a
                      >
                      <a
                        class="dropdown-item"
                        v-close-popover
                        @click="
                          $store.dispatch('meeting/createOrJoin', {
                            channel_id: channel.id
                          })
                        "
                        v-else-if="
                          channel &&
                            !channel.public_url &&
                            user &&
                            user.role &&
                            user.role.level >= 30
                        "
                        ><Icon family="far" name="phone-plus" />
                        {{ $t('meeting.start-meeting') }}</a
                      >
                      <a
                        class="dropdown-item disabled"
                        v-else-if="
                          channel &&
                            channel.public_url &&
                            user &&
                            user.role &&
                            user.role.level >= 30
                        "
                        v-tooltip="{
                          content: $t(
                            'meeting.start-meeting-public-channel-tooltip'
                          ),
                          delay: 500
                        }"
                        ><Icon family="far" name="phone-plus" />
                        {{ $t('meeting.start-meeting') }}</a
                      >
                      <a
                        class="dropdown-item"
                        v-close-popover
                        @click="
                          $store.dispatch('meeting/create', { is_public: 1 })
                        "
                        ><Icon family="far" name="globe" />
                        {{ $t('meeting.start-public-meeting') }}</a
                      >
                    </div>
                  </template>
                </Popover>
              </li>
              <li class="nav-item" v-if="channel">
                <a
                  class="nav-link nav-link--icon nav-link--alert"
                  @click="openModal('channel-members')"
                  v-tooltip="{
                    delay: 1000,
                    offset: -5,
                    content: $t('navbar.manage-members')
                  }"
                >
                  <Icon family="fas" name="users" />
                  <small>{{ channel.members.length }}</small>
                  <span
                    v-if="
                      channel.pending_members &&
                        channel.pending_members.length > 0
                    "
                    class="notification-count"
                    >{{ channel.pending_members.length }}</span
                  >
                </a>
              </li>
              <li
                class="nav-item"
                v-else-if="currentRoute == 'meeting' && meeting.peers"
              >
                <a
                  class="nav-link nav-link--icon nav-link--alert"
                  @click="openModal('channel-members')"
                  v-tooltip="{
                    delay: 1000,
                    offset: -5,
                    content: $t('navbar.manage-members')
                  }"
                >
                  <Icon family="fas" name="users" />
                  <small>{{ meeting.peers.length + 1 }}</small>
                  <span
                    v-if="
                      false &&
                        channel.pending_members &&
                        channel.pending_members.length > 0
                    "
                    class="notification-count"
                    >{{ channel.pending_members.length }}</span
                  >
                </a>
              </li>
              <li class="nav-item" v-if="channel || currentRoute == 'meeting'">
                <a
                  class="nav-link nav-link--icon"
                  @click="
                    openModal(
                      currentRoute == 'meeting'
                        ? 'meeting-settings'
                        : 'channel-settings'
                    )
                  "
                  v-tooltip="{
                    delay: 1000,
                    offset: -5,
                    content: $t('channels.channel-settings')
                  }"
                >
                  <Icon family="fas" name="cogs" />
                </a>
              </li>
            </ul>

            <ul class="navbar-nav mobile-nav" v-if="isMobile">
              <li class="nav-item" v-if="transactions.length > 0">
                <Popover popoverClass="popover-big" :autoHide="true">
                  <a
                    class="nav-link nav-link--icon"
                    v-bind:class="{
                      ['nav-link--alert']:
                        runningTransactions.length > 0 ||
                        failedTransactions.length > 0,
                      ['primary']:
                        runningTransactions.length > 0
                          ? true
                          : failedTransactions.length === 0
                    }"
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('files.transactions-title')
                    }"
                  >
                    <TransactionsIcon
                      v-tooltip="{
                        content:
                          runningTransactions.length === 0 &&
                          failedTransactions.length > 0
                            ? $tc(
                                'files.tooltips.transactions-navbar-operations-failed',
                                failedTransactions.length
                              )
                            : $tc(
                                'files.tooltips.transactions-navbar-operations-processing',
                                runningTransactions.length
                              ),
                        show: showTransactionsTooltip,
                        trigger: 'manual',
                        classes: 'vue-tooltip-theme under-preview'
                      }"
                    />
                    <span
                      v-if="runningTransactions.length > 0"
                      class="notification-count"
                      >{{ runningTransactions.length }}</span
                    >
                    <span
                      v-else-if="failedTransactions.length > 0"
                      class="notification-count"
                      >{{ failedTransactions.length }}</span
                    >
                  </a>
                  <template slot="popover">
                    <TransactionManager />
                  </template>
                </Popover>
              </li>

              <li class="nav-item">
                <Popover popoverClass="popover-big">
                  <a
                    class="nav-link nav-link--icon"
                    v-bind:class="{ ['nav-link--alert']: alertCount > 0 }"
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('navbar.alerts')
                    }"
                  >
                    <Icon family="fas" name="bell" />
                    <span v-if="alertCount > 0" class="notification-count">{{
                      alertCount
                    }}</span>
                  </a>
                  <template slot="popover">
                    <perfect-scrollbar class="list-group popover-list">
                      <div
                        class="empty-wrapper"
                        v-if="alerts && alerts.length === 0"
                      >
                        <div class="empty-box">
                          <Icon family="fal" name="bell" />
                          <h4>{{ $t('navbar.no-alerts') }}</h4>
                          <p>{{ $t('navbar.no-alerts-hint') }}</p>
                        </div>
                      </div>

                      <router-link
                        v-close-popover
                        v-on:click.native="onClickAlert(alert)"
                        :to="getAlertRoute(alert)"
                        class="list-group-item list-group-item-action d-flex align-items-center"
                        v-bind:class="{
                          ['list-group-item--unread']: !alert.is_read
                        }"
                        v-for="alert in alerts"
                        v-bind:key="alert.alert_id"
                        :set="(author = alert.from ? alert.from[0] : {})"
                        v-observe-visibility="{
                          callback: (isVisible, entry) =>
                            visibilityChanged(isVisible, entry, alert),
                          throttle: 0,
                          once: true
                        }"
                      >
                        <Avatar
                          class="avatar-sm"
                          :name="author.display_name"
                          :active="author.online_status"
                          :user-id="author.id"
                          :has-avatar="author.has_avatar"
                          :cache="author.updated_on_ts"
                          size="small"
                          private-only
                        />
                        <div class="w-100 ml-3 text-break">
                          <p
                            class="mb-0"
                            v-html="
                              parseMessageContent(
                                alert.alert_text,
                                getChannel(alert.channel_id)
                              )
                            "
                          ></p>
                          <small class="text-muted">{{
                            parseTime(alert.created_on).fromNow()
                          }}</small>
                        </div>
                      </router-link>
                    </perfect-scrollbar>
                  </template>
                </Popover>
              </li>

              <li class="nav-item">
                <a class="nav-link nav-link--icon" @click="toggleSearch">
                  <Icon family="far" name="search" />
                </a>
              </li>
              <li class="nav-item" v-if="channel">
                <Popover>
                  <a class="nav-link nav-link--icon">
                    <Icon family="far" name="ellipsis-h" />
                  </a>
                  <template slot="popover">
                    <div class="dropdown-items">
                      <button
                        v-close-popover
                        class="dropdown-item"
                        type="button"
                        @click="openModal('channel-settings')"
                      >
                        <Icon family="fas" name="cogs" />
                        {{ $t('channels.channel-settings') }}
                      </button>
                      <button
                        v-close-popover
                        class="dropdown-item"
                        type="button"
                        @click="openModal('channel-members')"
                      >
                        <Icon family="fas" name="users" />
                        {{ $t('channels.members') }} ({{
                          channel.members.length
                        }})
                      </button>
                    </div>
                  </template>
                </Popover>
              </li>
            </ul>

            <SearchBar @cancel="onCancelSearch" ref="search" v-if="user.id" />

            <ul class="navbar-nav user-nav" v-if="user && user.id && !isMobile">
              <li class="nav-item">
                <Popover popoverClass="popover-large" :autoHide="true">
                  <a
                    class="nav-link nav-link--icon"
                    v-bind:class="{
                      ['nav-link--alert']:
                        runningTransactions.length > 0 ||
                        failedTransactions.length > 0,
                      ['primary']:
                        runningTransactions.length > 0
                          ? true
                          : failedTransactions.length === 0
                    }"
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('files.transactions-title')
                    }"
                  >
                    <TransactionsIcon
                      v-tooltip="{
                        content:
                          runningTransactions.length === 0 &&
                          failedTransactions.length > 0
                            ? $tc(
                                'files.tooltips.transactions-navbar-operations-failed',
                                failedTransactions.length
                              )
                            : $tc(
                                'files.tooltips.transactions-navbar-operations-processing',
                                runningTransactions.length
                              ),
                        show: showTransactionsTooltip,
                        trigger: 'manual',
                        classes: 'vue-tooltip-theme under-preview'
                      }"
                    />
                    <span
                      v-if="runningTransactions.length > 0"
                      class="notification-count"
                      >{{ runningTransactions.length }}</span
                    >
                    <span
                      v-else-if="failedTransactions.length > 0"
                      class="notification-count"
                      >{{ failedTransactions.length }}</span
                    >
                  </a>
                  <template slot="popover">
                    <TransactionManager />
                  </template>
                </Popover>
              </li>

              <li class="nav-item">
                <Popover popoverClass="popover-big">
                  <a
                    class="nav-link nav-link--icon"
                    v-bind:class="{ ['nav-link--alert']: alertCount > 0 }"
                    v-tooltip="{
                      delay: 1000,
                      offset: -5,
                      content: $t('navbar.alerts')
                    }"
                  >
                    <Icon family="fas" name="bell" />
                    <span v-if="alertCount > 0" class="notification-count">{{
                      alertCount
                    }}</span>
                  </a>
                  <template slot="popover">
                    <perfect-scrollbar class="list-group popover-list">
                      <div
                        class="empty-wrapper"
                        v-if="alerts && alerts.length === 0"
                      >
                        <div class="empty-box">
                          <Icon family="fal" name="bell" />
                          <h4>{{ $t('navbar.no-alerts') }}</h4>
                          <p>{{ $t('navbar.no-alerts-hint') }}</p>
                        </div>
                      </div>

                      <router-link
                        v-close-popover
                        v-on:click.native="onClickAlert(alert)"
                        :to="getAlertRoute(alert)"
                        class="list-group-item list-group-item-action d-flex align-items-center"
                        v-bind:class="{
                          ['list-group-item--unread']: !alert.is_read
                        }"
                        v-for="alert in alerts"
                        v-bind:key="alert.alert_id"
                        :set="(author = alert.from ? alert.from[0] : {})"
                        v-observe-visibility="{
                          callback: (isVisible, entry) =>
                            visibilityChanged(isVisible, entry, alert),
                          throttle: 0,
                          once: true
                        }"
                      >
                        <Avatar
                          class="avatar-sm"
                          :name="author.display_name"
                          :active="author.online_status"
                          :user-id="author.id"
                          :has-avatar="author.has_avatar"
                          :cache="author.updated_on_ts"
                          size="small"
                          private-only
                        />
                        <div class="w-100 ml-3 text-break">
                          <p
                            class="mb-0"
                            v-html="
                              parseMessageContent(
                                alert.alert_text,
                                getChannel(alert.channel_id)
                              )
                            "
                          ></p>
                          <small class="text-muted">{{
                            parseTime(alert.created_on).fromNow()
                          }}</small>
                        </div>
                      </router-link>
                    </perfect-scrollbar>
                  </template>
                </Popover>
              </li>

              <li class="nav-item" v-if="user && user.id">
                <Popover>
                  <a
                    class="nav-link dropdown-toggle"
                    role="button"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <Avatar
                      :name="user.display_name"
                      :user-id="user.id"
                      :has-avatar="user.has_avatar"
                      :cache="user.updated_on_ts"
                      size="medium"
                      private-only
                    />
                    {{ user.display_name }}
                  </a>
                  <template slot="popover">
                    <div class="dropdown-items">
                      <a
                        class="dropdown-item"
                        v-if="!preferredColorSchema"
                        @click="$store.dispatch('core/changeColorSchema')"
                        ><Icon family="far" name="circle" />
                        {{ $t('navbar.theme-auto') }}</a
                      >
                      <a
                        class="dropdown-item"
                        v-else-if="preferredColorSchema === 'dark'"
                        @click="$store.dispatch('core/changeColorSchema')"
                        ><Icon family="fas" name="moon" />
                        {{ $t('navbar.theme-dark') }}</a
                      >
                      <a
                        class="dropdown-item"
                        v-else
                        @click="$store.dispatch('core/changeColorSchema')"
                        ><Icon family="far" name="sun" />
                        {{ $t('navbar.theme-light') }}</a
                      >

                      <a
                        class="dropdown-item"
                        v-close-popover
                        @click="openModal('profile-settings')"
                        ><Icon family="far" name="user" />
                        {{ $t('navbar.user-settings') }}</a
                      >
                      <a
                        class="dropdown-item"
                        v-close-popover
                        @click="openModal('about-modal')"
                        href="#"
                        ><Icon family="far" name="info-circle" />
                        {{ $t('navbar.about') }}</a
                      >
                      <a
                        class="dropdown-item"
                        v-close-popover
                        @click="openModal('shortcuts')"
                        href="#"
                        ><Icon family="far" name="keyboard" />
                        {{ $t('navbar.shortcuts') }}</a
                      >
                      <a
                        class="dropdown-item"
                        v-close-popover
                        @click="openModal('language')"
                        href="#"
                        ><Icon family="far" name="language" />
                        {{ $t('title') }}</a
                      >
                      <div class="dropdown-divider"></div>
                      <a
                        class="dropdown-item"
                        v-close-popover
                        @click="onSignout"
                        ><Icon family="far" name="sign-out" />
                        {{ $t('navbar.signout') }}</a
                      >
                    </div>
                  </template>
                </Popover>
              </li>
            </ul>
          </div>
          <div class="collapse navbar-collapse" v-else>
            <ul class="navbar-nav user-nav">
              <li class="nav-item" v-if="user.display_name">
                <a
                  class="nav-link dropdown-toggle"
                  @click="
                    () =>
                      this.$modal.show(
                        user.account_status === 50 ? 'finalize' : 'auth'
                      )
                  "
                  role="button"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <Avatar
                    :name="user.display_name"
                    :user-id="user.id"
                    :has-avatar="user.has_avatar"
                    :cache="user.updated_on_ts"
                    size="medium"
                  />
                  {{ user.display_name }}
                </a>
              </li>
              <li class="nav-item" v-else>
                <a
                  class="btn btn-primary"
                  @click="() => this.$modal.show('auth')"
                  >{{ $t('navbar.login-to-join') }}</a
                >
              </li>
            </ul>
          </div>
        </div>

        <div v-if="useTeams" class="navbar-team-tabs">
          <TeamTabs />
        </div>
      </div>
    </nav>

    <aside
      class="sidebar-nav"
      v-bind:class="{ [`show`]: isAsideOpen }"
      v-if="!IS_READONLY"
    >
      <div class="sidebar-nav-overlay" @click="toggleAside"></div>
      <div class="sidebar-nav-pane">
        <button class="btn btn-icon float-right" @click="toggleAside">
          <Icon family="far" name="times" />
        </button>

        <div class="user-intro">
          <Avatar
            :name="user.display_name"
            :user-id="user.id"
            :has-avatar="user.has_avatar"
            :cache="user.updated_on_ts"
            size="medium"
            private-only
          />
          <h4>{{ user.display_name }}</h4>
          <p>{{ user.email }}</p>
        </div>

        <div class="list-group">
          <router-link
            to="/"
            class="list-group-item list-group-item-action"
            v-bind:class="{
              [`active`]:
                currentRoute === 'home' || currentRoute === 'home-team'
            }"
            ><Icon family="far" name="comments-alt" />
            {{ $t('channels.channels') }}</router-link
          >
          <router-link
            to="/files"
            class="list-group-item list-group-item-action"
            v-bind:class="{
              [`active`]:
                currentRoute === 'files' || currentRoute === 'files-sub'
            }"
            ><Icon family="fal" name="file" />
            {{ $t('general.files') }}</router-link
          >
          <router-link
            to="/actions"
            class="list-group-item list-group-item-action"
            v-bind:class="{ [`active`]: currentRoute === 'actions' }"
            ><Icon family="fal" name="bolt" />
            {{ $t('general.actions') }}</router-link
          >
          <a
            class="list-group-item list-group-item-action d-md-none mt-4"
            @click="openModal('profile-settings')"
            ><Icon family="fal" name="user" /> {{ $t('general.settings') }}</a
          >
          <a
            class="list-group-item list-group-item-action d-md-none"
            href="https://www.airsend.io/support"
            target="_blank"
            ><Icon family="fal" name="phone-square" />
            {{ $t('navbar.contact-support') }}</a
          >
          <a
            class="list-group-item list-group-item-action d-md-none"
            @click="openModal('about-modal')"
            ><Icon family="fal" name="info-circle" />
            {{ $t('navbar.about') }}</a
          >
          <a
            class="list-group-item list-group-item-action d-md-none"
            @click="openModal('language')"
            ><Icon family="fal" name="language" /> {{ $t('title') }}</a
          >
          <a
            class="list-group-item list-group-item-action d-md-none"
            @click="onSignout"
            ><Icon family="fal" name="sign-out" /> {{ $t('navbar.signout') }}</a
          >
        </div>
      </div>
    </aside>
  </div>
</template>

<script>
import Logo from 'airsend/assets/airsend-icon-color.svg';
import LogoText from 'airsend/assets/airsend-text.svg';

import Icon from './Icon.vue';
import SearchBar from './SearchBar.vue';
import Avatar from './Avatar.vue';
import Popover from 'airsend/components/Popover.vue';
import store from 'store';
import platform from 'platform-detect';

import TransactionsIcon from 'airsend/assets/transactions.svg';
import TransactionManager from '../../src/components/ChannelSidebar/TransactionsManager';

import { parseMessageContent, parseTime, focus, isMobile } from 'airsend/utils';
import { EventBus } from 'airsend/event-bus.js';
import { mapMutations } from 'vuex';

import TeamTabs from '../../src/components/Teams/TeamTabs.vue';

export default {
  watch: {
    $route(to) {
      this.isAsideOpen = false;
      if (to.name === 'channel' || to.name === 'channel-sub') {
        this.isChannel = true;
      } else {
        this.isChannel = false;
      }
    },
    runningTransactions(transactions, previous_transactions) {
      if (transactions.length > previous_transactions.length) {
        clearTimeout(this.transactionsTooltipTimeout);
        this.showTransactionsTooltip = true;

        this.transactionsTooltipTimeout = setTimeout(() => {
          this.showTransactionsTooltip = false;
        }, 3000);
      }
    },
    failedTransactions(transactions, previous_transactions) {
      if (transactions.length > previous_transactions.length) {
        clearTimeout(this.transactionsTooltipTimeout);
        this.showTransactionsTooltip = true;

        this.transactionsTooltipTimeout = setTimeout(() => {
          this.showTransactionsTooltip = false;
        }, 3000);
      }
    }
  },
  data: function() {
    return {
      isChannel: this.$route.name === 'channel',
      isAsideOpen: false,
      isCustomLogo: false,
      isSearching: false,
      platform,
      isElectron: window.isElectron,
      showTransactionsTooltip: false,
      transactionsTooltipTimeout: null
    };
  },
  mounted() {
    // Listener for Airsend desktop menu
    if (window.isElectron) {
      // Airsend Menu
      window.ipcRenderer.on('show-about', () => this.openModal('about-modal'));
      window.ipcRenderer.on('show-settings', () =>
        this.openModal('profile-settings')
      );
      window.ipcRenderer.on('sign-out', this.onSignout);

      // File

      window.ipcRenderer.on('channel-create', () =>
        this.openModal('channel-create')
      );
      window.ipcRenderer.on('channel-members', () =>
        this.openModal('channel-members')
      );
      window.ipcRenderer.on('channel-settings', () =>
        this.openModal('channel-settings')
      );

      // view
      window.ipcRenderer.on('change-language', () =>
        this.openModal('language')
      );

      // switch to
      window.ipcRenderer.on('navigate', (e, route) => this.$router.push(route));
    }
  },
  computed: {
    useTeams() {
      return (
        this.$store.state.core.useTeams && this.$route.name.indexOf('home') > -1
      );
    },
    userPreferences() {
      return this.$store.getters['core/getUserPreferences'];
    },
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    currentMeeting() {
      return this.$store.state.meeting.channelId;
    },
    meeting() {
      return this.$store.state.meeting;
    },
    user() {
      return this.$store.getters['core/getUser'](
        this.channel ? this.channel.id : null
      );
    },
    IS_READONLY() {
      return !this.user.display_name || this.user.read_only === true;
    },
    alerts() {
      return this.$store.state.alerts.all;
    },
    alertCount() {
      return this.$store.state.alerts.count;
    },
    preferredColorSchema() {
      return this.$store.state.core.preferredColorSchema;
    },
    currentRoute() {
      return this.$route.name;
    },
    showDownloadsBox() {
      return this.$store.state.files.transactionsBar.visible;
    },
    runningTransactions() {
      return this.$store.getters['files/getRunningTransactions']();
    },
    failedTransactions() {
      return this.$store.getters['files/getTransactions']().filter(
        t => t.status === 'failed'
      );
    },
    transactions() {
      return this.$store.getters['files/getTransactions']();
    },
    //   customImgUrl(type){
    //   if(!this.channel) return
    //   let URL = `
    //     ${process.env.VUE_APP_ROOT_API}/v1/channel.image.get?
    //     channel_id=${this.channel.id}&
    //     channel_asset_type=${type}&
    //     token=${store.get("jwt")}&
    //     cache=${this.channel.img_cache}`;
    //   if(type==='logo'){
    //     return URL;
    //   }
    //   return {background: `url(${URL})`}
    // },
    // #todo, refactor
    bgUrlStyle() {
      if (this.channel && this.channel.has_background) {
        const { hash } = this.$router.history.current.query;
        return {
          background: `url(${
            process.env.VUE_APP_ROOT_API
          }/v1/channel.image.get?channel_id=${
            this.channel.id
          }&channel_asset_type=background&token=${
            hash ? hash : store.get('jwt')
          }&cache=${this.channel.updated_on_ts})`
        };
      }
      return '';
    },
    logoUrl() {
      if (this.channel) {
        const { hash } = this.$router.history.current.query;
        return `${
          process.env.VUE_APP_ROOT_API
        }/v1/channel.image.get?channel_id=${
          this.channel.id
        }&channel_asset_type=logo&token=${
          hash ? hash : store.get('jwt')
        }&cache=${this.channel.updated_on_ts}`;
      }
      return '';
    },
    isMobile
  },
  methods: {
    onClickAlert(alert) {
      // if it's a channel join request alert
      if (
        this.channel &&
        alert.alert_type === 20 &&
        alert.channel_id === this.channel.id
      ) {
        this.$modal.show('channel-members');
      }

      if (alert.message_id) {
        EventBus.$emit('jump-to', {
          target: alert.message_id,
          channel: alert.channel_id
        });
      }
      if (alert.action_id) {
        this.$store.commit('actions/setHighlightAction', {
          id: alert.action_id,
          channel_id: alert.channel_id
        });
        this.$modal.show('action-create', {
          context: 'view',
          id: alert.action_id
        });
      }
    },
    visibilityChanged(isVisible, entry, alert) {
      if (isVisible && !alert.is_read) {
        this.$store.dispatch('alerts/read', alert.alert_id);
      }
    },
    toggleAside() {
      this.isAsideOpen = !this.isAsideOpen;
    },
    openModal(name) {
      this.$modal.show(name);
    },
    onSignout() {
      this.$store.dispatch('core/signout');
    },
    toggleSearch() {
      this.isSearching = !this.isSearching;
      if (this.isSearching) {
        focus(this.$refs.search.$refs.input);
      }
    },
    onCancelSearch() {
      this.isSearching = false;
    },
    getChannel(id) {
      return this.$store.getters['channels/getChannelById'](id);
    },
    getAlertRoute(alert) {
      if (alert.message_id) {
        return {
          name: 'channel',
          params: {
            id: alert.channel_id,
            target: alert.message_id,
            alert_type: alert.alert_type
          }
        };
      } else {
        return {
          name: 'channel',
          params: { id: alert.channel_id, alert_type: alert.alert_type }
        };
      }
    },
    navtoDashboard() {
      const allowedRoutes = ['files', 'files-sub'];
      const currentRoute = this.$route.name;
      if (allowedRoutes.includes(currentRoute)) {
        this.$router.push({ name: 'home' });
      }
    },
    getCounterpart(channel) {
      return _.find(channel.members, member => {
        return member.id !== this.user.id;
      });
    },

    parseMessageContent: parseMessageContent,
    parseTime: parseTime,
    ...mapMutations({
      setTransactionsBar: 'files/setTransactionsBar'
    })
  },
  components: {
    TeamTabs,
    Logo,
    LogoText,
    Avatar,
    Icon,
    Popover,
    SearchBar,
    TransactionsIcon,
    TransactionManager
  }
};
</script>
