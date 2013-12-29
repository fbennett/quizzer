(function () {
    var sysClass = function (opts,mailer,storage) {
        this.sys = opts;
        this.sys.mailer = mailer;
        this.sys.fs = require('fs');
    };
    sysClass.prototype.getSys = function () {
        function validAdmin (params) {
            return params.admin
                && this.admin[params.admin]
                && this.admin[params.admin].role
                && this.admin[params.admin].role == 1
                ? this.admin[params.admin].name : false
        };
        function validCommenter (params) {
            return params.commenter
                && this.admin[params.commenter]
                && this.admin[params.commenter].role
                && this.admin[params.commenter].role === 2
                ? this.admin[params.commenter].name : false
        };
        this.sys.validAdmin = validAdmin;
        this.sys.validCommenter = validCommenter;
        return this.sys;
    };
    exports.sysClass = sysClass;
})();
