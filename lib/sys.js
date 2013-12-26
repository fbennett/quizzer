(function () {
    var sysClass = function (opts,mailer,storage) {
        this.sys = opts;
        this.sys.mailer = mailer;
        this.sys.fs = require('fs');
    };
    sysClass.prototype.getSys = function () {
        function validator (pageName,callName) {
            if (callName) {
                return function (params) {
                    return params.admin 
                        && this.sys.admin[params.admin]
                        && params.page === pageName
                        && params.cmd === callName
                }
            } else {
                return function (params) {
                    return params.admin 
                        && this.sys.admin[params.admin]
                        && params.page === pageName
                        && !params.cmd
                }
            }
        };
        function validAdmin (params) {
            return params.admin
                && this.admin[params.admin];
        };
        this.sys.validator = validator;
        this.sys.validAdmin = validAdmin;
        return this.sys;
    };
    exports.sysClass = sysClass;
})();
