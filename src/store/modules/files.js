import Vue from 'vue';
import Vuex from 'vuex';

import { v4 as uuid } from 'uuid';
import sanitize from 'sanitize-filename';
import moment from 'moment';
import store from 'store';
import _ from 'lodash';

import router from '../../router';
import qs from 'query-string';

import {
  parseFile,
  asyncForEach,
  addDateDividers,
  retrieveFiles,
  getFileFromEntry,
  getEntriesFromFolder
} from 'airsend/utils';
import { transactionStatusPriority } from 'airsend/constants/transactionStatusPriority';
import { priorityQueue, queue } from 'async-es';

// import { parseMessages, parseMessageContent, parseReactions, relDiff, asyncForEach, parseFile, parseMessageAttachments } from 'airsend/utils';

import AirSend from 'airsend/client';

Vue.use(Vuex);

export default {
  namespaced: true,
  state: {
    // path based file listing
    files: {},
    paths: {},
    versions: {},
    progress: {},
    renaming: {},
    client: new AirSend(),
    media: {},
    docs: {},
    links: {},
    linksInfo: {},
    transactionsBar: {
      visible: false,
      expanded: false
    },
    transactions: [],
    filesContext: {
      itemsPerPage: 30,
      sort_by: 'name',
      search: '',
      gridView: store.get('settings.files.gridView') || false,
      type: ''
    },
    queue: queue(async (task, callback) => {
      await task();
      callback(true);
    }, 1)
  },
  mutations: {
    set: (state, { path, files }) => {
      Vue.set(state.files, path, files);
    },
    clearByPath: (state, path) => {
      const pathsToClear = _.filter(Object.keys(state.paths), o => {
        return o.startsWith(path);
      });

      for (var i = 0; i < pathsToClear.length; i++) {
        console.log('deleting', pathsToClear[i]);
        Vue.delete(state.paths, pathsToClear[i]);
        Vue.delete(state.files, pathsToClear[i]);
      }
    },
    setLinks: (state, { channel_id, links }) => {
      Vue.set(state.links, channel_id, links);
    },
    setMediaOrDocs: (state, payload) => {
      let { path, type, files } = payload;

      Vue.set(state[type], path, files);
    },
    appendFiles: (state, payload) => {
      let {
        path,
        type: type = 'files',
        files,
        before: before = false
      } = payload;

      let existingFiles = state[type][path];
      if (before) {
        // [new items] [items]
        Vue.set(state[type], path, files.concat(existingFiles));
        if (files.length < state.filesContext.itemsPerPage) {
          if (type === 'files') {
            Vue.set(state.paths[path], 'hasPageBefore', false);
          } else {
            Vue.set(state.paths[`${path}/${type}`], 'hasPageBefore', false);
          }
        }
      } else {
        // [items] [new items]
        Vue.set(state[type], path, existingFiles.concat(files));
        if (files.length < state.filesContext.itemsPerPage) {
          if (type === 'files') {
            Vue.set(state.paths[path], 'hasPageAfter', false);
          } else {
            Vue.set(state.paths[`${path}/${type}`], 'hasPageAfter', false);
          }
        }
      }
    },
    appendLinks: (state, payload) => {
      let { channel_id, links, before: before = false } = payload;

      let existingLinks = state.links[channel_id];

      if (before) {
        //TODO
      } else {
        Vue.set(state.links, channel_id, existingLinks.concat(links));
        if (links.length < state.filesContext.itemsPerPage) {
          Vue.set(state.linksInfo[channel_id], 'hasPageAfter', false);
        }
      }
    },
    setPath: (state, { path, data }) => {
      if (data.type) {
        Vue.set(state.paths, `${path}/${data.type}`, data);
      } else {
        Vue.set(state.paths, path, data);
      }
    },
    setLinksInfo: (state, { channel_id, data }) => {
      Vue.set(state.linksInfo, channel_id, data);
    },
    setVersions: (state, { path, versions }) => {
      Vue.set(state.versions, path, versions);
    },
    add: (state, payload) => {
      let filesContext = state.filesContext;

      //add in files
      const file = _.find(state.files[payload.parent], {
        fullpath: payload.fullpath
      });

      if (state.files[payload.parent] && !file) {
        if (filesContext.sort_by === 'updated_on' && filesContext.type === '') {
          //updated_on sort AND files
          state.files[payload.parent].unshift(payload);
        } else {
          let sortedFiles = _.cloneDeep(state.files[payload.parent]);
          sortedFiles.push(payload);
          sortedFiles = _.orderBy(
            sortedFiles,
            ['type', 'displayname'],
            ['desc', 'asc']
          );
          Vue.set(state.files, payload.parent, sortedFiles);
        }
      }

      //add in media
      if (payload.media) {
        const [
          beginOf,
          pathType,
          channelDir,
          ...finalPath
        ] = payload.fullpath.split('/');
        let rootPath = `/${pathType}/${channelDir}`;

        if (state.media[rootPath]) {
          const mediaFile = _.find(state.media[rootPath], {
            fullpath: payload.fullpath
          });

          if (!mediaFile) {
            state.media[rootPath].unshift(payload);
          }
        }
      }
    },
    remove: (state, { path, file, media }) => {
      const fileIndex = _.findIndex(state.files[path], { displayname: file });
      if (fileIndex > -1) {
        Vue.delete(state.files[path], fileIndex);
      }

      if (media) {
        const [beginOf, pathType, channelDir, ...finalPath] = path.split('/');
        let rootPath = `/${pathType}/${channelDir}`;
        const mediaIndex = _.findIndex(state.media[rootPath], {
          displayname: file
        });

        if (mediaIndex > -1) {
          Vue.delete(state.media[rootPath], mediaIndex);
        }
      }
    },
    updateFileMetadata(state, { payload, path, file }) {
      const fileIndex = _.findIndex(state.files[path], { displayname: file });

      if (fileIndex > -1) {
        let files = _.cloneDeep(state.files[path]);
        Object.keys(payload).forEach(key => {
          files[fileIndex][key] = payload[key];
          //Vue.set(state.files[path][fileIndex], key, payload[key]);
        });
        if (
          payload['displayname'] &&
          (state.filesContext.sort_by === 'name' ||
            state.filesContext.type === 'media')
        ) {
          files = _.orderBy(files, ['type', 'displayname'], ['desc', 'asc']);
        }
        Vue.set(state.files, path, files);
      }
    },
    update: (state, payload) => {
      const { fs_path, fs_name, file_size, media, previous_fs_name } = payload;
      let filesContext = state.filesContext;

      //update files
      const fileIndex = _.findIndex(state.files[fs_path], {
        displayname: previous_fs_name || fs_name
      });
      if (fileIndex >= 0) {
        let files = _.cloneDeep(state.files[fs_path]);
        let file = _.find(files, {
          fullpath: `${fs_path}/${previous_fs_name || fs_name}`
        });

        files.splice(fileIndex, 1);
        files.unshift({
          ...file,
          displayname: fs_name,
          fullpath: `${file.parent}/${fs_name}`,
          modificationts: moment().unix(),
          modification: moment.utc().format('YYYY-MM-DD HH:mm:ss')
        });
        if (filesContext.sort_by === 'name' || filesContext.type === 'media') {
          files = _.orderBy(files, ['type', 'displayname'], ['desc', 'asc']);
        }

        Vue.set(state.files, fs_path, files);
      }

      if (media) {
        //update media
        const [beginOf, pathType, channelDir, ...finalPath] = fs_path.split(
          '/'
        );
        let rootPath = `/${pathType}/${channelDir}`;

        const mediaIndex = _.findIndex(state.media[rootPath], {
          displayname: fs_name
        });
        if (mediaIndex >= 0) {
          let media = _.cloneDeep(state.media[rootPath]);
          let file = _.find(media, {
            fullpath: `${fs_path}/${fs_name}`
          });

          media.splice(mediaIndex, 1);
          media.unshift({
            ...file,
            size: file_size,
            modificationts: moment().unix(),
            modification: moment.utc().format('YYYY-MM-DD HH:mm:ss')
          });

          Vue.set(state.media, rootPath, media);
        }
      }
    },
    progress: (state, payload) => {
      const progress = payload.progress
        ? payload.progress
        : parseInt(Math.round((payload.loaded * 100) / payload.total));

      if (progress === 100) {
        Vue.delete(state.progress, payload.file);
      } else {
        Vue.set(state.progress, payload.file, {
          ...payload,
          progress: progress
        });
      }
    },
    renaming: (state, { path, renaming }) => {
      //path of new file
      if (renaming) {
        /*{
          from:
          to:
        }*/
        Vue.set(state.renaming, path, renaming);
      } else {
        Vue.delete(state.renaming, path);
      }
    },
    setContext: (state, payload) => {
      let { type, sort_by, sort_desc, search } = payload;

      if (type !== undefined) {
        Vue.set(state.filesContext, 'type', type || ''); // media, links, ''

        Vue.set(state.filesContext, 'in_depth', type === 'media' ? 1 : 0);

        Vue.set(
          state.filesContext,
          'sort_by',
          type === 'media' || type === 'links' ? 'updated_on' : 'name'
        );
      }

      if (sort_by !== undefined) {
        Vue.set(state.filesContext, 'sort_by', sort_by); // updated_on, name
      }

      if (sort_desc !== undefined) {
        Vue.set(state.filesContext, 'sort_desc', sort_desc); // boolean
      }

      if (search !== undefined) {
        Vue.set(state.filesContext, 'search', search);
      }
    },
    removePages: (state, { path, channel_id }) => {
      const hasMedia = !!state.paths[`${path}/media`];
      if (hasMedia) {
        if (
          state.media[path] &&
          state.media[path].length > state.filesContext.itemsPerPage
        ) {
          Vue.set(
            state.media,
            path,
            state.media[path].splice(0, state.filesContext.itemsPerPage)
          );
          Vue.set(state.paths, `${path}/media`, {
            ...state.paths[`${path}/media`],
            hasPageAfter: true
          });
        }
      }

      //links
      if (state.links[channel_id]) {
        Vue.delete(state.links, channel_id);
        Vue.delete(state.linksInfo, channel_id);
      }

      let paths = Object.keys(state.files).filter(p => p.indexOf(path) == 0); //Path starts with path of channel

      paths.forEach(p => {
        if (
          state.files[p] &&
          state.files[p].length > state.filesContext.itemsPerPage
        ) {
          Vue.set(
            state.files,
            p,
            state.files[p].splice(0, state.filesContext.itemsPerPage)
          );
          Vue.set(state.paths, p, { ...state.paths[p], hasPageAfter: true });
        }
      });
    },
    addTransaction: (state, payload) => {
      if (!state.transactionsBar.visible) {
        state.transactionsBar.visible = true;
        state.transactionsBar.expanded = true;
      }

      Vue.set(
        state,
        'transactions',
        state.transactions.concat({
          ...payload,
          status_priority: transactionStatusPriority[payload.status],
          added: moment().unix()
        })
      );
    },
    removeTransaction: (state, id) => {
      const index = _.findIndex(state.transactions, { id });
      Vue.delete(state.transactions, index);
    },

    setTransaction: (state, payload) => {
      const index = _.findIndex(state.transactions, { id: payload.id });

      if (index >= 0) {
        delete payload.id;

        Object.keys(payload).forEach(key => {
          Vue.set(state.transactions[index], key, payload[key]);
        });

        if (payload.status) {
          state.transactions[index].status_priority =
            transactionStatusPriority[payload.status];
        }
      }
    },
    setTransactionsBar: (state, { key, value }) => {
      Vue.set(state.transactionsBar, key, value);
    },
    handleLinkUpdate: (state, { message, attachment }) => {
      if (!state.links[message.channel_id]) return;

      let link_index = _.findIndex(
        state.links[message.channel_id],
        link =>
          link.message.id === message.id &&
          link.url_data.url === attachment.content.url
      );

      if (link_index === -1) {
        //new link
        let links = _.cloneDeep(state.links[message.channel_id]);
        links.unshift({
          id: uuid(),
          message,
          url_data: attachment.content
        });
        Vue.set(state.links, message.channel_id, links);
        return;
      }

      Vue.set(state.links[message.channel_id], link_index, {
        id: attachment.id,
        message,
        url_data: attachment.content
      });
    },
    clearFinishedTransactions: state => {
      const runningTransactions = _.filter(state.transactions, function(item) {
        return item.status === 'preparing' || item.status === 'processing';
      });
      Vue.set(state, 'transactions', runningTransactions);
    }
  },
  actions: {
    async setContext(context, payload) {
      context.commit('setContext', payload);
    },
    async getPage(context, { path, before = false }) {
      const { hash } = router.history.current.query;
      let filesContext = context.state.filesContext;

      let payload = {
        fspath: path,
        in_depth: filesContext.in_depth
      };

      if (filesContext.sort_by) {
        payload.sort_by = filesContext.sort_by;
      }

      if (filesContext.search) {
        payload.search = filesContext.search;
      }

      let files;
      if (filesContext.type === 'media') {
        files = context.state.media[path];
        payload.type = 'media';
      } else if (filesContext.type === 'docs') {
        files = context.state.docs[path];
        payload.type = 'docs';
      } else {
        files = context.state.files[path];
      }

      if (before) {
        payload.cursor = files[0].fullpath;
        payload.limit_before = filesContext.itemsPerPage;
        context.commit(
          'loading/set',
          { endpoint: 'file.list/loading-before', status: true },
          { root: true }
        );
      } else {
        payload.cursor = files[files.length - 1].fullpath;
        payload.limit_after = filesContext.itemsPerPage;
        context.commit(
          'loading/set',
          { endpoint: 'file.list/loading-after', status: true },
          { root: true }
        );
      }

      let response = await context.state.client.get(
        'file.list',
        payload,
        hash ? hash : false
      );

      if (response.ok) {
        context.commit('appendFiles', {
          path,
          files: response.data.files,
          type: filesContext.type || 'files',
          before
        });
      } else {
        this.commit('core/addToast', {
          id: 'file.getPage',
          content: { message: 'files.toasts.file-get-error', i18n: { path } },
          icon: 'file-alt',
          contentType: 'text',
          type: 'danger',
          timeout: 4000,
          close: true
        });
      }

      context.commit(
        'loading/set',
        { endpoint: 'file.list/loading-before', status: false },
        { root: true }
      );
      context.commit(
        'loading/set',
        { endpoint: 'file.list/loading-after', status: false },
        { root: true }
      );
    },
    async get(context, { path, filesContext, force = false }) {
      if (!filesContext) filesContext = _.clone(context.state.filesContext);

      //try to get files already in memory
      if (!force) {
        let _files = [];
        let pathInfo;

        if (filesContext.type === '') {
          _files = context.state.files && context.state.files[path];
          pathInfo = context.getters['getPathInfo'](path);
        } else if (filesContext.type === 'media') {
          _files = context.state.media && context.state.media[path];
          pathInfo = context.state.paths[`${path}/media`];
        }
        if (
          _files &&
          _files.length > 0 &&
          pathInfo &&
          filesContext.sort_by === pathInfo.sorting_by &&
          filesContext.search === pathInfo.search &&
          !pathInfo.needsRefresh
        ) {
          return;
        }
      }

      // check public hash
      const { hash } = router.history.current.query;

      let payload = {
        fspath: path,
        in_depth: filesContext.in_depth,
        limit_after: filesContext.limit_after
      };

      if (filesContext.type === 'media') {
        payload.type = 'media';
      }

      if (filesContext.sort_by) {
        payload.sort_by = filesContext.sort_by;
      }

      if (filesContext.search) {
        payload.search = filesContext.search;
      }

      context.commit(
        'loading/set',
        {
          endpoint: `file.list/loading-${path}-${filesContext.type}`,
          status: true
        },
        { root: true }
      );

      let response = await context.state.client.get(
        'file.list',
        payload,
        hash ? hash : false
      );

      context.commit(
        'loading/set',
        {
          endpoint: `file.list/loading-${path}-${filesContext.type}`,
          status: false
        },
        { root: true }
      );

      if (response.ok) {
        if (filesContext.type === '') {
          context.commit('set', {
            path: path,
            files: response.data.files
          });

          context.commit('setPath', {
            path: path,
            data: {
              canupload: response.data.canupload,
              cancreatefolder: response.data.cancreatefolder,
              total: response.data.total,
              hasPageBefore: false,
              hasPageAfter: response.data.total >= filesContext.itemsPerPage,
              sorting_by: filesContext.sort_by,
              search: filesContext.search,
              search: filesContext.search
            }
          });
        } else if (
          filesContext.type === 'media' ||
          filesContext.type === 'docs'
        ) {
          context.commit('setMediaOrDocs', {
            path: path,
            type: filesContext.type,
            files: response.data.files
          });

          context.commit('setPath', {
            path: path,
            data: {
              canupload: false,
              cancreatefolder: false,
              total: response.data.total,
              hasPageBefore: false,
              hasPageAfter: response.data.total >= filesContext.itemsPerPage,
              sorting_by: filesContext.sort_by,
              search: filesContext.search,
              type: filesContext.type
            }
          });
        }
      } else {
        // TODO: Handle API of or other possible errors
        this.commit('core/addToast', {
          id: 'file.get',
          content: { message: 'files.toasts.file-get-error', i18n: { path } },
          icon: 'file-alt',
          contentType: 'text',
          type: 'danger',
          timeout: 4000,
          close: true
        });
      }
    },
    async getPageLinks(context, { channel_id, before = false }) {
      let filesContext = _.clone(context.state.filesContext);
      const { hash } = router.history.current.query;

      let payload = {
        channel_id,
        limit_after: filesContext.itemsPerPage
      };
      let links = context.state.links[channel_id];

      if (before) {
        //todo
      } else {
        payload.cursor = links[links.length - 1].id;
        context.commit(
          'loading/set',
          { endpoint: 'links.list/loading-after', status: true },
          { root: true }
        );
      }

      let response = await context.state.client.get(
        'channel.links',
        payload,
        hash ? hash : false
      );

      context.commit(
        'loading/set',
        { endpoint: 'links.list/loading-after', status: false },
        { root: true }
      );

      if (response.ok) {
        context.commit('appendLinks', {
          channel_id,
          links: response.data.links,
          before
        });
      } else {
        this.commit('core/addToast', {
          id: 'links.getPage',
          content: { message: 'links.toasts.links-get-error' },
          channel_id,
          icon: 'file-alt',
          contentType: 'text',
          type: 'danger',
          timeout: 4000,
          close: true
        });
      }
    },
    async getLinks(context, channel_id) {
      let filesContext = _.clone(context.state.filesContext);
      const { hash } = router.history.current.query;
      let payload = {
        channel_id,
        limit_after: filesContext.itemsPerPage
      };

      if (filesContext.search) {
        payload.search = filesContext.search;
      }

      context.commit(
        'loading/set',
        { endpoint: 'links.list/loading', status: true },
        { root: true }
      );
      let response = await context.state.client.get(
        'channel.links',
        payload,
        hash ? hash : false
      );
      context.commit(
        'loading/set',
        { endpoint: 'links.list/loading', status: false },
        { root: true }
      );

      if (response.ok) {
        context.commit('setLinks', {
          channel_id,
          links: response.data.links || []
        });

        context.commit('setLinksInfo', {
          channel_id,
          data: {
            hasPageBefore: false,
            hasPageAfter:
              response.data.links.length >= filesContext.itemsPerPage,
            sorting_by: filesContext.sort_by,
            search: filesContext.search
          }
        });
      } else {
        this.commit('core/addToast', {
          id: 'links.getPage',
          content: { message: 'links.toasts.links-get-error' },
          channel_id,
          icon: 'file-alt',
          contentType: 'text',
          type: 'danger',
          timeout: 4000,
          close: true
        });
      }
    },
    async removePages(context, payload) {
      context.commit('removePages', payload);
    },

    async versions(context, path) {
      // prevent getting path again
      let response = await context.state.client.get('file.versions', {
        fspath: path
      });

      if (response.ok) {
        context.commit('setVersions', {
          path: path,
          versions: response.data.file
        });
      } else {
        let name = path.slice(path.lastIndexOf('/') + 1);
        this.commit('core/addToast', {
          id: 'file.versions',
          content: {
            message: 'files.toasts.file-version-error',
            i18n: { name }
          },
          channel_id,
          icon: 'file-alt',
          contentType: 'text',
          type: 'danger',
          timeout: 4000,
          close: true
        });
      }

      return response;
    },

    async download(context, { name, path, version, type }) {
      var link = document.createElement('a');

      // check if page has public hash
      const { hash } = router.history.current.query;
      const token = hash ? hash : this.state.core.user.token;

      const isFolder = type && type === 'folder';
      let isCancelled = false;

      let transaction = {
        id: uuid(),
        size: 0,
        status: 'processing',
        name: isFolder ? `${name}.zip` : name,
        type: isFolder ? 'download-zip' : 'download',
        progress: isFolder ? null : 0,
        file_type: isFolder ? 'folder' : 'file',
        message: {
          key: 'files.transactions-messages.download-success',
          i18n: { name: isFolder ? `${name}.zip` : name }
        },
        file: path
      };
      context.commit('addTransaction', transaction);

      //prepare payload and download file
      let params = {
        fspath: path,
        token
      };
      if (version) {
        params.versionid = version;
      }

      let response;

      if (isFolder) {
        response = await context.state.client.getBlob(
          'file.zip',
          params,
          (e, source) => {
            context.commit('setTransaction', {
              id: transaction.id,
              size: e.loaded
            });

            // watch to check if it's cancelled
            const index = _.findIndex(context.state.transactions, {
              id: transaction.id
            });
            const currentTransaction = context.state.transactions[index];
            if (
              !currentTransaction ||
              currentTransaction.status === 'interrupted'
            ) {
              source.cancel('request cancelled by user');
              isCancelled = true;
            }
          }
        );
      } else {
        response = await context.state.client.getBlob(
          'file.download',
          params,
          (e, source) => {
            const progress = parseInt(Math.round((e.loaded * 100) / e.total));

            context.commit('setTransaction', {
              id: transaction.id,
              size: e.total,
              progress
            });

            // watch to check if it's cancelled
            const index = _.findIndex(context.state.transactions, {
              id: transaction.id
            });
            const currentTransaction = context.state.transactions[index];
            if (
              !currentTransaction ||
              currentTransaction.status === 'interrupted'
            ) {
              source.cancel('request cancelled by user');
              isCancelled = true;
            }
          }
        );
      }

      if (response.ok && !isCancelled) {
        context.commit('setTransaction', {
          id: transaction.id,
          status: 'completed',
          progress: 100
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        link.href = url;
        link.setAttribute('download', isFolder ? `${name}.zip` : name);
        // link.addEventListener("click", e => {
        //   e.stopPropagation();
        // });
        //document.body.appendChild(link); //we can simply not append the element in the DOM
        link.click();
        link.remove();
      } else if (!response.ok && !isCancelled) {
        // update
        context.commit('setTransaction', {
          id: transaction.id,
          status: 'failed',
          message: {
            key: 'files.transactions-messages.download-error',
            i18n: { name: transaction.name }
          }
        });

        // expand bar
        context.commit('setTransactionsBar', {
          key: 'expanded',
          value: true
        });
      }
    },

    async share(context, path) {
      const response = await context.state.client.post('file.link.create', {
        fspath: path
      });

      return response;
    },

    async unshare(context, path) {
      const response = await context.state.client.post('file.link.delete', {
        fspath: path
      });

      return response;
    },

    async delete(context, { name, path, type }) {
      let transaction = {
        id: uuid(),
        type: 'delete',
        status: 'processing',
        name,
        file_type: type === 'folder' ? 'folder' : 'file',
        message: {
          key: 'files.transactions-messages.delete-success',
          i18n: { name }
        },
        file: path
      };
      context.commit('addTransaction', transaction);
      context.state.queue.push(async () => {
        const response = await context.state.client.post('file.delete', {
          fspath: `${path}/${name}`
        });

        if (response.ok) {
          context.commit('remove', { path: path, file: name });

          context.commit('setTransaction', {
            id: transaction.id,
            status: 'completed'
          });
        } else {
          context.commit('setTransaction', {
            id: transaction.id,
            status: 'failed',
            message: {
              key: 'files.transactions-messages.delete-error',
              i18n: { name }
            }
          });
        }
      });
    },

    async move(context, { from, to, file, type }) {
      if (to.startsWith(`${from}/${file}`)) return; //prevent folder to be moved to inside itself

      const [beginOf, pathType, channelDir, ...finalPath] = to.split('/');
      const { query } = router.history.current;
      const channelId = router.history.current.params.id;
      router
        .push(
          `/channel/${channelId}/files/${finalPath.join('/')}${
            query ? `?${qs.stringify(query)}` : ''
          }`
        )
        .catch(() => {});

      let transaction = {
        id: uuid(),
        type: 'move',
        status: 'processing',
        name: file,
        file_type: type === 'folder' ? 'folder' : 'file',
        message: {
          key: 'files.transactions-messages.move-success',
          i18n: { to: finalPath.join('/') || '/' }
        },
        file: `${to}/${file}`
      };
      context.commit('addTransaction', transaction);

      context.state.queue.push(async () => {
        const response = await context.state.client.post('file.move', {
          fsfrompath: `${from}/${file}`,
          fstopath: `${to}/${file}`
        });

        if (response.ok) {
          context.commit('remove', { path: from, file });

          context.commit('setTransaction', {
            id: transaction.id,
            status: 'completed'
          });
        } else {
          context.commit('setTransaction', {
            id: transaction.id,
            status: 'failed',
            message: {
              key: 'files.transactions-messages.move-error',
              i18n: { name: file }
            },
            file: `${from}/${file}`
          });
        }
      });
    },

    async copy(context, { from, to, file }) {
      if (to.startsWith(`${from}/${file}`)) return; //prevent folder to be copied to inside itself

      const [beginOf, pathType, channelDir, ...finalPath] = to.split('/');
      const { query } = router.history.current;
      const channelId = router.history.current.params.id;
      router
        .push(
          `/channel/${channelId}/files/${finalPath.join('/')}${
            query ? `?${qs.stringify(query)}` : ''
          }`
        )
        .catch(() => {});

      let transaction = {
        id: uuid(),
        type: 'copy',
        status: 'processing',
        name: file,
        file_type: context.getters.getFileByPath(`${from}/${file}`).type,
        message: {
          key: 'files.transactions-messages.copy-success',
          i18n: { to: finalPath.join('/') || '/' }
        },
        file: `${to}/${file}`
      };
      context.commit('addTransaction', transaction);

      const response = await context.state.client.post('file.copy', {
        fsfrompath: `${from}/${file}`,
        fstopath: `${to}/${file}`
      });

      if (response.ok) {
        context.commit('setTransaction', {
          id: transaction.id,
          status: 'completed'
        });
      } else {
        context.commit('setTransaction', {
          id: transaction.id,
          status: 'failed',
          message: {
            key: 'files.transactions-messages.copy-error',
            i18n: { name: file }
          },
          file: `${from}/${file}`
        });
      }
    },

    async rename(context, { from, to, path }) {
      //transaction
      let transaction = {
        id: uuid(),
        type: 'rename',
        status: 'processing',
        name: from,
        file_type: context.getters.getFileByPath(`${path}/${from}`).type,
        message: {
          key: 'files.transactions-messages.rename-success',
          i18n: { to }
        },
        file: `${path}/${to}`
      };
      context.commit('addTransaction', transaction);

      const destinationItem = context.getters.getFileInPath({ path, file: to });
      if (destinationItem) {
        context.commit('setTransaction', {
          id: transaction.id,
          status: 'failed',
          message: {
            key: 'files.transactions-messages.rename-already-exists-error',
            i18n: { to }
          },
          file: `${path}/${from}`
        });
        return;
      }

      const backupItem = context.getters.getFileInPath({ path, file: from });
      context.commit('renaming', {
        path: `${path}/${to}`,
        renaming: { from: `${path}/${from}`, to: `${path}/${to}` }
      });

      //instant feedback in UI
      context.commit('updateFileMetadata', {
        payload: {
          displayname: to,
          name: to,
          fullpath: `${path}/${to}`,
          modification: moment.utc().format('YYYY-MM-DD HH:mm:ss')
        },
        path,
        file: from
      });

      const response = await context.state.client.post('file.move', {
        fsfrompath: `${path}/${from}`,
        fstopath: `${path}/${to}`
      });

      if (response.ok) {
        const renamedItem = await context.state.client.get('file.info', {
          fspath: `${path}/${to}`
        });

        context.commit('updateFileMetadata', {
          payload: renamedItem.data,
          path,
          file: from
        });

        context.commit('setTransaction', {
          id: transaction.id,
          status: 'completed'
        });
      } else {
        context.commit('updateFileMetadata', {
          payload: backupItem,
          path,
          file: to
        });

        context.commit('setTransaction', {
          id: transaction.id,
          status: 'failed',
          message: {
            key: 'files.transactions-messages.rename-error',
            i18n: { name: from }
          },
          file: `${path}/${from}`
        });
      }

      context.commit('renaming', { path: `${path}/${to}`, renaming: false });

      return response;
    },

    async info(context, path) {
      // check public hash
      const { hash } = router.history.current.query;

      return await context.state.client.get(
        'file.info',
        { fspath: path },
        hash ? hash : false
      );
    },

    // upload multiple files
    async upload(context, payload) {
      let request = null;
      let hasUploadFailed = false;

      let uploadQueue = priorityQueue(async (task, callback) => {
        //one queue for each `upload` instance
        await task();
        callback(true);
      }, 1);

      let files = [];
      let folders = [];

      await Promise.all(
        payload.files.map(async entry => {
          if (entry instanceof DataTransferItem)
            entry = entry.webkitGetAsEntry();

          if (entry.isFile || entry instanceof File) {
            let file =
              entry instanceof File ? entry : await getFileFromEntry(entry);

            files.push(file);
          } else {
            folders.push(entry);
          }
        })
      );

      files = await retrieveFiles(files); //rich files, with thumb

      // map and chunk files
      files = await Promise.all(
        files.map(async file => {
          const fileSize = file.size / 1000 / 1000; // file size in mb
          const fileName = sanitize(file.name);

          context.commit('add', {
            creation: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
            displayname: fileName,
            thumb: file.thumb,
            ext: 'htm',
            flags: '',
            fullpath: `${payload.path}/${fileName}`,
            modification: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
            name: fileName,
            parent: payload.path,
            size: file.size,
            type: 'file',
            progress: 0,
            candownload: true,
            canmove: true,
            candelete: true
          });

          let transaction = {
            id: uuid(),
            type: 'upload',
            progress: 0,
            status: 'processing',
            name: file.name,
            size: file.size,
            file_type: 'file',
            file: `${payload.path}/${fileName}`,
            message: {
              key: 'files.transactions-messages.upload-success',
              i18n: { name: fileName }
            }
          };

          if (fileSize > 10) {
            return { data: parseFile(file), transaction };
          } else {
            return { data: file, transaction };
          }
        })
      );

      //map folders
      folders = await Promise.all(
        folders.map(async folder => {
          const transaction = {
            id: uuid(),
            type: 'upload',
            progress: 0,
            status: 'preparing',
            name: folder.name,
            file_type: 'folder',
            file: `${payload.path}/${folder.name}`,
            message: {
              key: 'files.transactions-messages.upload-success',
              i18n: { name: folder.name }
            }
          };

          return {
            folder,
            transaction
          };
        })
      );

      // send files one at the time, with higher priority than folder upload
      files.forEach(element => {
        context.commit('addTransaction', element.transaction);

        uploadQueue.push(async () => {
          let file = element.data;
          let isFailed = false;
          let isCancelled = false;

          // if it's a single file
          if (file instanceof File) {
            // send single file

            request = await context.state.client.postMultipart(
              'file.upload',
              {
                file: file
              },
              {
                params: {
                  fspath: payload.path
                },
                onUploadProgress: (e, source) => {
                  const progress = parseInt(
                    Math.round((e.loaded * 100) / e.total)
                  );

                  context.commit('progress', {
                    file: `${payload.path}/${file.name}`,
                    total: e.total,
                    loaded: e.loaded
                  });

                  context.commit('setTransaction', {
                    id: element.transaction.id,
                    progress
                  });

                  // watch to check if it's cancelled
                  const index = _.findIndex(context.state.transactions, {
                    id: element.transaction.id
                  });
                  const currentTransaction = context.state.transactions[index];
                  if (
                    !currentTransaction ||
                    currentTransaction.status === 'interrupted'
                  ) {
                    source.cancel('request cancelled by user');
                    isCancelled = true;
                    hasUploadFailed = true;
                  }
                }
              }
            );

            if (request.ok && !isCancelled) {
              context.commit('progress', {
                file: `${payload.path}/${file.name}`,
                progress: 100
              });

              context.commit('setTransaction', {
                id: element.transaction.id,
                progress: 100,
                status: 'completed'
              });
            } else if (!isCancelled) {
              hasUploadFailed = true;

              // update
              context.commit('setTransaction', {
                id: element.transaction.id,
                status: 'failed',
                message: {
                  key: 'files.transactions-messages.upload-error',
                  i18n: { name: transaction.name }
                }
              });

              // expand bar
              context.commit('setTransactionsBar', {
                key: 'expanded',
                value: true
              });
            }
          }

          //large files
          else {
            let isFailed = false;
            await asyncForEach(file, async (chunk, index) => {
              if (isCancelled) return;
              // chunk progress
              const mainPercent = parseInt(
                Math.round((index * 100) / file.length - 1)
              );

              // send chunks
              request = await context.state.client.postMultipart(
                'file.upload',
                {
                  file: chunk
                },
                {
                  params: {
                    fspath: payload.path,
                    start: index * (1000 * 1000 * 10), // TODO: add chunk size into variable
                    complete: index === file.length - 1 ? 1 : 0
                  },
                  onUploadProgress: (e, source) => {
                    const actualUploadProgress = parseInt(
                      Math.round((e.loaded * 100) / e.total)
                    );
                    const progress =
                      mainPercent + (actualUploadProgress / file.length - 1);

                    if (progress > 0) {
                      context.commit('progress', {
                        file: `${payload.path}/${file[0].name}`,
                        progress: progress,
                        loaded: e.loaded
                      });
                      context.commit('setTransaction', {
                        id: element.transaction.id,
                        progress
                      });
                    }

                    // watch to check if it's cancelled
                    const index = _.findIndex(context.state.transactions, {
                      id: element.transaction.id
                    });
                    const currentTransaction =
                      context.state.transactions[index];
                    if (
                      !currentTransaction ||
                      currentTransaction.status === 'interrupted'
                    ) {
                      source.cancel('request cancelled by user');
                      isCancelled = true;
                      hasUploadFailed = true;
                      return;
                    }
                  }
                }
              );
              if (!request.ok) {
                isFailed = true;
                hasUploadFailed = true;
              }
            });

            if (!isFailed && !isCancelled) {
              context.commit('progress', {
                file: `${payload.path}/${file[0].name}`,
                progress: 100
              });

              context.commit('setTransaction', {
                id: element.transaction.id,
                progress: 100,
                status: 'completed'
              });
            } else if (!isCancelled) {
              // update
              context.commit('setTransaction', {
                id: element.transaction.id,
                status: 'failed',
                message: {
                  key: 'files.transactions-messages.upload-error',
                  i18n: { name: element.transaction.name }
                }
              });

              // expand bar
              context.commit('setTransactionsBar', {
                key: 'expanded',
                value: true
              });
            }
          }
        }, 0);
      });

      //upload folders, one at the time with a lower priority than file upload
      for (let i = 0; i < folders.length; i++) {
        const element = folders[i];
        let { folder, transaction } = element;

        const entries = await getEntriesFromFolder(folder);
        if (entries.length)
          transaction.message = {
            key: 'files.transactions-messages.upload-process-items-folder',
            i18n: { count: entries.length }
          };
        else transaction.status = 'processing';

        context.commit('addTransaction', transaction);

        uploadQueue.push(async () => {
          const index = _.findIndex(context.state.transactions, {
            id: transaction.id
          });
          const currentTransaction = context.state.transactions[index];
          if (
            !currentTransaction ||
            currentTransaction.status === 'interrupted'
          ) {
            hasUploadFailed = true;
            return;
          }

          const response = await context.state.client.post('file.create', {
            fsparent: payload.path,
            fsname: folder.name
          });

          if (response.ok) {
            context.commit('removeTransaction', transaction.id);
          } else {
            context.commit('setTransaction', {
              id: transaction.id,
              status: 'failed',
              message: {
                key: 'files.transactions-messages.upload-error',
                i18n: { name: folder.name }
              }
            });
            hasUploadFailed = true;
            return;
          }

          if (entries.length) {
            let entriesUploads = await context.dispatch('upload', {
              files: entries,
              path: `${payload.path}/${folder.name}`
            });
            if (!entriesUploads.ok) hasUploadFailed = true;
          }
        }, 1);
      }

      await uploadQueue.drain();

      return {
        ...request,
        ok: !hasUploadFailed
      };
    },

    async createFolder(context, payload) {
      const response = await context.state.client.post('file.create', payload);

      if (response.ok) {
        this.commit('core/addToast', {
          id: 'file.create',
          content: { message: 'files.toasts.folder-create-success' },
          contentType: 'text',
          type: 'primary',
          close: true,
          timeout: 4000
        });
      } else {
        this.commit('core/addToast', {
          id: 'file.create',
          content: { message: 'files.toasts.folder-create-error' },
          contentType: 'text',
          type: 'error',
          close: true,
          timeout: 4000
        });
      }

      return response;
    },

    refreshPath(context, { path, filesContext }) {
      if (!filesContext) filesContext = _.clone(context.state.filesContext);
      if (filesContext.type == 'media') {
        const [beginOf, pathType, channelDir, ...finalPath] = path.split('/');
        let rootPath = `/${pathType}/${channelDir}`;

        context.dispatch('get', { path: rootPath, filesContext, force: true });
      } else if (filesContext.type == '') {
        //files
        context.dispatch('get', { path: path, filesContext, force: true });
      }
    },

    onFileUpdated(context, payload) {
      let {
        channel_id,
        fs_name,
        resource,
        user_id,
        fs_path,
        media,
        previous_path
      } = payload;
      let filesContext = _.cloneDeep(context.state.filesContext);
      console.log('file updated', payload);
      /*
      channel_id: 11010019
      fs_name: "Pizigani_1367_Chart_10MB.jpg"
      fs_path: "/wf/10058/Pizigani_1367_Chart_10MB.jpg"
      previous_path: "/wf/10058/attachments/Pizigani_1367_Chart_10MB.jpg"
      resource: {type: "wiki", location: "/wf/10058"}
      user_id: 91010004
      */

      //remove file name from path
      fs_path = fs_path.split('/');
      fs_path.splice(-1, 1);
      fs_path = fs_path.join('/');

      previous_path = previous_path.split('/');
      let [previous_fs_name] = previous_path.splice(-1, 1);
      previous_path = previous_path.join('/');

      if (fs_path === previous_path) {
        //file updated
        if (filesContext.search !== '') {
          //if searching, ask for refresh
          context.commit('setPath', {
            path: fs_path,
            data: {
              ...context.getters['getPathInfo'](fs_path),
              needsRefresh: true
            }
          });
        } else {
          context.commit('update', { ...payload, previous_fs_name, fs_path });
          const extensionIndex = previous_fs_name.lastIndexOf('.');
          if (extensionIndex === -1) {
            console.log(
              'deleting folder',
              `${previous_path}/${previous_fs_name}`
            );
            context.commit(
              'clearByPath',
              `${previous_path}/${previous_fs_name}`
            );
          }
        }
      } else {
        //file moved
        let originalFile = _.find(context.state.files[previous_path], {
          fullpath: `${previous_path}/${previous_fs_name}`
        });

        if (originalFile) {
          context.dispatch('onFileAdded', {
            ...payload,
            fs_path,
            type: originalFile.type,
            is_new: true,
            file_size: originalFile.size
          });
        } else {
          context.commit('setPath', {
            path: fs_path,
            data: {
              ...context.getters['getPathInfo'](fs_path),
              needsRefresh: true
            }
          });
        }

        context.dispatch('onFileDeleted', {
          channel_id,
          fs_name,
          fs_path: previous_path,
          user_id,
          media
        });
      }

      // if(context.rootState.core.user.id != user_id){ //add toast if event comes from a different user
      // let filesContext = _.cloneDeep(context.state.filesContext)
      // let toast = {
      //   id: `file-added-${fs_name}`,
      //   content: {message: "files.toasts.event-file-new-file", i18n:{name: fs_name, path:`${fs_path}/${fs_name}`}},
      //   user_id,
      //   channel_id,
      //   sidebar: true,
      //   icon: "file-alt",
      //   contentType: 'text',
      //   type: 'primary',
      //   timeout: 4000,
      //   close: true,
      // }
      //this.commit('core/addToast', toast);
      //}

      // if it's wiki, refresh
      if (
        (resource && resource.type === 'wiki') ||
        fs_path.indexOf('/wf/' == 0)
      ) {
        // if file is loaded in memory, refresh it
        if (this.state.wiki.channels[channel_id][fs_name]) {
          this.dispatch('wiki/browse', {
            channelId: channel_id,
            file: fs_name
          });
        }
      }
    },

    onFileCopied(context, payload) {
      let {
        channel_id,
        fs_name,
        fs_path,
        user_id,
        media,
        previous_path
      } = payload;
      let original_path = previous_path.split('/');
      const [original_fs_name] = original_path.splice(-1, 1);
      original_path = original_path.join('/');

      fs_path = fs_path.split('/');
      fs_path.splice(-1, 1);
      fs_path = fs_path.join('/');

      let originalFile = _.find(context.state.files[original_path], {
        fullpath: previous_path
      });

      if (originalFile) {
        context.dispatch('onFileAdded', {
          ...payload,
          fs_path,
          type: originalFile.type,
          is_new: true,
          file_size: originalFile.size
        });
      } else {
        context.commit('setPath', {
          path: fs_path,
          data: {
            ...context.getters['getPathInfo'](fs_path),
            needsRefresh: true
          }
        });
      }
    },

    onFileAdded(
      context,
      { channel_id, fs_name, fs_path, file_size, user_id, media, type, is_new }
    ) {
      /*
      channel_id: 11010054
      file_size: 113984
      fs_name: "2016-07-20-3G0A6429.jpg"
      fs_path: "/cf/10162"
      resource: {type: "files", location: "/cf/10162"}
      user_id: 91010004,
      is_new: true //false when it is a new version of the file, but the file already exists
      */

      if (!is_new) {
        context.commit('remove', { path: fs_path, file: fs_name, media });
      }

      let filesContext = _.cloneDeep(context.state.filesContext);

      if (filesContext.search !== '') {
        //if searching, ask for refresh
        context.commit('setPath', {
          path: fs_path,
          data: {
            ...context.getters['getPathInfo'](fs_path),
            needsRefresh: true
          }
        });
      } else {
        //add the file/folder
        const channel = this.getters['channels/getChannelById'](channel_id);

        context.commit('add', {
          creation: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
          displayname: fs_name,
          fullpath: `${fs_path}/${fs_name}`,
          modification: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
          modificationts: moment().unix(),
          name: fs_name,
          parent: fs_path,
          size: file_size,
          type,
          candownload: true,
          canmove: true,
          candelete: true,
          media
        });

        this.commit('channels/update', {
          id: channel_id,
          total_file_count: channel.total_file_count + 1
        });
      }
    },

    onFileDeleted(context, { channel_id, fs_name, fs_path, user_id, media }) {
      console.log('onFileDeleted');
      /*
      channel_id: 11010058
      file_size: 0
      fs_name: ""
      fs_path: "/cf/10174/teens-2.jpeg"
      resource: {type: "files", location: "/cf/10174/teens-2.jpeg"}
      user_id: 91010004
      */

      context.commit('remove', { path: fs_path, file: fs_name, media });

      // if(context.rootState.core.user.id != user_id){ //add toast if event comes from a different user
      //   this.commit('core/addToast', {
      //     id: `file-deleted-${fs_path}`,
      //     content: {message: "files.toasts.event-file-deleted", i18n:{path: fs_path}},
      //     user_id: user_id,
      //     sidebar: true,
      //     icon: "file-alt",
      //     type: 'primary',
      //     close: true,
      //   });
      // }
    }
  },
  getters: {
    getFilesInPath: state => path => {
      let files = state.files[path] || [];
      if (!files || files.length === 0) return [];

      files = files.map(file => {
        return {
          ...file,
          component: file.type === 'folder' ? 'Folder' : 'GenericFile'
        };
      });
      return files;
    },
    getPathInfo: state => path => {
      return state.paths[path]
        ? state.paths[path]
        : { canupload: false, cancreatefolder: false };
    },
    getLinksInfo: state => channel_id => {
      return state.linksInfo[channel_id] || {};
    },
    getFileInPath: state => payload => {
      const { path, file } = payload;

      const fileIndex = _.findIndex(state.files[path], { displayname: file });

      if (fileIndex > -1) {
        return { ...state.files[path][fileIndex] };
      }
      return null;
    },
    getMediaInPath: state => path => {
      let files = state.media[path] || [];
      if (!files || files.length === 0) return [];

      files = files.map(file => {
        return {
          ...file,
          component: file.type === 'folder' ? 'Folder' : 'GenericFile'
        };
      });
      if (state.filesContext.sort_by === 'updated_on')
        return addDateDividers('modification', files);
      return files;
    },
    getLinksInChannel: state => channel_id => {
      let links = state.links[channel_id] || [];
      if (!links || links.length === 0) return [];

      links = links.map(link => {
        return {
          ...link,
          created_on: link.message.created_on,
          component: 'Link'
        };
      });
      if (state.filesContext.sort_by === 'updated_on')
        return addDateDividers('created_on', links);
      return links;
    },

    getTransactions: state => () => {
      const transactions = _.orderBy(
        state.transactions,
        ['status_priority', 'added'],
        ['desc', 'desc']
      );
      return transactions;
    },

    getRunningTransactions: state => () => {
      const transactions = _.orderBy(
        state.transactions,
        ['status_priority', 'progress'],
        ['desc', 'desc']
      );
      const runningTransactions = _.filter(transactions, function(item) {
        return item.status === 'preparing' || item.status === 'processing';
      });
      return runningTransactions;
    },

    getTransactionByFileName: state => name => {
      //this getter is used when electron sends a `download-completed` event. This function returns a transaction for the file.
      //Files with `downloadPath` property were already defined from previous events.
      return _.find(
        state.transactions,
        transaction =>
          transaction.name === name &&
          transaction.downloadPath === undefined &&
          (transaction.type === 'download' ||
            transaction.type === 'download-zip')
      );
    },

    getFileByPath: state => fullpath => {
      let fs_path = fullpath.split('/');
      fs_path.splice(-1, 1);
      fs_path = fs_path.join('/');

      return _.find(state.files[fs_path], {
        fullpath
      });
    }
  }
};
