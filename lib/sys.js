(function () {
    var sysClass = function (opts,mailer,storage) {
        this.sys = opts;
        this.sys.mailer = mailer;
        this.sys.fs = require('fs');
    };
    sysClass.prototype.getSys = function () {
        var membershipKeys = this.sys.membershipKeys;
        function adminCallValidator (pageName,callName) {
            if (callName) {
                return function (params) {
                    if (params.admin 
                        && this.sys.admin[params.admin]
                        && params.page === pageName
                        && params.cmd === callName) {

                        return true;
                    }
                    return false;
                }
            } else {
                return function (params) {
                    if (params.admin 
                        && this.sys.admin[params.admin]
                        && params.page === pageName
                        && !params.cmd) {

                        return true;
                    }
                    return false;
                }
            }
        };
        function quizCallValidator (pageName,callName) {
            if (callName) {
                return function (params) {
                    if (!params.admin
                               && membershipKeys[params.studentid]
                               && membershipKeys[params.studentid][params.studentid]
                               && membershipKeys[params.studentid][params.studentid] === params.studentkey
                               && params.cmd === callName) {

                        return true;
                    }
                    return false;
                }
            } else {
                return function (params) {
                    if (!params.admin
                        && membershipKeys[params.studentid]
                        && membershipKeys[params.studentid][params.studentid]
                        && membershipKeys[params.studentid][params.studentid] === params.studentkey
                        && !params.cmd) {

                        return true;
                    }
                    return false;
                }
            }
        };
        function validAdmin (params) {
            return params.admin
                && this.admin[params.admin];
        };
        this.sys.adminCallValidator = adminCallValidator;
        this.sys.quizCallValidator = quizCallValidator;
        this.sys.validAdmin = validAdmin;
        return this.sys;
    };
    exports.sysClass = sysClass;
})();
