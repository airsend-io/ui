import _ from 'lodash';
import moment from 'moment';
import qs from 'query-string';
import store from 'store';
import { DOMParser } from 'xmldom';
import showdown from 'showdown';
import validUrl from 'valid-url';
import { v1 as uuid } from 'uuid';
import sanitize from 'sanitize-filename';
import showdownKatex from './katex';
import customProtocolCheck from 'custom-protocol-check';
import { escape } from 'html-escaper';

showdown.extension('showdown-katex', showdownKatex());

export function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

export function htmlToMessage(html) {
  let output = html;

  // parse html
  const el = document.createElement('div');
  el.innerHTML = output;

  let mentions = [...el.getElementsByClassName('mention')];

  // if there are mentions, parse it
  if (mentions.length > 0) {
    mentions.forEach(mention => {
      const resource_name = mention.innerHTML;
      const resource_id = mention.dataset.mentionId;
      output = _.replace(
        output,
        mention.outerHTML,
        `[${resource_name}](${resource_id})`
      ); // strip p tags
    });
  }

  // add line breaks to P tags
  output = output.replace(/<\/p\>/g, '</p>\n');

  // remove html tags
  output = output.replace(/<\/?[^>]+(>|$)/g, '');

  return _.trim(output);
}

// wrap text in p tags
export function wrapText(text) {
  const lines = text.split('\n');
  return lines.map(line => `<p>${line}</p>`).join('');
}

// add date dividers
export function addDateDividers(
  date_key = 'modification',
  older = null,
  current = [],
  newer = null
) {
  let output = [];

  // items to parse
  const items = older ? older : newer;

  // add initial date header
  if (items.length > 0 && older) {
    output.push({
      id: uuid(),
      component: 'date-divider',
      when: getRelativeDate(items[0][date_key]).when
    });
  }

  if (current.length === 0 && newer && newer.length === 1) {
    output.push({
      id: uuid(),
      component: 'date-divider',
      when: getRelativeDate(newer[0][date_key]).when
    });
  }

  // add divider if it's a new day
  if (current.length > 0 && newer && newer.length > 0) {
    const lastMessage = current[current.length - 1];
    let lastMessageDiff = getRelativeDate(lastMessage[date_key]);
    let newerMessageDiff = getRelativeDate(newer[0][date_key]);

    if (lastMessageDiff.when !== newerMessageDiff.when) {
      output.push({
        id: uuid(),
        component: 'date-divider',
        when: newerMessageDiff.when
      });
    }
  }

  let lastMessageDiff = getRelativeDate(items[0][date_key]);

  //0 - 1 - 2 - 3 - 4

  items.forEach((item, index) => {
    let messageDiff = getRelativeDate(item[date_key]);

    // if it's different diffDays, push divider
    if (lastMessageDiff.when !== messageDiff.when) {
      output.push({
        id: uuid(),
        component: 'date-divider',
        when: messageDiff.when
      });
    }

    output.push(item);

    lastMessageDiff = messageDiff;
  });

  if (older) return output.concat(current);
  if (newer) return newer.concat(output);
  return null;
}

function getRelativeDate(date) {
  let now = parseTime(new Date());
  date = parseTime(date);

  //today
  if (now.isSame(date, 'day')) {
    return {
      daysAgo: 0,
      when: 'date-dividers.today'
    };
  } else if (now.subtract(1, 'days').isSame(date, 'day')) {
    return {
      daysAgo: 1,
      when: 'date-dividers.yesterday'
    };
  }

  now = parseTime(new Date()); //now was override with subtract(1, 'days')

  let diff = now.diff(date, 'days');

  let when = 'date-dividers.later-than-year';

  if (diff <= 365 * 2) {
    when = 'date-dividers.last-year';
  }
  if (diff <= 365) {
    when = 'date-dividers.this-year';
  }
  if (diff <= 30 * 2) {
    when = 'date-dividers.last-month';
  }
  if (diff <= 30) {
    when = 'date-dividers.this-month';
  }
  if (diff <= 7) {
    when = 'date-dividers.this-week';
  }

  return { daysAgo: diff, when };
}

// add date dividers, and history
export function parseMessagesHierarchy(
  older = null,
  current = [],
  newer = null
) {
  // console.time('parseMessagesHierarchy');

  let output = [];

  // messages to parse
  const messages = older ? older : newer;

  // add initial date header
  if (messages.length > 0 && older) {
    output.push({
      id: uuid(),
      component: 'chat-divider',
      time: parseTime(messages[0].created_on)
        .startOf('day')
        .toISOString()
    });
  }

  if (current.length === 0 && newer && newer.length === 1) {
    output.push({
      id: uuid(),
      component: 'chat-divider',
      time: parseTime(newer[0].created_on)
        .startOf('day')
        .toISOString()
    });
  }

  // add divider if it's a new day
  if (current.length > 0 && newer && newer.length > 0) {
    const lastMessage = current[current.length - 1];

    if (
      parseTime(newer[0].created_on)
        .startOf('day')
        .isAfter(parseTime(lastMessage.created_on).startOf('day'))
    ) {
      output.push({
        id: uuid(),
        component: 'chat-divider',
        time: parseTime(newer[0].created_on)
          .startOf('day')
          .toISOString()
      });
    }
  }

  // handle mother messages (for aggregation)
  let mother = 0;

  messages.forEach((message, index) => {
    // if it's different day, push divider
    if (
      messages[index - 1] &&
      parseTime(message.created_on)
        .startOf('day')
        .isAfter(parseTime(messages[index - 1].created_on).startOf('day'))
    ) {
      output.push({
        id: uuid(),
        component: 'chat-divider',
        time: parseTime(message.created_on)
          .startOf('day')
          .toISOString()
      });
      mother++;
    }

    // TEMPORARY HANDLING
    if (Array.isArray(message.parent_message)) {
      if (message.parent_message.length > 0) {
        message.parent_message = message.parent_message[0];
      } else {
        message.parent_message = null;
      }
    }

    message.has_children = false;

    // if it's same author message, add to extensions of current mother
    if (
      messages[index - 1] &&
      messages[index - 1].user_id === message.user_id &&
      output[output.length - 1] &&
      output[output.length - 1].component === 'chat-message' &&
      parseTime(message.created_on)
        .startOf('minute')
        .isSame(parseTime(messages[index - 1].created_on).startOf('minute'))
    ) {
      messages[index - 1].is_middle_extension = true;
      message.is_extension = true;

      if (output[mother]) {
        output[mother].has_children = true;
      }
    } else {
      mother++;
    }

    output.push(message);
  });

  // console.timeEnd('parseMessagesHierarchy');

  if (older) {
    // check date divider
    if (current[0]) {
      if (
        parseTime(output[output.length - 1].created_on)
          .startOf('day')
          .toISOString() === current[0].time
      ) {
        current.shift();
      }
    }

    return output.concat(current);
  } else {
    if (
      current[current.length - 1] &&
      output[0] &&
      current[current.length - 1].user_id === output[0].user_id &&
      parseTime(output[0].created_on)
        .startOf('minute')
        .isSame(
          parseTime(current[current.length - 1].created_on).startOf('minute')
        )
    ) {
      current[current.length - 1].has_children = true;
      current[current.length - 1].is_middle_extension = true;
      output[0].is_extension = true;
    }

    return current.concat(output);
  }
}

// data can be single or array
export function parseMessages(data = [], channel = {}) {
  return data && Array.isArray(data)
    ? data.map(item => parseSingleMessage(item, channel))
    : parseSingleMessage(data, channel);
}

export function parseSingleMessage(message, channel) {
  let parsedMessage = {
    ...message,
    component:
      message.message_type === 1 || message.message_type === 3
        ? 'chat-message'
        : 'chat-notice',
    content: !message.content ? '' : message.content,
    rich_content:
      message.content && message.content.bot_message
        ? parseMessageContent(message.content.bot_message)
        : parseMessageContent(message.content),
    plain_content:
      message.content && message.content.bot_message
        ? parseMessageContent(message.content.bot_message, null, true)
        : parseMessageContent(message.content, null, true),
    parent_message: message.parent_message ? message.parent_message : null,
    parent_message_rich_content: message.parent_message
      ? parseMessageContent(message.parent_message.content)
      : null,
    reactions: message.emoticons ? parseReactions(message.emoticons) : null,
    read_by:
      channel && channel.read_status && channel.read_status.length > 0
        ? getReadUsers(message.id, message.user_id, channel)
        : [],
    created_on: message.created_on,
    is_img:
      typeof message.content === 'string' ? isWebImg(message.content) : false,
    win: isFC(message.content)
  };

  // parse attachments
  if (message.attachments) {
    let messageAttachments = parseMessageAttachments(message.attachments);
    parsedMessage.unfurl = messageAttachments.unfurl;
    parsedMessage.files = messageAttachments.files;
    parsedMessage.images = messageAttachments.images;
  } else {
    parsedMessage.unfurl = null;
    parsedMessage.files = [];
    parsedMessage.images = [];
  }

  // parse parent message attachments
  if (message.parent_message && message.parent_message.attachments) {
    let parentAttachments = parseMessageAttachments(
      message.parent_message.attachments
    );

    parsedMessage.parent_message.files = parentAttachments.files;
    parsedMessage.parent_message.unfurl = parentAttachments.unfurl;
    parsedMessage.parent_message.images = parentAttachments.images;
  }

  return parsedMessage;
}

export function getReadUsers(message_id, message_author, channel) {
  const { read_status, member } = channel;
  let readBy = [];

  for (var i = 0; i < read_status.length; i++) {
    const { user_id, read_watermark } = read_status[i];
    if (read_watermark >= message_id && user_id !== message_author) {
      readBy.push({
        user_id,
        display_name: member[user_id] ? member[user_id].display_name : null,
        has_avatar: member[user_id] ? member[user_id].has_avatar : null,
        updated_on_ts: member[user_id] ? member[user_id].updated_on_ts : null
      });
    }
  }

  return readBy;
}

export function parseMessageAttachments(attachments) {
  let output = {
    files: [],
    images: [],
    unfurl: null
  };

  // parse attachments
  if (attachments.length) {
    attachments.forEach(attachment => {
      if (attachment.ctp === 'ATTACHMENT_TYPE_UNFURL' && !output.unfurl) {
        output.unfurl = attachment.content;
      }
      if (attachment.ctp === 'ATTACHMENT_TYPE_FILE') {
        if (!attachment.content) return;

        output.files.push(attachment.content);

        if (isImg(attachment.content.file) || attachment.content.has_thumb) {
          output.images.push(attachment.content);
        }
      }
    });
  }

  return output;
}

export function parseReactions(reactions) {
  let output = {};

  reactions.forEach(reaction => {
    if (!output[reaction.ev]) {
      output[reaction.ev] = [];
    }

    output[reaction.ev].push(reaction.uid);
  });

  return output;
}

export function isValidURL(string) {
  return validUrl.isUri(string);
}

// parse message
export function parseMessageContent(content, channel, returnPlain = false) {
  if (!content) return '';

  // prevent XSS TODO: better handling
  // content = escape(content);

  content = content.replace(
    /\(timestamp:\/\/(\d{10})\)/gm,
    (match, timestamp) => {
      return moment
        .unix(timestamp)
        .local()
        .format('MM/DD/YYYY HH:mm');
    }
  );

  // if it's an image or gif link only
  if (validUrl.isUri(content) && returnPlain) {
    // return extension if it's an image
    let ext = isImg(content);

    if (ext) {
      return `📷 Just sent a ${ext === 'gif' ? 'GIF' : 'picture'}`;
    } else {
      return '🌎 Just sent a link';
    }
  }

  // if it's emoji only message, put emojis bigger
  if (isTextOnlyEmoji(content) && !returnPlain) {
    return `<span class="content-emoji">${content}</span>`;
  }

  // content = parseUrls(content);

  content = parseMentions(content);

  // parse links
  var pattern = /([])|\[(.*?)\]\(.*?\)/gm;
  var links = content.match(pattern);

  if (links) {
    links.forEach(link => {
      let matches = link.match(/\(([^)]+)\)/);

      if (matches) {
        let url = matches[1];
        let title = matches[0];

        if (url.indexOf('path://') > -1) {
          content = content.replace(`(${url})`, `(${encodeURI(url)})`);
        }
      }
    });
  }

  // blockquote support
  content = _.replace(content, /&gt;/g, '>');

  // parse content (ignore codeblocks)
  content = content.split('```').map((string, index) => {
    //if it's even index, parse brs
    if (index % 2 === 0) {
      string = string.replace(/\n{2,}/g, m => m.replace(/\n/g, '<br/>'));
      return string.replace(/<br\/>([^<])/g, '<br/>\n\n$1');
    } else {
      return string;
    }
  });

  content = content.join('```');

  const converter = new showdown.Converter({
    extensions: [],
    strikethrough: true,
    splitAdjacentBlockquotes: true,
    requireSpaceBeforeHeadingText: true,
    openLinksInNewWindow: true,
    literalMidWordUnderscores: true,
    simplifiedAutoLink: true
  });

  content = converter.makeHtml(content);

  // strip html from string
  if (returnPlain) {
    try {
      let doc = new DOMParser({errorHandler: () => {}}).parseFromString(content, 'text/html');
      return doc.documentElement.textContent || '';
    } catch (e) {
      return '';
    }
  }

  // return rich content
  return `${content}`;
}

export function parseMentions(content) {
  var pattern = /\[(.+?)\]\((user|file|action|wiki)\:\/\/([^)]+)\)/gm;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    //for each match in the pattern
    let [str, title, resourceType, resourceData] = match; //extract these groups from match

    // if there is a title and resource
    if (title && resourceType && resourceData) {
      if (resourceType === 'user') {
        content = content.replace(
          str,
          `<span class="mention mention-user" data-mention-user="true" data-mention-id="${resourceData}">${title}</span>`
        );
      } else if (resourceType === 'action') {
        title = title.replace('<i class="inline-icon far fa-bolt"></i>', ''); //Remove bolt from old action mentions
        content = content.replace(
          str,
          `<span class="mention mention-action" data-mention-action="true" data-mention-id="${resourceData}">${title}</span>`
        );
      }
    }
  }

  return content;
}

function parseUrls(content) {
  var regex = /(https?:\/\/[^\s]+)/g;
  return content.replace(regex, '[$1]($1)');
}

// verifify if text is made only of emojis
export function isTextOnlyEmoji(text) {
  const onlyEmojis = text.replace(new RegExp('[\u0000-\u1eeff]', 'g'), '');
  const visibleChars = text.replace(new RegExp('[\n\rs]+|( )+', 'g'), '');
  return onlyEmojis.length === visibleChars.length;
}

export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

// handle time along all application
export function parseTime(time) {
  const format = 'YYYY-MM-DD HH:mm:ss';
  return moment.utc(time, format).local();
}

export function parseFile(file) {
  // changed to 1000 instead of 1024
  var chunkSize = 1000 * 1000 * 10; //5 MB Chunk size
  var fileSize = file.size;
  var currentChunk = 1;
  var totalChunks = Math.ceil(fileSize / chunkSize, chunkSize);

  var chunks = [];

  while (currentChunk <= totalChunks) {
    var offset = (currentChunk - 1) * chunkSize;
    var currentFilePart = file.slice(offset, offset + chunkSize);

    chunks.push(
      new File([currentFilePart], sanitizeFileName(file.name), {
        type: file.type
      })
    );

    currentChunk++;
  }

  return chunks;
}

// returns base64 image if file is compatible
export function parseFileThumb(file) {
  return new Promise(resolve => {
    const fileName = file.name;

    // check if file is valid for thumb generation
    if (isImg(fileName)) {
      let reader = new FileReader();

      reader.onloadend = function() {
        resolve(reader.result);
      };

      reader.readAsDataURL(file);
    } else {
      resolve('');
    }
  });
}

export function sanitizeFileName(name) {
  return sanitize(name);
}

// return rich files list (with thumbs!)
export async function retrieveFiles(files) {
  let output = [];

  await asyncForEach(files, async file => {
    // if it's a unique file
    if (!_.find(output, { name: sanitizeFileName(file.name) })) {
      // if it's an actual file, process it
      if (file instanceof File) {
        const blob = file.slice(0, file.size, file.type);
        file = new File([blob], sanitizeFileName(file.name), {
          type: file.type
        });

        let thumb = await parseFileThumb(file);

        if (thumb) {
          file.thumb = thumb;
        }
      } else if (isImg(file.name)) {
        file.thumb = getFileUrl('thumb', file.fullpath, {
          width: 300,
          height: 300
        });
      }

      output.push(file);
    }
  });

  return output;
}

export function getFileFromEntry(entry) {
  return new Promise(resolve => {
    entry.file(file => {
      resolve(file);
    });
  });
}

export function getEntriesFromFolder(folder) {
  return new Promise(resolve => {
    const dirReader = folder.createReader();
    let allEntries = [];

    // read path recursively to get all entries
    const readFunction = entries => {
      if (entries.length === 0) {
        resolve(allEntries);
      } else {
        for (let i = 0; i < entries.length; i++) {
          allEntries.push(entries[i]);
        }
        dirReader.readEntries(readFunction);
      }
    };

    // execute path reading
    dirReader.readEntries(readFunction);
  });
}

export function isImg(fileName) {
  if (!fileName) return false;

  const extensions = ['gif', 'png', 'jpg', 'jpeg'];

  for (var i = 0; i < extensions.length; i++) {
    if (fileName.toLowerCase().indexOf(`.${extensions[i]}`) > -1) {
      return extensions[i];
    }
  }

  return false;
}

export function isWebImg(fileName) {
  return isImg(fileName) && isValidURL(fileName);
}

export function getFileUrl(type = 'download', path, params = {}) {
  params.fspath = path;

  if (!params.token) {
    if (store.get('jwt')) {
      params.token = store.get('jwt');
    } else if (store.get('hash')) {
      params.token = store.get('hash');
    }
  }

  let query = qs.stringify(params);

  return `${process.env.VUE_APP_ROOT_API}/v1/file.${type}?${query}`;
}

export function getFileType(name) {
  const map = [
    {
      name: 'pdf',
      extensions: ['pdf']
    },
    {
      name: 'video',
      extensions: ['mp4', 'webm', 'ogv']
    },
    {
      name: 'audio',
      extensions: ['mp3', 'ogg', 'wav']
    },
    {
      name: 'img',
      extensions: ['png', 'jpg', 'jpeg', 'gif', 'jfif']
    },
    {
      name: 'zip',
      extensions: ['zip', 'rar', '7z', 'gz']
    },
    {
      name: 'txt',
      extensions: ['txt', 'md', 'html', 'htm']
    },
    {
      name: 'word',
      extensions: ['doc', 'docx']
    },
    {
      name: 'excel',
      extensions: ['xls', 'xlsx']
    },
    {
      name: 'powerpoint',
      extensions: ['ppt', 'pptx']
    }
  ];

  if (name !== '') {
    const fileName = name.split('.');
    const extension = fileName[fileName.length - 1];

    const format = _.find(map, { extensions: [extension.toLowerCase()] });

    if (format) {
      return format.name;
    }
  }

  return 'txt';
}

export function getFileExtension(name) {
  const fileName = name.split('.');
  return fileName[fileName.length - 1];
}

// returns blob url
export async function getFileBlob(path, params) {
  const url = getFileUrl('download', path, params);

  const response = await fetch(url);

  const blob = await response.blob();

  // create blob url
  var urlCreator = window.URL || window.webkitURL;
  var imageUrl = urlCreator.createObjectURL(blob);
  return imageUrl;
}

// return pure blob instance
export async function getFilePureBlob(path, params) {
  const url = getFileUrl('download', path, params);

  const response = await fetch(url);
  return await response.blob();
}

export function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1000)));
  return Math.round(bytes / Math.pow(1000, i), 2) + ' ' + sizes[i];
}

export function relDiff(a, b) {
  return 100 * Math.abs((a - b) / ((a + b) / 2));
}

/* Markdown */

export function markdownToHtml(markdown, path = '/cf', authenticate = false) {
  // TODO: better handling
  let escapedMarkdown = markdown;
  if (escapedMarkdown && typeof escapedMarkdown === 'string') {
    escapedMarkdown = escapedMarkdown.replace(/<!-- -->/g, '');
  }

  const converter = new showdown.Converter({
    extensions: ['showdown-katex'],
    strikethrough: true,
    tables: true,
    splitAdjacentBlockquotes: true,
    requireSpaceBeforeHeadingText: true,
    openLinksInNewWindow: true
  });
  let output = converter.makeHtml(escape(escapedMarkdown));

  // parse image urls
  let tmp = document.createElement('DIV');
  tmp.innerHTML = output;

  // parse images
  let images = tmp.getElementsByTagName('IMG');
  for (var i = 0; i < images.length; i++) {
    let image = images[i].attributes[0].value;
    images[i].attributes[0].value = `${
      process.env.VUE_APP_ROOT_API
    }/v1/wiki.get${path}/${image}${
      authenticate
        ? `?token=${store.get('hash') ? store.get('hash') : store.get('jwt')}`
        : ''
    }`;
  }

  return tmp.innerHTML;
}

export function htmlToMarkdown(html) {
  const body = html.match(/<body[^>]*>[\s\S]*<\/body>/gi);

  if (body && body[0]) {
    html = body[0];
  }

  const converter = new showdown.Converter();
  let output = converter.makeMarkdown(html);

  // added line break for katex formatting
  output = output.replace(/\$\$ /g, '$$$$\n');

  let [script, ...markdown] = output.split('</style>');

  markdown = markdown.length === 0 ? script : markdown.join('').trim();

  // parse links
  var pattern = /([])|\[(.*?)\]\(.*?\)/gm;
  var links = markdown.match(pattern);

  if (links) {
    links.forEach(link => {
      let url = link.match(/<([^)]+)>/);

      if (url && url[1]) {
        url = url[1];

        // remove <> tags
        markdown = markdown.replace(`<${url}>`, url);

        if (url.search(process.env.VUE_APP_ROOT_API) > -1) {
          let urlParts = url.split('/');
          let [file, token] = urlParts[urlParts.length - 1].split('?');
          markdown = markdown.replace(url, file);
        }
      }
    });
  }

  return markdown;
}

// load script to page
export async function loadScript(url) {
  return new Promise((resolve, reject) => {
    let script = document.createElement('script');
    script.onload = () => {
      resolve(true);
    };
    script.async = true;
    script.src = url;
    document.head.appendChild(script);
  });
}

export function isFC(content) {
  if (content && typeof content === 'string') {
    let lower = content.toLowerCase();

    if (
      lower.indexOf('🐧') > -1 &&
      (lower.indexOf('fc') || lower.indexOf('filecloud'))
    ) {
      return true;
    }
  } else {
    return false;
  }
}

export function focus(el, timeout = 100) {
  if (el) {
    // Align temp input element approximately where the input element is
    // so the cursor doesn't jump around
    var __tempEl__ = document.createElement('input');
    __tempEl__.style.position = 'absolute';
    __tempEl__.style.top = el.offsetTop + 7 + 'px';
    __tempEl__.style.left = el.offsetLeft + 'px';
    __tempEl__.style.height = 0;
    __tempEl__.style.opacity = 0;
    // Put this temp element as a child of the page <body> and focus on it
    document.body.appendChild(__tempEl__);
    __tempEl__.focus();

    // The keyboard is open. Now do a delayed focus on the target element
    setTimeout(function() {
      el.focus();
      el.click();
      // Remove the temp element
      document.body.removeChild(__tempEl__);
    }, timeout);
  }
}

export function isMobile() {
  let check = false;
  (function(a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

export function isTablet() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
    userAgent
  );
  return isTablet;
}

export function isAndroidDevice() {
  return /(android)/i.test(navigator.userAgent);
}

export function parseFilesQueryFilter(filters, path, rootPath = '/') {
  let queryFilters = {};

  if (queryFilters.hash || this.$route.query.hash) {
    queryFilters.hash = this.$route.query.hash;
  }

  if (filters.type !== undefined && filters.type !== 'media') {
    //default is media
    queryFilters.type = filters.type === '' ? 'files' : filters.type;
  }

  // if(path && path !== rootPath){
  //   queryFilters.path = path;
  // }

  if (filters.search && filters.search !== '') {
    queryFilters.search = filters.search;
  }

  if (filters.sort_by) {
    if (filters.type === 'media' || filters.type === 'links') {
      //default is updated_on
      if (filters.sort_by !== 'updated_on')
        queryFilters.sort_by = filters.sort_by;
    } else {
      //default is name
      if (filters.sort_by !== 'name') queryFilters.sort_by = filters.sort_by;
    }
  }

  if (filters.desc) {
    queryFilters.desc = filters.desc;
  }

  return queryFilters;
}

export function parseFileFilter(queryFilters) {
  let filters = {};
  let path = queryFilters.path || '';

  filters.search = queryFilters.search || '';

  if (queryFilters.type !== undefined) {
    //files or links
    filters.type = queryFilters.type === 'files' ? '' : queryFilters.type;
  } else {
    filters.type = 'media';
  }

  if (filters.type === 'media') {
    filters.sort_by =
      queryFilters.sort_by == undefined ? 'updated_on' : queryFilters.sort_by;
  } else if (filters.type === '') {
    //files
    filters.sort_by =
      queryFilters.sort_by == undefined ? 'name' : queryFilters.sort_by;
  } else if (filters.type === 'links') {
    filters.sort_by = 'updated_on';
  }

  return { filters, path };
}

export function parseQueryFilter(filters) {
  let queryFilters = {};

  if (queryFilters.hash || this.$route.query.hash) {
    queryFilters.hash = this.$route.query.hash;
  }

  if (filters.search && filters.search !== '') {
    queryFilters.search = filters.search;
  }

  if (filters.user_id) {
    queryFilters.user = filters.user_id;
  }

  if (filters.sort && filters.sort !== 3) {
    if (filters.sort == 1) {
      queryFilters.sort_by = 'name';
    } else if (filters.sort == 2) {
      queryFilters.sort_by = 'name';
      queryFilters.desc = true;
    } else if (filters.sort == 4) {
      queryFilters.sort_by = 'channel';
      queryFilters.desc = true;
    } else if (filters.sort == 5) {
      queryFilters.sort_by = 'due_date';
    } else if (filters.sort == 6) {
      queryFilters.sort_by = 'due_date';
      queryFilters.desc = true;
    }
  }

  if (filters.action_status == 1) {
    queryFilters.action_status = 'completed';
  }

  if (filters.action_status == null) {
    queryFilters.action_status = 'all';
  }

  if (
    (this.$route.name == 'channel' &&
      filters.channel_id != this.$route.params.id) ||
    this.$route.name == 'actions'
  ) {
    queryFilters.channel = filters.channel_id ? filters.channel_id : 'all';
  }

  return queryFilters;
}

export function parseFilter(queryFilters) {
  let filters = {};

  filters.search = queryFilters.search || '';
  filters.user_id = queryFilters.user || null;

  if (queryFilters.channel) {
    filters.channel_id =
      queryFilters.channel == 'all' ? 0 : parseInt(queryFilters.channel);
  } else if (this.$route.name == 'channel') {
    filters.channel_id = parseInt(this.$route.params.id) || 0;
  } else {
    filters.channel_id = 0;
  }

  if (queryFilters.sort_by) {
    if (queryFilters.sort_by == 'name' && !queryFilters.desc) {
      filters.sort = 1;
    } else if (queryFilters.sort_by == 'name' && queryFilters.desc) {
      filters.sort = 2;
    } else if (queryFilters.sort_by == 'channel' && queryFilters.desc) {
      filters.sort = 4;
    } else if (queryFilters.sort_by == 'due_date' && !queryFilters.desc) {
      filters.sort = 5;
    } else if (queryFilters.sort_by == 'due_date' && queryFilters.desc) {
      filters.sort = 6;
    } else {
      filters.sort = 3;
    }
  } else {
    filters.sort = 3;
  }

  if (queryFilters.action_status) {
    filters.action_status =
      queryFilters.action_status == 'completed' ? 1 : null;
  } else {
    filters.action_status = 0;
  }

  return filters;
}

export function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, ms);
  });
}

export function readTextFromBlobAsync(blob) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

export function protocolCheck(url) {
  return new Promise((resolve, reject) => {
    customProtocolCheck(
      url,
      () => {
        resolve({ ok: false });
      },
      () => {
        resolve({ ok: true });
      },
      5000
    );
  });
}
