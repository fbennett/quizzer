(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sql = 'SELECT classes.name,classID,ruleGroups.name AS ruleGroupName,ruleGroupID '
            + 'FROM classes '
            + 'JOIN ruleGroups USING(ruleGroupID)'
            + 'ORDER BY classes.name;';
        this.sys.db.all(sql,function(err,rows){
            if (err||!rows) {return oops(response,err,'classes/readclasses')};
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
