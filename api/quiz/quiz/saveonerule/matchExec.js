(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        //var classID = params.classid;
        //var studentID = params.studentid;
        //var studentKey = params.studentkey;
        var glossText = params.glosstext;
        var ruleText = params.ruletext;
        var ruleID = params.ruleid;
        var lang = params.lang;
        if (!glossText) {
            glossText = '';
        }
        if (glossText) {
            glossText = glossText.replace(/^\s+/,'').replace(/\s+$/,'');
        }
        var sql = 'INSERT OR REPLACE INTO ruleTranslations VALUES (NULL,?,?,?);'
        sys.db.run(sql,[ruleID,glossText,lang],function(err){
            if (err) {return oops(response,err,'**classes/saveonerule(1)')};
            if (ruleText) {
                getRuleStringID(ruleID,ruleText);
            } else {
                returnText();
            }
        });
        function getRuleStringID (ruleID,ruleText) {
            var sql = 'SELECT ruleStringID FROM rules WHERE ruleID=?';
            sys.db.get(sql,[ruleID],function(err,row){
                if (err||!row) {return oops(response,err,'**classes/saveonerule(2)')};
                saveRuleText(row.ruleStringID,ruleText);
            });
        };
        function saveRuleText (ruleStringID,ruleText) {
            var sql = 'INSERT OR REPLACE INTO ruleStrings VALUES (?,?);';
            sys.db.run(sql,[ruleStringID,ruleText],function(err){
                if (err) {return oops(response,err,'**classes/saveonerule(3)')};
                returnText();
            });
        };
        function returnText () {
            var sql = 'SELECT ruleStrings.string AS ruleText,'
                + 'orig.string AS stringOrig,'
                + 'trans.string AS stringTrans '
                + 'FROM rules '
                + 'JOIN ruleStrings USING(ruleStringID) '
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
