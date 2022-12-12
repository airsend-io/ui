import { parseTime } from 'airsend/utils';
import moment from 'moment';
var mixin = {
  methods: {
    getDueOfClosestDueChildren(action) {
      let closestChildren = {};
      action.children.forEach(child => {
        if (child.action_status == 1) return;
        if (child.due_on_ts <= closestChildren.due_on_ts || 9999999999) {
          closestChildren = child;
        }
      });
      if (!closestChildren) return {};
      return this.getDue(closestChildren.due_on);
    },
    getDue(date) {
      if (!date) return {};
      let dueInMins = parseTime(date).diff(moment(), 'minutes');

      let text = '';
      let bindClass = '';

      if (dueInMins > 0) {
        if (dueInMins > 24 * 60) {
          text = `due in ${Math.round(dueInMins / (24 * 60))} day(s)`;
        } else if (dueInMins > 60) {
          bindClass = 'due-today';
          text = `due in ${Math.round(dueInMins / 60)} hour(s)`;
        } else {
          bindClass = 'due-today';
          text = `due in ${dueInMins} minute(s)`;
        }
      } else {
        bindClass = 'overdue';
        if (dueInMins >= -60) {
          text = `overdue for ${dueInMins * -1} minute(s)`;
        } else if (dueInMins > -24 * 60 && dueInMins < -1 * 60) {
          text = `overdue for ${Math.round((dueInMins * -1) / 60)} hour(s)`;
        } else {
          text = `overdue for ${Math.round(
            (dueInMins * -1) / (24 * 60)
          )} day(s)`;
        }
      }

      return { text, class: bindClass };
    },
    amIAssigned(action, id) {
      return _.findIndex(action.users, { id: this.user.id }) > -1;
    }
  }
};

export default mixin;
