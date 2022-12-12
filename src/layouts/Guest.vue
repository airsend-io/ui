<template>
  <div class="page-wrapper">
    <Navbar :user="this.$store.state.core.user" />
    <router-view></router-view>
    <AuthModal />
    <FinalizeModal />
    <FilePreview />
  </div>
</template>
<script>
import Navbar from 'airsend/components/Navbar.vue';
import AuthModal from '../components/Modals/Auth.vue';
import FinalizeModal from '../components/FinalizeModal.vue';
import FilePreview from 'airsend/components/FilePreview.vue';

export default {
  components: {
    Navbar,
    AuthModal,
    FinalizeModal,
    FilePreview
  }
};
</script>
