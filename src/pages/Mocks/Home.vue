<template>
  <div class="page-content page-channels">
    <section class="card-section">
      <div class="container-fluid">
        <h4>Actions assigned to you</h4>

        <div class="row">
          <div class="col-md-3">
            <router-link class="card card-float" to="/channel">
              <div class="card-header">
                <h4>1 Champs-Élysées</h4>
                <ul class="card-nav">
                  <li>
                    <a><Icon family="far" name="ellipsis-h"/></a>
                  </li>
                </ul>
              </div>
              <div class="card-body">
                <ul class="actions-list">
                  <li><i class="bg-danger"></i> Review lease.pdf</li>
                  <li><i class="bg-danger"></i> Upload insurance contact</li>
                  <li class="more-actions">2 more actions..</li>
                </ul>

                <ul class="avatars-list">
                  <li>
                    <div
                      class="avatar"
                      style="background:url(https://i.imgur.com/LuoEx88.jpg)"
                    ></div>
                  </li>
                  <li>
                    <div
                      class="avatar"
                      style="background:url(https://i.imgur.com/qW8txv0.jpg)"
                    ></div>
                  </li>
                  <li>
                    <div
                      class="avatar"
                      style="background:url(https://i.imgur.com/d2a6CEC.jpg)"
                    ></div>
                  </li>
                  <li><div class="avatar">+2</div></li>
                </ul>
              </div>
            </router-link>
          </div>

          <div class="col-md-3">
            <router-link class="card card-float" to="/channel">
              <div class="card-header">
                <h4>85 Penny Lane</h4>
                <ul class="card-nav">
                  <li>
                    <a><Icon family="far" name="ellipsis-h"/></a>
                  </li>
                </ul>
              </div>
              <div class="card-body">
                <ul class="actions-list">
                  <li><i class="bg-danger"></i> Review lease.pdf</li>
                  <li><i class="bg-danger"></i> Upload insurance contact</li>
                  <li class="more-actions">2 more actions..</li>
                </ul>

                <ul class="avatars-list">
                  <li>
                    <div
                      class="avatar"
                      style="background:url(https://i.imgur.com/LuoEx88.jpg)"
                    ></div>
                  </li>
                  <li>
                    <div
                      class="avatar"
                      style="background:url(https://i.imgur.com/qW8txv0.jpg)"
                    ></div>
                  </li>
                  <li>
                    <div
                      class="avatar"
                      style="background:url(https://i.imgur.com/d2a6CEC.jpg)"
                    ></div>
                  </li>
                  <li><div class="avatar">+2</div></li>
                </ul>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="card-section">
      <div class="container-fluid">
        <h4>
          All channels
          <a class="inline-dropdown" href="#"
            >Sort by <Icon family="far" name="chevron-down"
          /></a>
        </h4>

        <div class="row">
          <div class="col-md-3">
            <div class="card card-float card-float--new">
              <div class="card-body">
                <Icon family="far" name="plus" />
                <p>Create New Channel</p>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <router-link class="card card-float" to="/channel">
              <div class="card-header">
                <h4>
                  113 Pecanwood <span class="badge badge-danger p-1">4</span>
                </h4>
                <ul class="card-nav">
                  <li class="mx-2">
                    <a><Icon family="fas" name="star"/></a>
                  </li>
                  <li>
                    <a><Icon family="far" name="ellipsis-h"/></a>
                  </li>
                </ul>
              </div>
              <div class="card-body">
                <ul class="details-list">
                  <li><Icon family="far" name="users" /> 7 members</li>
                  <li><Icon family="far" name="file" /> 3 files</li>
                  <li>
                    <Icon family="far" name="clock" /> Last updated 2 hours ago
                  </li>
                </ul>
              </div>
            </router-link>
          </div>

          <div class="col-md-3">
            <router-link class="card card-float" to="/channel">
              <div class="card-header">
                <h4>10 rue de la Paix</h4>
                <ul class="card-nav">
                  <li>
                    <a><Icon family="far" name="ellipsis-h"/></a>
                  </li>
                </ul>
              </div>
              <div class="card-body">
                <ul class="details-list">
                  <li><Icon family="far" name="users" /> 2 members</li>
                  <li><Icon family="far" name="file" /> 5 files</li>
                  <li>
                    <Icon family="far" name="clock" /> Last updated 5 hours ago
                  </li>
                </ul>
              </div>
            </router-link>
          </div>

          <div class="col-md-3">
            <router-link class="card card-float" to="/channel">
              <div class="card-header">
                <h4>1493 Main Avenue</h4>
                <ul class="card-nav">
                  <li>
                    <a><Icon family="far" name="ellipsis-h"/></a>
                  </li>
                </ul>
              </div>
              <div class="card-body">
                <ul class="details-list">
                  <li><Icon family="far" name="users" /> 7 members</li>
                  <li><Icon family="far" name="file" /> 3 files</li>
                  <li>
                    <Icon family="far" name="clock" /> Last updated 2 hours ago
                  </li>
                </ul>
              </div>
            </router-link>
          </div>

          <div class="col-md-3">
            <router-link class="card card-float" to="/channel">
              <div class="card-header">
                <h4>1493 Main Avenue</h4>
                <ul class="card-nav">
                  <li>
                    <a><Icon family="far" name="ellipsis-h"/></a>
                  </li>
                </ul>
              </div>
              <div class="card-body">
                <ul class="details-list">
                  <li><Icon family="far" name="users" /> 7 members</li>
                  <li><Icon family="far" name="file" /> 3 files</li>
                  <li>
                    <Icon family="far" name="clock" /> Last updated 2 hours ago
                  </li>
                </ul>
              </div>
            </router-link>
          </div>

          <div class="col-md-3">
            <router-link class="card card-float" to="/channel">
              <div class="card-header">
                <h4>1493 Main Avenue</h4>
                <ul class="card-nav">
                  <li>
                    <a><Icon family="far" name="ellipsis-h"/></a>
                  </li>
                </ul>
              </div>
              <div class="card-body">
                <ul class="details-list">
                  <li><Icon family="far" name="users" /> 7 members</li>
                  <li><Icon family="far" name="file" /> 3 files</li>
                  <li>
                    <Icon family="far" name="clock" /> Last updated 2 hours ago
                  </li>
                </ul>
              </div>
            </router-link>
          </div>

          <div class="col-md-3">
            <router-link class="card card-float" to="/channel">
              <div class="card-header">
                <h4>1493 Main Avenue</h4>
                <ul class="card-nav">
                  <li>
                    <a><Icon family="far" name="ellipsis-h"/></a>
                  </li>
                </ul>
              </div>
              <div class="card-body">
                <ul class="details-list">
                  <li><Icon family="far" name="users" /> 7 members</li>
                  <li><Icon family="far" name="file" /> 3 files</li>
                  <li>
                    <Icon family="far" name="clock" /> Last updated 2 hours ago
                  </li>
                </ul>
              </div>
            </router-link>
          </div>

          <div class="col-md-3">
            <router-link class="card card-float" to="/channel">
              <div class="card-header">
                <h4>1493 Main Avenue</h4>
                <ul class="card-nav">
                  <li>
                    <a><Icon family="far" name="ellipsis-h"/></a>
                  </li>
                </ul>
              </div>
              <div class="card-body">
                <ul class="details-list">
                  <li><Icon family="far" name="users" /> 7 members</li>
                  <li><Icon family="far" name="file" /> 3 files</li>
                  <li>
                    <Icon family="far" name="clock" /> Last updated 2 hours ago
                  </li>
                </ul>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import Icon from 'airsend/components/Icon.vue';

export default {
  name: 'Home',
  components: {
    Icon
  }
};
</script>
