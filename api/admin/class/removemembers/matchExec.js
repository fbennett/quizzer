(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var adminID = this.sys.admin[params.admin].id;
        var classID = params.classid;
        var db = this.sys.db;
        var getRandomKey = this.sys.getRandomKey;
        var sql = [];
        var getClassMemberships = this.utils.getClassMemberships;
        db.serialize(function () {
            var stmt1 = db.prepare('DELETE FROM memberships WHERE classID=? AND studentID=?');
            var stmt2 = db.prepare('INSERT OR IGNORE INTO showing VALUES (NULL,?,?,?);');
            for (var i=0,ilen=params.removemembers.length;i<ilen;i+=1) {
                var removememberID = params.removemembers[i];
                stmt1.bind(classID,removememberID);
                stmt1.run();
                stmt1.reset();
                stmt2.bind(adminID,classID,removememberID);
                stmt2.run();
                stmt2.reset();
            }
            stmt1.finalize(function(){
                stmt2.finalize(function() {
                    getClassMemberships(params,request,response);
                });
            });
        });
    }
    exports.cogClass = cogClass;
})();

