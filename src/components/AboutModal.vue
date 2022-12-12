<template>
  <Modal
    name="about-modal"
    title=""
    theme="noPadding"
    class-name="about-settings"
    @opened="onOpen"
  >
    <Loader :loading="!serverVersion" full />
    <small v-if="errors" class="form-text text-danger">{{ errors }}</small>
    <div class="about-airsend">
      <Logo class="brand-icon" />
      <LogoText class="brand-text" />
    </div>
    <div class="version-info">
      {{ $t('general.version-client', { version: clientVersion }) }}<br />
      {{ $t('general.version-server', { version: serverVersion }) }}<br />
      <a
        class="btn btn-primary text-white mx-auto mt-4"
        target="_blank"
        href="https://www.airsend.io/support/releasenotes"
        >{{ $t('general.version-changes') }}</a
      >
    </div>
    <div class="codelathe" v-html="$t('general.version-copyright')"></div>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Icon from 'airsend/components/Icon.vue';
import Logo from 'airsend/assets/airsend-icon-color.svg';
import LogoText from 'airsend/assets/airsend-text.svg';
import Loader from 'airsend/components/Loader.vue';
import appInfo from '../../package.json';

export default {
  components: {
    Modal,
    Logo,
    LogoText,
    Loader,
    Icon
  },
  data() {
    return {
      errors: '',
      clientVersion: appInfo.version,
      serverVersion: null
    };
  },
  methods: {
    async onOpen() {
      const response = await this.$store.dispatch('core/getSystemInfo');
      if (response.ok && response.data) {
        this.serverVersion = response.data.info.version;
      } else {
        errors = this.$t('general.version-failed');
      }
    }
  }
};
</script>
