(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var getRandomKey = this.sys.getRandomKey;
        var classID = params.classid;
        var getClassMemberships = this.utils.getClassMemberships;

        sys.db.run('BEGIN TRANSACTION',function(err){
            if (err){return oops(response,err,'class/addmembers(1)')};
            addMembers(0,params.addmembers.length);
        });

        function addMembers(pos,limit) {
            if (pos === limit) {
                endTransaction();
                return;
            }
            var sql = 'INSERT INTO memberships VALUES(NULL,?,?,?,NULL);';
            var addmemberID = params.addmembers[pos];
            var addmemberKey = getRandomKey(8,36);
            sys.db.run(sql,[classID,addmemberID,addmemberKey],function(err){
                if (err){return oops(response,err,'class/addmembers(2)')};
                addMembers(pos+1,limit);
            });
        };
        
        function endTransaction() {
            sys.db.run('END TRANSACTION',function(err){
                if (err){return oops(response,err,'class/addmembers(3)')};
                getClassMemberships(params,request,response);
            });
        };
    }
    exports.cogClass = cogClass;
})();

