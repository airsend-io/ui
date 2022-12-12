<template>
  <Modal
    name="shortcuts"
    :title="$t('navbar.shortcuts')"
    class="shortcuts-modal"
  >
    <h4 class="ml-2">{{ $t('shortcuts.global') }}</h4>

    <table class="table">
      <thead>
        <tr>
          <th scope="col" class="col-md-4">{{ $t('shortcuts.command') }}</th>
          <th scope="col">{{ $t('shortcuts.description') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row" class="col-md-4">{{ metaKey }} + Shift + F</th>
          <td>{{ $t('shortcuts.command-quick-search') }}</td>
        </tr>
        <tr v-if="isElectron">
          <th scope="row" class="col-md-4">{{ metaKey }} + R</th>
          <td>{{ $t('shortcuts.command-refresh') }}</td>
        </tr>
        <tr>
          <th scope="row" class="col-md-4">[</th>
          <td>{{ $t('shortcuts.command-toggle-left-pane') }}</td>
        </tr>
        <tr>
          <th scope="row" class="col-md-4">]</th>
          <td>{{ $t('shortcuts.command-toggle-right-pane') }}</td>
        </tr>
        <tr>
          <th scope="row" class="col-md-4">{{ altKey }} + Shift + ↓</th>
          <td>{{ $t('shortcuts.command-switch-below') }}</td>
        </tr>
        <tr>
          <th scope="row" class="col-md-4">{{ altKey }} + Shift + ↑</th>
          <td>{{ $t('shortcuts.command-switch-above') }}</td>
        </tr>
      </tbody>
    </table>

    <hr />

    <h4 class="ml-2">{{ $t('shortcuts.chatbar') }}</h4>

    <table class="table">
      <thead>
        <tr>
          <th scope="col" class="col-md-4">{{ $t('shortcuts.command') }}</th>
          <th scope="col">{{ $t('shortcuts.description') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row" class="col-md-4">/</th>
          <td>{{ $t('shortcuts.command-channel-cmd') }}</td>
        </tr>
        <tr>
          <th scope="row" class="col-md-4">@</th>
          <td>{{ $t('shortcuts.command-mention') }}</td>
        </tr>
        <tr>
          <th scope="row" class="col-md-4">#</th>
          <td>{{ $t('shortcuts.command-action') }}</td>
        </tr>
      </tbody>
    </table>
  </Modal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Icon from 'airsend/components/Icon.vue';

export default {
  components: {
    Modal,
    Icon
  },
  data() {
    return {
      shortcuts: []
    };
  },
  computed: {
    isElectron() {
      return window.isElectron;
    },
    metaKey() {
      return /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'Cmd' : 'Ctrl';
    },
    altKey() {
      return /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'Option' : 'Alt';
    }
  }
};
</script>
