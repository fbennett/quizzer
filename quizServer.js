// (reads from quizServer.cfg and mypwd.txt)
var config = require('./lib/config').config;

// (creates subdirs and sqlite3 database if necessary,
// migrates to sqlite3 db from old CSV files, and removes
// CSV and their subdirs after validation)
var initModule = require('./lib/init.js');
var initClass = new initModule.initClass(config);
var init = initClass.getInit();

var optsModule = require('./lib/opts.js');
var optsClass = new optsModule.optsClass(init);
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

var storageModule = require('./lib/storage.js');
var storageClass = new storageModule.storageClass();
var storage = storageClass.getStorage(sys);

var sysModule = require('./lib/sys.js');
var sysClass = new sysModule.sysClass(opts,mailer,storage);
var sys = sysClass.getSys();

var cogsModule = require('./lib/cogs.js');
var cogsClass = new cogsModule.cogsClass(sys);
var cogs = cogsClass.getCogs();

var apiModule = require('./lib/api.js');
var apiClass = new apiModule.apiClass(sys,cogs);
var api = apiClass.getApi();

var serverModule = require('./lib/server.js');
var serverClass = new serverModule.serverClass(sys,api);
serverClass.runServer();
