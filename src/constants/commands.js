export default [
  {
    command: '/inspire',
    result: '/inspire',
    hasParams: false,
    level: 0,
    description: 'Shows a inspiring message for your team'
  },
  {
    command: '/im [emote message]',
    result: '/im ',
    hasParams: true,
    level: 0,
    description: 'Sends a message in an emote style format'
  },
  {
    command: '/kick @[user]',
    result: '/kick @',
    hasParams: true,
    level: 50,
    description: 'Kicks a user from the channel'
  },
  {
    command: '/transfer_ownership @[user]',
    result: '/transfer_ownership @',
    hasParams: true,
    level: 200,
    description: 'Transfer the ownership to the target user'
  },
  {
    command: '/call',
    result: '/call',
    hasParams: false,
    level: 0,
    description: '[Experimental] Starts an AirSend meeting'
  }
];
