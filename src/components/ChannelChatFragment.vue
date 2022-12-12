<template>
  <Drop
    v-cloak
    class="chat-fragment"
    :class="{ [`is-dragging`]: isDragActive }"
    @drop="onDropFile"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
  >
    <div class="droppable-wrapper">
      <div class="droppable-box">
        <Icon family="fal" name="paperclip" />
        <h4>{{ $t('channels.droppable-title') }}</h4>
        <p>{{ $t('channels.droppable-description') }}</p>
      </div>
    </div>
    <slot></slot>
  </Drop>
</template>
<script>
import Icon from 'airsend/components/Icon';
import { Drop } from 'vue-drag-drop';
import { getFileFromEntry } from 'airsend/utils';

export default {
  components: {
    Icon,
    Drop
  },
  data() {
    return {
      isDragActive: false,
      counter: 0
    };
  },
  methods: {
    async onDropFile(ext, e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.items.length > 0 || ext) {
        let files = [];

        // if it's an actual file
        if (e.dataTransfer.items.length > 0) {
          let droppedFiles = e.dataTransfer.items;
          if (!droppedFiles) {
            this.isDragActive = false;
            return;
          }

          let filesEntries = [];
          let folderEntries = [];

          // go on each item
          for (let i = 0; i < droppedFiles.length; i++) {
            const entry =
              droppedFiles[i] instanceof DataTransferItem
                ? droppedFiles[i].webkitGetAsEntry()
                : droppedFiles[i];

            if ((entry && entry.isFile) || entry instanceof File) {
              filesEntries.push(entry);
            } else if (entry) {
              folderEntries.push(entry);
            }
          }

          if (folderEntries.length) {
            this.$store.commit('core/addToast', {
              id: 'file.folder-upload',
              content: { message: 'files.toasts.upload-attachment-folder' },
              contentType: 'text',
              close: true,
              timeout: 4000
            });
          }
          //recursively opens a directiry and append to folderEntries or filesEntries
          // for (let i = 0; i < folderEntries.length; i++) {
          //   const entries = await getEntriesFromFolder(folderEntries[i]);
          //   entries.forEach(entry => {
          //     console.log(entry)
          //     if(entry.isDirectory)
          //       folderEntries.push(entry);
          //     else
          //       filesEntries.push(entry);
          //   })
          // }

          for (let i = 0; i < filesEntries.length; i++) {
            const file = await getFileFromEntry(filesEntries[i]);
            files.push(file);
          }
        } else {
          files.push(ext);
        }
        this.$emit('drop', files);

        this.counter = 0;
        this.isDragActive = false;
      } else {
        this.counter = 0;
        this.isDragActive = false;
      }
    },
    onDragEnter(ext, e) {
      if (e.dataTransfer.types.indexOf('Files') > -1 || ext) {
        this.counter++;
        this.isDragActive = true;
      }
    },
    onDragLeave(ext, e) {
      if (e.dataTransfer.types.indexOf('Files') > -1 || ext) {
        this.counter--;
        if (this.counter === 0) {
          this.isDragActive = false;
        }
      }
    }
  }
};
</script>
