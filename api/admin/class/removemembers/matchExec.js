(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var db = this.sys.db;
        var getRandomKey = this.sys.getRandomKey;
        var sql = [];
        var getClassMemberships = this.utils.getClassMemberships;
        db.serialize(function () {
            var stmt = db.prepare('DELETE FROM memberships WHERE classID=? AND studentID=?');
            for (var i=0,ilen=params.removemembers.length;i<ilen;i+=1) {
                var removememberID = params.removemembers[i];
                stmt.bind(classID,removememberID);
                stmt.run();
                stmt.reset();
            }
            stmt.finalize(function(){
                getClassMemberships(params,request,response);
            });
        });
    }
    exports.cogClass = cogClass;
})();

