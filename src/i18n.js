import Vue from 'vue';
import VueI18n from 'vue-i18n';
import messages from './lang/en-US.json';
import axios from 'axios';
import _ from 'lodash';
import store from 'store';

// moment locales
import moment from 'moment';
import 'moment/locale/pt-br';

Vue.use(VueI18n);

export const i18n = new VueI18n({
  locale: 'en-US', // set locale
  fallbackLocale: 'en-US',
  missing: (lang, phrase) => {
    console.log('MISSING', phrase);
  },
  postTranslation: (phrase, key) => {
    return phrase && phrase != '' ? phrase : _.get(messages, key);
  },
  silentTranslationWarn: true,
  messages: {
    'en-US': messages
  } // set locale messages
});

const loadedLanguages = ['en-US']; // our default language that is preloaded

if (store.get('lang')) {
  loadLanguageAsync(store.get('lang'));
} else {
  moment.locale('en-us');
}

function setI18nLanguage(lang) {
  store.set('lang', lang);
  i18n.locale = lang;
  axios.defaults.headers.common['Accept-Language'] = lang.replace('-', '_');
  document.querySelector('html').setAttribute('lang', lang);
  return lang;
}

export function loadLanguageAsync(lang) {
  moment.locale(lang);

  // If the same language
  if (i18n.locale === lang) {
    return Promise.resolve(setI18nLanguage(lang));
  }

  // If the language was already loaded
  if (loadedLanguages.includes(lang)) {
    return Promise.resolve(setI18nLanguage(lang));
  }

  // If the language hasn't been loaded yet
  return import(
    /* webpackChunkName: "lang-[request]" */ `./lang/${lang}.json`
  ).then(messages => {
    i18n.setLocaleMessage(lang, messages.default);
    loadedLanguages.push(lang);
    return setI18nLanguage(lang);
  });
}
