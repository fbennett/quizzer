// (creates subdirs and sqlite3 database if necessary,
// migrates to sqlite3 db from old CSV files, and removes
// CSV and their subdirs after validation)
var initModule = require('./lib/init.js');
var initClass = new initModule.initClass();
var init = initClass.getInit();

// (reads from quizServer.cfg and mypwd.txt)
var config = require('./lib/config').config;

var optsModule = require('./lib/opts.js');
var optsClass = new optsModule.optsClass(config);
var opts = optsClass.getOpts();
if (!opts) {
    return;
}

var mailerModule = require('./lib/mailer.js');
var mailerClass = new mailerModule.mailerClass(opts);
var mailer = mailerClass.getMailer();
if (!mailer) {
    return;
}

var sysModule = require('./lib/sys.js');
var sysClass = new sysModule.sysClass(init,opts,mailer,storage);
var sys = sysClass.getSys();

var storageModule = require('./lib/storage.js');
var storageClass = new storageModule.storageClass();
var storage = storageClass.getStorage(sys);

var cogsModule = require('./lib/cogs.js');
var cogsClass = new cogsModule.cogsClass(sys);
var cogs = cogsClass.getCogs();

var apiModule = require('./lib/api.js');
var apiClass = new apiModule.apiClass(cogs);
var api = apiClass.getApi();

var serverModule = require('./lib/server.js');
var serverClass = new serverModule.serverClass(api);
serverClass.runServer();
