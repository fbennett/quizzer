(function () {
    var sysClass = function (opts,mailer,storage) {
        this.sys = opts;
        this.sys.mailer = mailer;
        this.sys.fs = require('fs');
    };
    sysClass.prototype.getSys = function () {
        return this.sys;
    };
    exports.sysClass = sysClass;
})();
