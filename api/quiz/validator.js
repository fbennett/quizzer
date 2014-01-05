(function () {
    function getValidator (pageName,callName) {
        if (callName) {
            return function (params) {
                if (!params.admin
                    && !params.commenter
                    && params.studentid
                    && params.classid
                    && params.studentkey
                    && this.sys.membershipKeys[params.classid]
                    && this.sys.membershipKeys[params.classid][params.studentid]
                    && this.sys.membershipKeys[params.classid][params.studentid] === params.studentkey
                    && params.cmd === callName) {
                    
                    return true;
                }
                return false;
            }
        } else {
            return function (params) {
                console.log('PAGE PARAMS!');
                if (!params.admin
                    && !params.commenter
                    && params.studentid
                    && params.classid
                    && params.studentkey
                    && this.sys.membershipKeys[params.classid]
                    && this.sys.membershipKeys[params.classid][params.studentid]
                    && this.sys.membershipKeys[params.classid][params.studentid] === params.studentkey
                    && !params.cmd) {
                    
                    return true;
                }
                return false;
            }
        }
    };
    exports.getValidator = getValidator;
})();
