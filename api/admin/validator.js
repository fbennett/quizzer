(function () {
    function getValidator (pageName,callName) {
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
        };
    }
    exports.getValidator = getValidator;
})();
