<template>
  <div class="card card-float pending-actions">
    <Loader full :loading="loading" />
    <div class="card-header">
      <h4>
        Pending Actions
        <!-- $t('') -->
      </h4>
      <ul class="card-nav" @click.stop.prevent>
        <span
          v-tooltip="{
            delay: 1000,
            offset: -5,
            content: $t('channels.closed-channel')
          }"
          class="expand-icon"
          ><Icon family="far" name="expand"
        /></span>
      </ul>
    </div>

    <div class="card-body">
      <ul class="action-list">
        <li v-for="(action, index) in splitedActions" :key="index">
          <div class="action-label">
            <Checkbox :id="`team-action-${index}`" :checked="action.checked" />
            <span class="label">{{ action.label }}</span>
          </div>

          <div class="action-assigned">
            <UsersChips :users="action.users" />
            <span>due 1 day</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon';
import Checkbox from 'airsend/components/Checkbox';
import UsersChips from 'airsend/components/UsersChips';
import Loader from 'airsend/components/Loader';

export default {
  data() {
    return {
      actions: [
        {
          id: '12381231',
          label: 'Task test',
          checked: false,
          users: [
            {
              display_name: 'Lucas Pellison',
              id: '182382831',
              has_avatar: false
            },
            {
              display_name: 'Jhon Castilho',
              id: '182382133',
              has_avatar: false
            }
          ]
        },
        {
          id: '12381231',
          label: 'Task with medium name',
          checked: true,
          users: [
            {
              display_name: 'Lucas Pellison',
              id: '182382831',
              has_avatar: false
            },
            {
              display_name: 'Paulo Silva',
              id: '182382133',
              has_avatar: false
            }
          ]
        },
        {
          id: '12381231',
          label: 'Task with long naaaaaaaaaaaaaaaaame',
          checked: false,
          users: [
            {
              display_name: 'Paulo Silva',
              id: '182382831',
              has_avatar: false
            },
            {
              display_name: 'Jhon Castilho',
              id: '182382133',
              has_avatar: false
            }
          ]
        },
        {
          id: '12381231',
          label: 'Task will be invisible 1',
          checked: false,
          users: [
            {
              display_name: 'Lucas Pellison',
              id: '182382831',
              has_avatar: false
            }
          ]
        },
        {
          id: '12381231',
          label: 'Task will be invisible 2',
          checked: false,
          users: [
            {
              display_name: 'Lucas Pellison',
              id: '182382831',
              has_avatar: false
            }
          ]
        }
      ]
    };
  },
  computed: {
    splitedActions() {
      return this.actions.slice(0, 3);
    },
    loading() {
      return this.$store.state.loading['teams/get'];
    }
  },
  components: {
    Icon,
    Checkbox,
    UsersChips,
    Loader
  }
};
</script>
