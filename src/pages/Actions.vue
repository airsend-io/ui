<template>
  <div class="page-content">
    <MeetingWidget />
    <div class="container-fluid fullheight overflow-hidden">
      <FullActionView />
    </div>
  </div>
</template>
<script>
import FullActionView from '../components/FullActionView.vue';
import MeetingWidget from '../components/Meeting/Widget.vue';

export default {
  name: 'Actions',
  components: {
    FullActionView,
    MeetingWidget
  }
};
</script>
