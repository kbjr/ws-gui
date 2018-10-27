
require('./events');

const { SettingsManager } = require('./settings-manager');
const { BookmarksManager } = require('./bookmarks-manager');
const { EnvironmentsManager } = require('./environments-manager');

exports.settings = new SettingsManager();
exports.bookmarks = new BookmarksManager();
exports.environments = new EnvironmentsManager();
