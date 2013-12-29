(function () {
    function getValidator (pageName,callName) {
        if (callName) {
            return function (params) {
                if (!params.admin
                    && !params.commenter
                    && this.sys.membershipKeys[params.studentid]
                    && this.sys.membershipKeys[params.studentid][params.studentid]
                    && this.sys.membershipKeys[params.studentid][params.studentid] === params.studentkey
                    && params.cmd === callName) {
                    
                    return true;
                }
                return false;
            }
        } else {
            return function (params) {
                if (!params.admin
                    && !params.commenter
                    && this.sys.membershipKeys[params.studentid]
                    && this.sys.membershipKeys[params.studentid][params.studentid]
                    && this.sys.membershipKeys[params.studentid][params.studentid] === params.studentkey
                    && !params.cmd) {
                    
                    return true;
                }
                return false;
            }
        }
    };
    exports.getValidator = getValidator;
})();
