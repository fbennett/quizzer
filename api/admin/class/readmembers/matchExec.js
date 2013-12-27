(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var db = this.sys.db;
        this.utils.getClassMemberships(params,request,response);
    }
    exports.cogClass = cogClass;
})();

