(function () {
    var sysClass = function (init,opts,mailer,storage) {
        this.sys = opts;
        this.sys.getRandomKey = init.getRandomKey;
        this.sys.mailer = mailer;
        this.sys.fs = require('fs');
        this.sys.db = init.db;
    };
    sysClass.prototype.getSys = function () {
        return this.sys;
    };
    exports.sysClass = sysClass;
})();
