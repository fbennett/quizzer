(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        if (params.classid) {
            sys.db.run('INSERT OR REPLACE INTO classes VALUES (?,?,?)',[params.classid,params.groupid,params.name],function(err){
                if (err) {return oops(response,err,'classes/addclass(1)')};
                sendClasses();
            })
        } else {
            var db = this.sys.db;
            sys.db.run('INSERT INTO classes VALUES (NULL,?,?)',[params.groupid,params.name],function(err){
                if (err) {return oops(response,err,'classes/addclass(2)')};
                sys.membershipKeys[this.lastID] = {};
                sendClasses();
            });
        }
        function sendClasses () {
            sys.db.all('SELECT classID,classes.name,ruleGroupID,ruleGroups.name AS ruleGroupName FROM classes JOIN ruleGroups USING(ruleGroupID) ORDER BY classes.name;',function(err,rows){
                if (err||!rows) {return oops(response,err,'classes/addclass(3)')};
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(rows));
            });
        }
    }
    exports.cogClass = cogClass;
})();
