(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var commenterID = this.sys.admin[params.commenter].id;
        var sql = 'SELECT ruleID,'
            + 'string AS ruleText '
            + 'FROM rules '
            + 'JOIN ruleStrings USING(ruleStringID) '
            + 'WHERE rules.adminID IN (1,?)'
        sys.db.all(sql,[commenterID],function(err,rows){
            if (err||!rows) {return oops(response,err,'**classes/readrules(1)')};
            console.log(JSON.stringify(rows,null,2));
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
