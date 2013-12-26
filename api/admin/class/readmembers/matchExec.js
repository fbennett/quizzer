(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var db = this.sys.db;
        var payload = JSON.parse(request.POSTDATA);
        var classID = payload.classid;
        this.utils.getClassMemberships(params,request,response,classID);
    }
    exports.cogClass = cogClass;
})();

