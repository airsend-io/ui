import Toaster from './ChannelSidebar/Toaster';

export default {
  components: {
    Toaster
  },
  data: {
    useExternalToaster: false
  },
  methods: {
    onToasterWrapperCreated() {
      this.useExternalToaster = true;
    },
    onToasterWrapperDeleted() {
      this.useExternalToaster = false;
    }
  }
};
