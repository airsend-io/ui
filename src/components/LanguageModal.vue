<template>
  <Modal name="language" title="Change Language">
    <form novalidate="true">
      <ul class="list-group">
        <li v-for="language in languages">
          <a
            href="#"
            :class="{ active: language.id === currentLanguage }"
            @click="onChange(language)"
            >{{ language.title }}</a
          >
        </li>
      </ul>
    </form>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';
import { i18n, loadLanguageAsync } from '../i18n.js';

export default {
  components: {
    Modal,
    Loader
  },
  data() {
    return {
      languages: [
        {
          id: 'en-US',
          title: 'English (US)'
        },
        {
          id: 'pt-BR',
          title: 'Português (BR)'
        },
        {
          id: 'es-ES',
          title: 'Español (ES)'
        },
        {
          id: 'de-DE',
          title: 'Deutsch (DE)'
        },
        {
          id: 'fr-FR',
          title: 'French (FR)'
        },
        {
          id: 'it-IT',
          title: 'Italiano (IT)'
        },
        {
          id: 'nl-NL',
          title: 'Dutch (NL)'
        },
        {
          id: 'ru-RU',
          title: 'Русский (RU)'
        }
      ]
    };
  },
  computed: {
    user() {
      return this.$store.state.core.user;
    },
    currentLanguage() {
      return i18n.locale;
    }
  },
  methods: {
    async onChange(language) {
      await loadLanguageAsync(language.id);
      await this.$store.dispatch('channels/list');
    }
  }
};
</script>
