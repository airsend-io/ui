const fs = require('fs-extra');
const pkg = require('./package.json');

const init = async function() {
  // update version file
  fs.outputJson('public/version.json', {
    version: pkg.version
  });
};

init();
