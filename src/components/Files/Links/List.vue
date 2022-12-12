<template>
  <div class="link-list">
    <component
      :is="item.component"
      v-for="(item, index) in links"
      :key="index"
      :item="item"
      :when="item.when || null"
    />
    <div v-if="links.length === 0 && !loading" class="empty-wrapper">
      <div class="empty-box">
        <Icon family="fal" name="unlink" />
        <h4>{{ $t('links.empty-list') }}</h4>
        <p>{{ $t('links.empty-list-description') }}</p>
      </div>
    </div>
    <fragment v-if="loading">
      <Loader v-for="item in 10" :key="`loader-${item}`" />
    </fragment>
    <fragment v-if="linksInfo.hasPageAfter && !loading">
      <Loader
        v-for="item in 10"
        :key="`loader-${item}`"
        v-observe-visibility="{
          callback: visibilityChanged,
          throttle: 0,
          once: false
        }"
      />
    </fragment>
  </div>
</template>

<script>
import Link from './ListItem';
import Loader from './Loader';
import LinkDivider from 'airsend/components/LinkDivider.vue';
import Icon from 'airsend/components/Icon.vue';

export default {
  components: {
    Link,
    Loader,
    Icon,
    'date-divider': LinkDivider
  },
  computed: {
    links() {
      return this.$store.getters['files/getLinksInChannel'](this.channel.id);
    },
    loading() {
      return this.$store.state.loading['links.list/loading'];
    },
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    linksInfo() {
      return this.$store.getters['files/getLinksInfo'](this.channel.id);
    },
    loadingAfter() {
      return this.$store.state.loading['links.list/loading-after'];
    }
  },
  methods: {
    visibilityChanged(isVisible) {
      if (isVisible && !this.loadingAfter) {
        this.$store.dispatch('files/getPageLinks', {
          channel_id: this.channel.id
        });
      }
    }
  },
  mounted() {}
};
</script>

<style></style>
