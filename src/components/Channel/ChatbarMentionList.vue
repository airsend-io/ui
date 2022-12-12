<template>
  <ul class="popover-mention">
    <li
      :class="{ 'is-selected': index === selectedIndex }"
      v-for="(item, index) in items"
      :key="index"
    >
      <a @click="selectItem(index)">
        <Avatar
          :name="item.display_name"
          :user-id="item.id"
          :has-avatar="item.has_avatar"
          :cache="item.updated_on_ts"
          size="medium"
          v-if="asset == 'users' && item.id !== 'all'"
        />
        <div class="avatar" v-else-if="asset == 'users'">
          <Icon family="fas" name="users" />
        </div>
        {{ item.display_name }}
      </a>
    </li>
  </ul>
</template>

<script>
import Avatar from 'airsend/components/Avatar.vue';
import Icon from 'airsend/components/Icon.vue';

export default {
  components: {
    Avatar,
    Icon
  },
  props: {
    asset: {
      type: String,
      required: 'users'
    },
    items: {
      type: Array,
      required: true
    },
    command: {
      type: Function,
      required: true
    }
  },

  data() {
    return {
      selectedIndex: 0
    };
  },

  watch: {
    items() {
      this.selectedIndex = 0;
    }
  },

  methods: {
    onKeyDown({ event }) {
      if (this.items.length === 0) return false;

      if (event.key === 'ArrowUp') {
        this.upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        this.downHandler();
        return true;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        this.enterHandler();
        return true;
      }

      return false;
    },

    upHandler() {
      this.selectedIndex =
        (this.selectedIndex + this.items.length - 1) % this.items.length;
    },

    downHandler() {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    },

    enterHandler() {
      this.selectItem(this.selectedIndex);
    },

    selectItem(index) {
      const item = this.items[index];

      if (item) {
        this.command(item);
      }
    }
  }
};
</script>
