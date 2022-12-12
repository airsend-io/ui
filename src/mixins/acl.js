const AclMixin = {
  computed: {
    channel() {
      return this.$store.state.channels.single[this.$route.params.id];
    },
    user() {
      return this.$store.getters['core/getUser'](
        this.channel ? this.channel.id : null
      );
    },
    IS_READONLY() {
      return (
        (this.channel &&
          this.$router.history.current.query.hash !== undefined) ||
        this.user.read_only === true
      );
    }
  }
};

export default AclMixin;
