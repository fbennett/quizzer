(function () {
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
            }
        }
    }
    exports.validator = validator;
})();
