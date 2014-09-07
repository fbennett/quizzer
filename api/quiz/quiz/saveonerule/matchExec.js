(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var commenterID = null;
        var studentID = params.studentid;
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

        // * check if there is a rule for this ruleID, and if not, abort [done]
        // * if the headline text of the rule has changed, update it     [done]
        // * check if there is a row for this translation                []
        //   - if no row exists, create it
        //   - if a row exists, replace it with this text
        // * refetch rule translations for this language
        // * return the result

        sys.db.run('BEGIN TRANSACTION',function(err){
            if (err) {return oops(response,err,'**classes/saveonerule(1)')};
            checkRule();
        });
        
        function checkRule() {
            var sql = 'SELECT string FROM rules JOIN ruleStrings USING(ruleStringID) WHERE ruleID=?;';
            sys.db.get(sql,[ruleID],function(err,row){
                if (err||!row) {return oops(response,err,'**classes/saveonerule(2)')};
                var oldRuleText = row.string;
                if (ruleText && ruleText !== oldRuleText) {
                    checkRuleText();
                } else {
                    checkTranslation();
                }
            });
        }

        function checkRuleText() {
            var sql = 'SELECT ruleStringID FROM ruleStrings WHERE string=?;'
            sys.db.get(sql,[ruleID],function(err,row){
                if (err) {return oops(response,err,'**classes/saveonerule(3)')};
                if (row && row.ruleStringID) {
                    updateRule(row.ruleStringID);
                } else {
                    addRuleString();
                }
            });
        }

        function addRuleString() {
            var sql = 'INSERT INTO ruleStrings VALUES (NULL,?)';
            sys.db.run(sql,[ruleText],function(err){
                if (err) {return oops(response,err,'**classes/saveonerule(4)')};
                updateRule(this.lastID);
            });
        }

        function updateRule(ruleStringID) {
            var sql = 'UPDATE rules SET ruleStringID=? WHERE ruleID=?;'
            sys.db.run(sql,[ruleStringID,ruleID],function(err){
                if (err) {return oops(response,err,'**classes/saveonerule(5)')};
                checkTranslation();
            });
        }

        function checkTranslation() {
            var sql = 'SELECT ruleTranslationID,string FROM ruleTranslations WHERE ruleID=? AND lang=?;'
            sys.db.get(sql,[ruleID,lang],function(err,row){
                if (err) {return oops(response,err,'**classes/saveonerule(6)')};
                if (row && row.ruleTranslationID) {
                    if (glossText !== row.string) {
                        updateTranslation(row.ruleTranslationID);
                    } else {
                        endTransaction();
                    }
                } else {
                    if (glossText) {
                        addTranslation();
                    } else {
                        endTransaction();
                    }
                }
            });
        }

        function addTranslation() {
            var sql = 'INSERT INTO ruleTranslations VALUES (NULL,?,?,?);'
            sys.db.run(sql,[ruleID,glossText,lang],function(err){
                if (err) {return oops(response,err,'**classes/saveonerule(7)')};
                logEdit(this.lastID);
            });
        };

        function updateTranslation(ruleTranslationID) {
            var sql = 'UPDATE ruleTranslations SET string=? WHERE ruleTranslationID=?;';
            sys.db.run(sql,[glossText,ruleTranslationID],function(err){
                if (err) {return oops(response,err,'**classes/saveonerule(8)')};
                logEdit(ruleTranslationID);
            });
        };

        function logEdit(ruleTranslationID) {
            var sql,id;
            if (studentID) {
                id = studentID;
                sql = 'INSERT INTO ruleTranslationEdits VALUES (NULL,?,?,NULL,DATE("now"));'
            } else if (commenterID) {
                id = commenterID;
                sql = 'INSERT INTO ruleTranslationEdits VALUES (NULL,?,NULL,?,DATE("now"));'
            }
            sys.db.run(sql,[ruleTranslationID,id],function(err){
                if (err) {return oops(response,err,'**classes/saveonerule(9)')};
                endTransaction();
            });
        };

        function endTransaction() {
            sys.db.run('END TRANSACTION',function(err){
                if (err) {return oops(response,err,'**classes/saveonerule(10)')};
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
                if (err||!row) {return oops(response,err,'**classes/saveonerule(10)')};
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(row));
            });
        }
    }
    exports.cogClass = cogClass;
})();
