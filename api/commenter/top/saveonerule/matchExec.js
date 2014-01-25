(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var commenterID = this.sys.validCommenter(params).id;
        var ruleText = params.ruletext;
        var ruleID = params.ruleid;
        var lang = params.lang;
        if (!ruleText) {
            ruleText = '';
        }
        if (ruleText) {
            ruleText = ruleText.replace(/^\s+/,'').replace(/\s+$/,'');
        }
        var sql = 'INSERT OR IGNORE INTO ruleTranslations VALUES (NULL,?,?,?);'
        console.log("USING: "+ruleID+" "+lang);
        sys.db.run(sql,[ruleID,ruleText,lang],function(err){
            if (err) {return oops(response,err,'**classes/saveonerule(1)')};
            returnText();
        });
        function returnText () {
            var sql = 'SELECT orig.string AS stringOrig,'
                + 'trans.string AS stringTrans '
                + 'FROM rules '
                + 'LEFT JOIN (SELECT ruleID,string FROM ruleTranslations WHERE ruleID=? AND lang=\'en\') AS orig USING(ruleID) '
                + 'LEFT JOIN (SELECT ruleID,string FROM ruleTranslations WHERE ruleID=? AND lang=?) AS trans USING(ruleID) '
                + 'WHERE ruleID=?'
            sys.db.get(sql,[ruleID,ruleID,lang,ruleID],function(err,row){
                if (err) {return oops(response,err,'**classes/saveonerule(2)')};
                if (!row) {
                    row = {stringOrig:'',stringTrans:''};
                }
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(row));
            });
        }
    }
    exports.cogClass = cogClass;
})();
