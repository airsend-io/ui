<template>
  <div class="d-block p-relative dropdown">
    <input
      v-on:keydown="onKeyDown"
      v-on:keyup="onChange"
      v-model="value"
      type="text"
      class="form-control"
      :placeholder="placeholder"
      ref="input"
      :disabled="disabled"
    />
    <ul
      class="dropdown-menu dropdown-menu--fullwidth"
      v-bind:class="{ show: results.length > 0 }"
    >
      <li
        class="dropdown-item"
        @click="() => onSelect(item.value)"
        v-bind:class="{ [`is-selected`]: index === selected }"
        v-for="(item, index) in results"
        v-bind:key="index"
      >
        <a
          ><Avatar
            :name="item.user.display_name"
            :user-id="item.user.id"
            :has-avatar="item.user.has_avatar"
            :cache="0"
            size="medium"
            v-if="item.user"
          />
          <div class="dropdown-title">
            {{ item.title }}
            <small v-if="item.description">{{ item.description }}</small>
          </div></a
        >
      </li>
    </ul>
  </div>
</template>

<script>
import Fuse from 'fuse.js';
import Avatar from './Avatar.vue';

export default {
  mounted() {
    if (this.autofocus) {
      setTimeout(() => {
        this.focus();
      }, 100);
    }
  },
  props: {
    placeholder: {
      type: String,
      default: 'Start typing to add...'
    },
    autofocus: {
      type: Boolean,
      default: false
    },
    data: {
      type: Array,
      default() {
        return [
          {
            title: 'Sample 1',
            description: 'This is a option',
            value: '1'
          },
          {
            title: 'Sample 2',
            description: 'This is a option',
            value: '2'
          },
          {
            title: 'Sample 3',
            description: 'This is a option',
            value: '3'
          }
        ];
      }
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      value: '',
      selected: 0,
      results: []
    };
  },
  methods: {
    focus() {
      this.$refs.input.focus();
    },
    onChange() {
      const fuse = new Fuse(this.data, {
        threshold: 0.2,
        keys: ['title', 'description']
      });

      this.results = fuse.search(this.value).slice(0, 5);
    },

    onBlur(e) {
      if (this.value !== '' && this.results.length === 0) {
        this.$emit('noSelectionKeyup', e, this.value);
      }

      //this.results = [];
      //this.index = 0;
      //this.value = "";
    },

    onKeyDown(e) {
      // pressing up arrow
      if (e.keyCode === 38) {
        if (this.selected > 0) {
          this.selected--;
        }
        e.preventDefault();
        e.stopPropagation();
        return true;
      }

      // pressing down arrow
      if (e.keyCode === 40) {
        if (this.selected < this.results.length - 1) {
          this.selected++;
        }
        e.preventDefault();
        e.stopPropagation();
        return true;
      }

      // pressing enter
      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();

        if (this.results[this.selected]) {
          this.onSelect(this.results[this.selected].value);
          return true;
        } else {
          this.$emit('error', `No results for ${this.value}`);
        }
      }

      this.selected = 0;

      if (!this.results[this.selected]) {
        this.$emit('noSelectionKeyup', e, this.value);
      }
    },
    onSelect(value) {
      this.results = [];
      this.index = 0;
      this.value = '';

      this.$emit('select', value);
    },
    setValue(value) {
      this.value = value;
    },
    clear() {
      this.value = '';
    }
  },
  components: {
    Avatar
  }
};
</script>
