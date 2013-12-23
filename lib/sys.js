(function () {
    var sysClass = function (opts,mailer,storage) {
        this.sys = opts;
        this.sys.mailer = mailer;
        this.sys.fs = require('fs');
    };
    sysClass.prototype.getSys = function () {
        function validAdmin (params) {
            return params.admin
                && this.admin[params.admin];
        }
        this.sys.validAdmin = validAdmin;
        return this.sys;
    };
    exports.sysClass = sysClass;
})();
