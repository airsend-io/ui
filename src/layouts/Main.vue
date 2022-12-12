<template>
  <div class="page-wrapper">
    <Navbar />
    <router-view></router-view>
    <ProfileModal />
    <AboutModal />
    <ShortcutsModal />
    <FilePreview />
    <SearchView />
    <ActionModal />
    <MeetingIncomingInviteModal />
    <SpotlightSearch />
    <WikiEditorModal />
    <FileShareModal />
    <OneOneReportSpamModal />
    <portal-target name="modal-wrapper" multiple />
  </div>
</template>
<script>
import Navbar from 'airsend/components/Navbar.vue';
import ProfileModal from '../components/Modals/Profile.vue';
import AboutModal from '../components/AboutModal.vue';
import ShortcutsModal from '../components/Modals/Shortcuts.vue';
import FilePreview from 'airsend/components/FilePreview.vue';
import SearchView from '../components/Modals/SearchView.vue';
import MeetingIncomingInviteModal from '../components/Modals/MeetingIncomingInvite.vue';
import ActionModal from '../components/Tasks/ActionModal';
import FileShareModal from '../components/Modals/FileShare.vue';
import SpotlightSearch from '../components/SpotlightSearch.vue';
import WikiEditorModal from '../components/Modals/WikiEditor.vue';
import OneOneReportSpamModal from '../components/Modals/OneOneReportSpam.vue';

export default {
  components: {
    ActionModal,
    Navbar,
    ProfileModal,
    AboutModal,
    ShortcutsModal,
    FilePreview,
    SearchView,
    MeetingIncomingInviteModal,
    FileShareModal,
    SpotlightSearch,
    WikiEditorModal,
    OneOneReportSpamModal
  },
  mounted() {
    if (window.isElectron && this.$route.name === null) {
      this.$router.push('/');
    }
  }
};
</script>
