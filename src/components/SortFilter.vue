<template>
  <div class="row">
    <div
      class="col-md-12 sort-filter justify-content-between align-items-center d-flex"
    >
      <span class="filter-title">
        <h5>{{ $t('general.channels') }}</h5>
      </span>

      <div class="d-flex flex-column flex-sm-row home-filter-options">
        <span class="filter-dropdown" @click.prevent.stop>
          <Popover placement="bottom-end">
            <span class="select-filter-title">
              <Icon family="fas" name="filter" />
              {{ $t('channels.filters.filter-by') }}
              <b>
                {{
                  $t(
                    findFilterLabelByValue(
                      'filterBy',
                      userPreferences.listing.filterBy
                    )
                  )
                }}
              </b>
              <Icon family="far" name="chevron-down" />
            </span>

            <template slot="popover">
              <div class="dropdown-items">
                <button
                  v-for="(filter, index) in filterOptions"
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  :key="index"
                  @click="onChangeFilter('filterBy', filter.value)"
                >
                  <Icon
                    :style="{
                      ['visibility']:
                        filter.value === userPreferences.listing.filterBy
                          ? 'visible'
                          : 'hidden'
                    }"
                    family="far"
                    name="check"
                  />
                  {{ $t(filter.label) }}
                </button>
              </div>
            </template>
          </Popover>
        </span>

        <span class="sort-dropdown ml-3">
          <Popover placement="bottom-end">
            <span class="select-filter-title">
              <Icon family="far" name="sort-amount-down" />
              {{ $t('channels.filters.sort-by') }}
              <b>{{
                $t(
                  findFilterLabelByValue(
                    'sortBy',
                    userPreferences.listing.sortBy
                  )
                )
              }}</b>
              <Icon family="far" name="chevron-down" />
            </span>

            <template slot="popover">
              <div class="dropdown-items">
                <button
                  v-for="(sort, index) in sortOptions"
                  v-close-popover
                  class="dropdown-item"
                  type="button"
                  :key="index"
                  @click="onChangeFilter('sortBy', sort.value)"
                >
                  <Icon
                    :style="{
                      ['visibility']: userPreferences.listing.sortBy.includes(
                        sort.value
                      )
                        ? 'visible'
                        : 'hidden'
                    }"
                    family="far"
                    name="check"
                  />
                  {{ $t(sort.label) }}
                </button>
              </div>
            </template>
          </Popover>
        </span>
      </div>
    </div>
  </div>
</template>
<script>
import Icon from 'airsend/components/Icon';
import Popover from 'airsend/components/Popover';
export default {
  data() {
    return {
      form: {},
      filterOptions: [
        { label: 'channels.filters.show-all', value: 'all' },
        { label: 'channels.filters.show-active', value: 'active' },
        { label: 'channels.filters.show-closed', value: 'closed' }
      ],
      sortOptions: [
        {
          label: 'channels.filters.most-recently-active',
          value: 'last_active_on_ts-desc'
        },
        { label: 'channels.filters.unread-count', value: 'unread_count-desc' },
        { label: 'channels.filters.new-channels', value: 'created_on_ts-desc' }
      ]
    };
  },
  computed: {
    userPreferences() {
      return this.$store.getters['core/getUserPreferences'];
    }
  },
  methods: {
    onChangeFilter(type, value) {
      this.form[type] = value;

      this.$store.dispatch('core/setUserPreference', {
        [`listing.${type}`]: value
      });
    },
    findFilterLabelByValue(type, filterValue) {
      if (type === 'filterBy') {
        return `channels.filters.${filterValue}`;
      } else if (type === 'sortBy') {
        return this.sortOptions.find(sort => filterValue.includes(sort.value))
          .label;
      }
    }
  },
  watch: {
    userPreferences: {
      immediate: true,
      deep: true,
      handler(preferences) {
        this.form.filterBy = preferences.listing.filterBy;
        this.form.sortBy = preferences.listing.sortBy[1];
      }
    }
  },
  components: {
    Icon,
    Popover
  }
};
</script>
