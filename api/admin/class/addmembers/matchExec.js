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
        var stmt = db.prepare('INSERT INTO memberships VALUES(NULL,?,?,?);');
        for (var i=0,ilen=payload.addmembers.length;i<ilen;i+=1) {
            var addmemberID = payload.addmembers[i];
            var addmemberKey = getRandomKey(8,36);
            stmt.bind(classID,addmemberID,addmemberKey);
            stmt.run();
            stmt.reset();
        }
        stmt.finalize(function(){
            getClassMemberships(params,request,response,classID);
        });
    }
    exports.cogClass = cogClass;
})();

