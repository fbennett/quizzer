(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var commenterID = sys.admin[params.commenter].id;
        var ruleID = params.ruleid;
        var lang = params.lang;
        var sql = 'SELECT CASE WHEN orig.string IS NULL THEN \'\' ELSE orig.string END AS stringOrig,'
            + 'CASE WHEN trans.string IS NULL THEN \'\' ELSE trans.string END AS stringTrans '
            + 'FROM rules '
            + 'LEFT JOIN (SELECT ruleID,string FROM ruleTranslations WHERE ruleID=? AND lang="en") AS orig USING(ruleID) '
            + 'LEFT JOIN (SELECT ruleID,string FROM ruleTranslations WHERE ruleID=? AND lang=?) AS trans USING(ruleID) '
            + 'WHERE ruleID=?;'
        sys.db.get(sql,[ruleID,ruleID,lang,ruleID],function(err,row){
            if (err) {return oops(response,err,'**classes/readonerule')};
            if (!row) {
                row = {stringOrig:'',stringTrans:''};
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(row));
        });
    }
    exports.cogClass = cogClass;
})();
