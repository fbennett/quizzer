(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var commenterID = this.sys.admin[params.commenter].id;
        var lang = params.lang;
        var sql = 'SELECT ruleID,'
            + 'string AS ruleText,'
            + 'CASE WHEN trans.ruleID IS NOT NULL THEN 1 ELSE NULL END AS hasGloss '
            + 'FROM rules '
            + 'JOIN ruleStrings USING(ruleStringID) '
            + 'LEFT JOIN (SELECT ruleID FROM ruleTranslations WHERE lang=?) AS trans USING(ruleID) '
            + 'WHERE rules.adminID IN (1,?) '
            + 'ORDER BY hasGloss,ruleText '
        sys.db.all(sql,[lang,commenterID],function(err,rows){
            if (err||!rows) {return oops(response,err,'**classes/readrules(1)')};
            console.log(JSON.stringify(rows,null,2));
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
