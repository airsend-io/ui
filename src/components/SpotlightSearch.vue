<template>
  <div
    class="spotlight-search"
    :class="{ visible: isSpotlightVisible }"
    v-hotkey="keymap"
  >
    <div class="spotlight-search-overlay" @click="close"></div>

    <div class="spotlight-search-container">
      <transition name="spotlight">
        <div class="spotlight-search-wrapper" v-if="isSpotlightVisible">
          <Loader :loading="$store.state.loading['channel.one-on-one']" full />

          <div class="spotlight-search-bar">
            <Icon name="search" />
            <input
              type="text"
              ref="searchbar"
              @blur="onBlur"
              @keydown="onKeyDown"
              @input="onChangeQuery"
              v-model="query"
              :placeholder="$t('channels.spotlight-label')"
            />
          </div>

          <p>{{ $t('channels.spotlight-description') }}</p>

          <div v-if="aggregatedResults.length === 0" class="empty-wrapper">
            <div class="empty-box">
              <Icon family="fal" name="search" />
              <h4>{{ $t('channels.switcher-no-channels') }}</h4>
              <p>{{ $t('general.try-another-keyword') }}</p>
            </div>
          </div>

          <div class="list-group">
            <div
              class="list-group-item list-group-item-action"
              :class="{ active: index === currentIndex }"
              @click="switchTo(item)"
              v-for="(item, index) in aggregatedResults"
            >
              <Avatar
                v-if="item.user"
                :name="item.user.display_name"
                :active="item.user.online_status"
                :user-id="item.user.id"
                :has-avatar="item.user.has_avatar"
                :cache="item.user.updated_on_ts"
                size="small"
                light
              />
              <Avatar
                v-else-if="item.one_one && item.counterpart"
                :name="item.counterpart.display_name"
                :active="item.counterpart.online_status"
                :user-id="item.counterpart.id"
                :has-avatar="item.counterpart.has_avatar"
                :cache="item.counterpart.updated_on_ts"
                size="small"
                light
              />
              <Avatar
                v-else-if="item"
                :name="item.channel_name"
                type="logo"
                :channel-id="item.id"
                :has-avatar="item.has_logo"
                :cache="item.updated_on_ts"
                size="small"
                light
              />

              <div class="list-group-item-content">
                <h5 v-if="item.user">
                  {{ item.user.display_name }}
                </h5>
                <h5 v-else>
                  {{
                    !item.one_one
                      ? item.channel_name
                      : item.counterpart
                      ? item.counterpart.display_name
                      : 'Direct Conversation'
                  }}
                </h5>

                <div class="last-message" v-if="item.user">
                  {{ $t('channels.sidebar.start-a-new-conversation') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>
<script>
import Fuse from 'fuse.js';
import Icon from 'airsend/components/Icon.vue';
import Loader from 'airsend/components/Loader.vue';
import Avatar from 'airsend/components/Avatar.vue';

export default {
  data() {
    return {
      query: null,
      currentIndex: 0
    };
  },
  computed: {
    keymap() {
      return {
        'ctrl+shift+f': this.open,
        'alt+shift+f': this.open,
        'meta+shift+f': this.open,
        esc: this.close
      };
    },
    user() {
      return this.$store.state.core.user;
    },
    isSpotlightVisible() {
      return this.$store.state.core.isSpotlightVisible;
    },
    siblingMembers() {
      return this.$store.getters['channels/getSiblingMembers'];
    },
    sortedChannels() {
      return this.$store.getters['channels/getSortedChannels']('switcher');
    },
    channels() {
      // fuzzy search
      if (this.query) {
        const fuse = new Fuse(this.sortedChannels.channels, {
          threshold: 0.2,
          shouldSort: false,
          keys: ['channel_name', 'counterpart.display_name']
        });

        return fuse.search(this.query).slice(0, 5);
      }

      return this.sortedChannels.channels.slice(0, 5);
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
            console.log(channel, this.getCounterpart(channel));
            return (
              this.getCounterpart(channel) && this.getCounterpart(channel).id
            );
          }
        );

        // filter only not repeated entries
        return _.filter(fuse.search(this.query), item => {
          return directMessageUsers.indexOf(item.value) === -1;
        });
      }

      return [];
    },
    aggregatedResults() {
      return [...this.channels, ...this.suggestedChannels].slice(0, 5);
    }
  },
  methods: {
    async switchTo(item) {
      if (item.user) {
        await this.$store.dispatch('channels/createOneOnOne', item.user.id);
      } else {
        this.$router.push(`/channel/${item.id}`);
      }

      this.close();
    },
    open(e) {
      e.preventDefault();
      e.stopPropagation();

      this.query = '';
      this.currentIndex = 0;
      this.$store.commit('core/set', { isSpotlightVisible: true });
      this.$nextTick(() => {
        this.$refs['searchbar'].focus();
      });
    },
    close() {
      this.$store.commit('core/set', { isSpotlightVisible: false });
    },
    onChangeQuery() {
      this.currentIndex = 0;
    },
    onBlur() {
      if (this.isSpotlightVisible) {
        this.$refs['searchbar'].focus();
      }
    },
    onKeyDown(e) {
      const { key } = e;

      if (!this.isSpotlightVisible) return;

      if (key === 'ArrowDown' || key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
      }

      if (key === 'Enter' && this.aggregatedResults[this.currentIndex]) {
        this.switchTo(this.aggregatedResults[this.currentIndex]);
      }

      if (
        key === 'ArrowDown' &&
        this.currentIndex < 4 &&
        this.currentIndex < this.aggregatedResults.length - 1
      ) {
        this.currentIndex++;
      }

      if (key === 'ArrowUp' && this.currentIndex > 0) {
        this.currentIndex--;
      }
    },
    getCounterpart(channel) {
      return _.find(channel.members, member => {
        return member.id !== this.user.id;
      });
    }
  },
  components: {
    Icon,
    Loader,
    Avatar
  }
};
</script>
