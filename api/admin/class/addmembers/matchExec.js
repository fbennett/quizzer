(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var db = this.sys.db;
        var getRandomKey = this.sys.getRandomKey;
        var classID = params.classid;
        var sql = [];
        var getClassMemberships = this.utils.getClassMemberships;
        var stmt = db.prepare('INSERT INTO memberships VALUES(NULL,?,?,?);');
        for (var i=0,ilen=params.addmembers.length;i<ilen;i+=1) {
            var addmemberID = params.addmembers[i];
            var addmemberKey = getRandomKey(8,36);
            stmt.bind(classID,addmemberID,addmemberKey);
            stmt.run();
            stmt.reset();
        }
        stmt.finalize(function(){
            getClassMemberships(params,request,response);
        });
    }
    exports.cogClass = cogClass;
})();

