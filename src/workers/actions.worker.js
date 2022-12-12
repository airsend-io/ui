import _ from 'lodash';

class Worker {
  constructor(worker) {
    this.worker = worker;
  }

  parseHighlights(data) {
    let { actions, channel_id, filters } = data;

    actions = actions.map(action => {
      return {
        ...action,
        action_name_highlighted: parseActionName(
          action.action_name,
          action.highlights.name
        ),
        children: action.children.map(child => {
          return {
            ...child,
            action_name_highlighted: parseActionName(
              child.action_name,
              child.highlights.name
            ),
            meta: {
              ...child.meta,
              fade:
                (filters.user_id && !isUserAssigned(child, filters.user_id)) ||
                (filters.search &&
                  !(child.highlights.name || child.highlights.desc))
            }
          };
        }),
        meta: {
          ...action.meta,
          expanded: action.children.some(child => {
            return (filters.user_id || filters.search) && !child.fade;
          })
        }
      };
    });
    let payload = {
      actions,
      channel_id
    };

    // send to main thread
    this.worker.postMessage({
      type: 'actions/handleParsedHighlights',
      data: payload,
      commit: true
    });
  }

  onMessage(event) {
    const { type, data } = event.data;
    this[type].call(this, data);
  }
}

function parseActionName(action_name, highlights = []) {
  if (highlights.length === 0) {
    return action_name;
  }

  highlights.forEach(highlight => {
    var regex = /(<([^>]+)>)/gi;
    let highlightWithoutEm = highlight.replace(regex, '');
    action_name = action_name.replace(highlightWithoutEm, highlight);
  });
  return action_name;
}

function isUserAssigned(action, id) {
  return _.findIndex(action.users, { id }) > -1;
}

const worker = new Worker(self, { type: 'module' });

self.addEventListener('message', worker.onMessage.bind(worker));
