(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var db = this.sys.db;
        var getRandomKey = this.sys.getRandomKey;
        var payload = JSON.parse(request.POSTDATA);
        var classID = payload.classid;
        var sql = [];
        var params = [];
        var getClassMemberships = this.utils.getClassMemberships;
        db.serialize(function () {
            var stmt = db.prepare('DELETE FROM memberships WHERE classID=? AND studentID=?');
            for (var i=0,ilen=payload.removemembers.length;i<ilen;i+=1) {
                var removememberID = payload.removemembers[i];
                stmt.bind(classID,removememberID);
                stmt.run();
                stmt.reset();
            }
            stmt.finalize(function(){
                getClassMemberships(params,request,response,classID);
            });
        });
    }
    exports.cogClass = cogClass;
})();

