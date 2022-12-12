<template>
  <portal to="modal-wrapper">
    <Modal
      name="file-previous-versions"
      :title="$t('files.modals.previous-versions-title')"
      @before-open="onOpen"
    >
      <Loader :loading="this.$store.state.loading['file.versions']" full />

      <perfect-scrollbar class="list-group medium-height">
        <div v-if="!this.$store.state.loading['file.versions']" class="w-100">
          <div v-if="previousVersions.length === 0" class="empty-wrapper">
            <div class="empty-box">
              <Icon family="fal" name="history" />
              <h4>{{ $t('files.modals.previous-versions-empty') }}</h4>
              <p>
                {{ $t('files.modals.previous-versions-empty-description') }}
              </p>
            </div>
          </div>
          <table v-else class="table w-100 file-explorer-list">
            <thead>
              <tr>
                <th scope="col">
                  {{ $t('files.modals.previous-versions-name') }}
                </th>
                <th scope="col">
                  {{ $t('files.modals.previous-versions-modified') }}
                </th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in previousVersions" :key="item.modification">
                <td>
                  <div class="file-info">
                    <h4>
                      {{ item.displayname }}
                      <small>{{ bytesToSize(item.size) }}</small>
                    </h4>
                  </div>
                </td>
                <td>
                  {{
                    parseTime(item.modification).format('YYYY/MM/DD HH:mm:ss')
                  }}
                </td>
                <td>
                  <button
                    class="btn btn-icon btn-sm"
                    @click="
                      () => {
                        $emit('download', item);
                      }
                    "
                  >
                    <Icon family="fal" name="download" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </perfect-scrollbar>
    </Modal>
  </portal>
</template>
<script>
import Modal from 'airsend/components/Modal.vue';
import Loader from 'airsend/components/Loader.vue';

import Icon from 'airsend/components/Icon.vue';

import { parseTime, bytesToSize } from 'airsend/utils';

export default {
  components: {
    Modal,
    Loader,
    Icon
  },
  data() {
    return {
      currentFile: null
    };
  },
  computed: {
    previousVersions() {
      return this.currentFile &&
        this.$store.state.files.versions[this.currentFile.fullpath]
        ? this.$store.state.files.versions[this.currentFile.fullpath]
        : [];
    }
  },
  methods: {
    onOpen(e) {
      const { params } = e;
      this.currentFile = params;
      this.$store.dispatch('files/versions', params.fullpath);
    },
    parseTime,
    bytesToSize
  }
};
</script>
