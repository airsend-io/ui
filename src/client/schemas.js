let schemas = {};

// login
schemas['user.login'] = {
  email: {
    type: 'email'
  },
  password: {
    type: 'string',
    empty: false,
    min: 6
  }
};

schemas['user.create'] = {
  email: {
    type: 'email'
  },
  password: {
    type: 'string',
    empty: false,
    min: 6
  },
  name: {
    type: 'string',
    empty: false
  }
};

schemas['user.verify'] = {
  verify_code: {
    type: 'string',
    empty: false,
    min: 6
  }
};

schemas['user.finalize'] = {
  user: {
    type: 'email'
  },
  password: {
    type: 'string',
    empty: false
  },
  name: {
    type: 'string',
    empty: false
  }
};

schemas['password.recover'] = {
  opt_email: {
    type: 'email'
  }
};

schemas['password.reset'] = {
  user_id: {
    type: 'string',
    empty: false
  },
  reset_code: {
    type: 'string',
    empty: false
  },
  password: {
    type: 'string',
    empty: false,
    min: 6
  }
};

schemas['password.update'] = {
  current_password: {
    type: 'string',
    empty: false
  },
  new_password: {
    type: 'string',
    empty: false
  }
};

schemas['user.delete'] = {
  email: {
    type: 'string',
    empty: false
  }
};

// channels
schemas['channel.create'] = {
  channel_name: {
    type: 'string',
    empty: false
  },
  emails: {
    type: 'string',
    optional: true
  }
};

schemas['channel.rename'] = {
  channel_name: {
    type: 'string',
    empty: false
  }
};

schemas['user.profile.set'] = {
  name: {
    type: 'string',
    empty: false,
    optional: true
  },
  phone: {
    type: 'string',
    optional: true
  }
};

schemas['file.create'] = {
  fsname: {
    type: 'string',
    empty: false
  }
};

// channels
schemas['oauth.server.client.create'] = {
  name: {
    type: 'string',
    empty: false
  },
  description: {
    type: 'string',
    empty: false
  },
  grant_type: {
    type: 'string',
    empty: false
  },
  redirect: {
    type: 'string',
    empty: false
  }
};

// teams
schemas['team.create'] = {
  name: {
    type: 'string',
    empty: false,
    min: 6
  }
};

export default schemas;
