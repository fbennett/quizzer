(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        if (params.groupid) {
            var name = params.name;
            var db = this.sys.db;
            db.run('INSERT OR REPLACE INTO ruleGroups VALUES (?,?)',[params.groupid,params.name],function(err){
                if (err) {return oops(response,err,'groups/addgroup(1)')};
                sendGroups();
            })
        } else {
            var name = params.name;
            var db = this.sys.db;
            db.run('INSERT INTO ruleGroups VALUES (NULL,?)',[params.name],function(err){
                if (err) {return oops(response,err,'groups/addgroup(2)')};
                sendGroups();
            });
        }
        function sendGroups () {
            db.all('SELECT ruleGroupID,name FROM ruleGroups',function(err,rows){
                if (err||!rows) {return oops(response,err,'groups/addgroup(3)')};
                var retRows = [];
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(rows));
            });
        }
    }
    exports.cogClass = cogClass;
})();
