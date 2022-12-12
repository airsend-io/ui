<template>
  <div
    class="btn btn-icon emoji-picker"
    @click="togglePicker"
    v-click-outside="outsideClick"
  >
    <Icon family="far" name="smile-wink" />
    <div class="emoji-picker-container" v-if="show">
      <ul
        class="emoji-picker-header"
        v-scroll-spy-active
        :class="{ 'is-gif': isGIF }"
      >
        <li @click="scrollTo(0)">
          <a><Icon family="far" name="smile"/></a>
        </li>
        <li @click="scrollTo(1)">
          <a><Icon family="far" name="paw-alt"/></a>
        </li>
        <li @click="scrollTo(2)">
          <a><Icon family="far" name="apple-alt"/></a>
        </li>
        <li @click="scrollTo(3)">
          <a><Icon family="far" name="futbol"/></a>
        </li>
        <li @click="scrollTo(4)">
          <a><Icon family="far" name="car"/></a>
        </li>
        <li @click="scrollTo(5)">
          <a><Icon family="far" name="lightbulb"/></a>
        </li>
        <li @click="scrollTo(6)">
          <a><Icon family="far" name="icons-alt"/></a>
        </li>
        <li @click="scrollTo(7)">
          <a><Icon family="far" name="flag"/></a>
        </li>
        <li @click="scrollTo(8)">
          <a><i class="icon-gif">GIF</i></a>
        </li>
      </ul>
      <div class="emoji-picker-search">
        <div class="form-group form-group--icon form-group--search">
          <Icon family="far" name="search" />
          <input
            ref="search"
            v-model="query"
            class="form-control form-control-sm form-control--rounded form-control--large"
            type="text"
            :placeholder="
              isGIF
                ? $t('channels.emoji-picker.search-for-gifs')
                : $t('channels.emoji-picker.search-for-emojis')
            "
            aria-label="Search"
            @input="onSearch"
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
      </div>
      <div class="emoji-picker-body" v-if="isGIF && query === ''">
        <Loader full :loading="isLoadingGifs" />
        <section class="emoji-picker-section">
          <h4>{{ $t('channels.emoji-picker.gifs-trending') }}</h4>
          <masonry class="gif-menu" :cols="3" :gutter="6">
            <div
              class="gif-item"
              @click="onPickGif(gif)"
              v-for="(gif, index) in gifs.trending"
              :key="index"
            >
              <img :src="gif.images.preview_gif.url" />
            </div>
          </masonry>
        </section>
      </div>
      <div class="emoji-picker-body" v-else-if="isGIF && query !== ''">
        <Loader full :loading="isSearchingGifs" />
        <section class="emoji-picker-section">
          <h4>{{ $t('channels.emoji-picker.search-results', { query }) }}</h4>
          <masonry
            class="gif-menu"
            :cols="3"
            :gutter="6"
            v-if="gifs.search.length > 0 || isSearchingGifs"
          >
            <div
              class="gif-item"
              @click="onPickGif(gif)"
              v-for="(gif, index) in gifs.search"
              :key="index"
            >
              <img :src="gif.images.preview_gif.url" />
            </div>
          </masonry>
          <div class="emoji-picker-empty" v-else>
            {{ $t('channels.emoji-picker.search-no-results') }}
          </div>
        </section>
      </div>
      <div
        class="emoji-picker-body"
        ref="scrollable"
        v-scroll-spy
        v-else-if="query === ''"
      >
        <section
          class="emoji-picker-section"
          v-for="category in emojis._categories"
        >
          <h4>{{ $t(`channels.emoji-picker.category-${category.id}`) }}</h4>
          <ul class="emoji-menu">
            <li v-for="emoji in category.emojis" @click="onPick(emoji.native)">
              {{ emoji.native }}
            </li>
          </ul>
        </section>
      </div>
      <div class="emoji-picker-body" v-else>
        <section class="emoji-picker-section">
          <h4>{{ $t('channels.emoji-picker.search-results', { query }) }}</h4>
          <ul class="emoji-menu" v-if="searchResults.length > 0">
            <li v-for="emoji in searchResults" @click="onPick(emoji)">
              {{ emoji }}
            </li>
          </ul>
          <div class="emoji-picker-empty" v-else>
            {{ $t('channels.emoji-picker.search-no-results') }}
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import Icon from './Icon.vue';
import Loader from './Loader.vue';
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast';
import { GiphyFetch } from '@giphy/js-fetch-api';
import data from 'emoji-mart-vue-fast/data/all.json';
const emojiIndex = new EmojiIndex(data, { exclude: ['recent'] });
import 'emoji-mart-vue-fast/css/emoji-mart.css';

export default {
  data() {
    return {
      emojis: emojiIndex,
      show: false,
      isGIF: false,
      query: '',
      isLoadingGifs: false,
      isSearchingGifs: false,
      searchTimeout: null,
      giphy: null,
      gifs: {
        trending: [],
        search: []
      }
    };
  },
  computed: {
    searchResults() {
      return emojiIndex.search(this.query).map(o => o.native);
    },
    settings() {
      return this.$store.state.core.handshakeSettings;
    }
  },
  mounted() {
    this.giphy = new GiphyFetch(this.settings.giphyKey);
  },
  methods: {
    togglePicker(e) {
      // if it's the btn element
      if (
        typeof e.target.className === 'string' &&
        e.target.className.search('btn') > -1
      ) {
        this.show = !this.show;
        this.isGIF = false;
        this.query = '';
        this.$nextTick(() =>
          this.$refs.search ? this.$refs.search.focus() : true
        );
      }
    },
    scrollTo(section) {
      this.query = '';
      this.$refs.search.focus();

      // if it's a gif
      if (section === 8) {
        this.isGIF = true;
        this.getTrendingGifs();

        return;
      }

      this.isGIF = false;

      // wait for next tick to scroll pane
      this.$nextTick(() => {
        if (this.$refs.scrollable) {
          const targetNode = this.$refs.scrollable.childNodes[section];

          if (targetNode) {
            this.$refs.scrollable.scrollTop = targetNode.offsetTop;
          }
        }
      });
    },
    outsideClick(e) {
      this.show = false;
    },
    onPick(emoji) {
      this.$emit('picked', emoji);
    },
    onPickGif(gif) {
      this.$emit('picked-gif', gif.images.downsized.url);
      this.show = false;
    },
    async getTrendingGifs() {
      this.isLoadingGifs = true;
      const { data: gifs } = await this.giphy.trending({ limit: 20 });
      this.gifs.trending = gifs;
      this.isLoadingGifs = false;
    },
    async onSearch() {
      if (this.isGIF) {
        this.isSearchingGifs = true;

        clearTimeout(this.searchTimeout);

        this.searchTimeout = setTimeout(async () => {
          const { data: gifs } = await this.giphy.search(this.query);
          this.gifs.search = gifs;
          this.isSearchingGifs = false;
        }, 250);
      }
    },
    onCancelSearch() {
      this.query = '';
    }
  },
  components: {
    Icon,
    Picker,
    Loader
  }
};
</script>
