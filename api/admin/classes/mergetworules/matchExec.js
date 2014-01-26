(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var kohaiRuleID = params.kohairuleid;
        var senpaiRuleID = params.senpairuleid;

        console.log("========> senpaiRuleID: "+senpaiRuleID);

        checkKohaiInRulesToChoices();

        // Change kohai entries in rulesToChoices to senpai ID
        // OR delete if senpai entry already exists.
        var rcData = {senpai:{},kohai:{}};
        function checkKohaiInRulesToChoices() {
            console.log("(1)");
            var sql = 'SELECT choiceID FROM rulesToChoices WHERE ruleID=?';
            sys.db.all(sql,[kohaiRuleID],function(err,rows){
                if (err) {return oops(response,err,'classes/mergetworules(1)')};
                if (rows && rows.length) {
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        rcData.kohai[row.choiceID] = true;
                    }
                }
                checkSenpaiInRulesToChoices();
            });
        };
        function checkSenpaiInRulesToChoices() {
            console.log("(2)");
            var sql = 'SELECT ruleToChoiceID FROM rulesToChoices WHERE ruleID=?';
            sys.db.all(sql,[senpaiRuleID],function(err,rows){
                if (err) {return oops(response,err,'classes/mergetworules(2)')};
                if (rows && rows.length) {
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        rcData.senpai[row.choiceID] = true;
                    }
                }
                addSenpaiInRulesToChoices();
            });
        };
        function addSenpaiInRulesToChoices() {
            console.log("(3)");
            var sqlparams = [];
            var sqlstr = [];
            for (var key in rcData.kohai) {
                if (!rcData.senpai[key]) {
                    sqlparams.push(key);
                    sqlstr.push('?');
                }
            }
            var sql = 'INSERT INTO rulesToChoices (choiceID,ruleID) SELECT choiceID,? FROM rulesToChoices WHERE ruleID=? AND choiceID IN (' + sqlstr.join(',') + ')';
            sqlparams = [senpaiRuleID,kohaiRuleID].concat(sqlparams);
            sys.db.run(sql,sqlparams,function(err){
                if (err) {return oops(response,err,'classes/mergetworules(3)')};
                deleteKohaiInRulesToChoices();
            });
        };
        function deleteKohaiInRulesToChoices() {
            console.log("(4)");
            var sql = 'DELETE FROM rulesToChoices WHERE ruleID=?;';
            sys.db.run(sql,[kohaiRuleID],function(err){
                if (err) {return oops(response,err,'classes/mergetworules(4)')};
                checkKohaiRuleTranslations();
            });
        };
        //
        // Copy kohai entries in ruleTranslations to use senpai ID
        // OR list for deletion if a senpai entry for the target language
        // already exists.
        var rtData = {senpai:{},kohai:{}};
        function checkKohaiRuleTranslations() {
            console.log("(5)");
            var sql = 'SELECT lang,ruleTranslationID FROM ruleTranslations WHERE ruleID=?;';
            sys.db.all(sql,[kohaiRuleID],function(err,rows){
                if (err) {return oops(response,err,'classes/mergetworules(5)')};
                console.log("CHECKING FOR KOHAI: "+kohaiRuleID);
                if (rows && rows.length) {
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        console.log("  "+row.lang+" "+row.ruleTranslationID);
                        rtData.kohai[row.lang] = row.ruleTranslationID;
                    }
                }
                checkSenpaiRuleTranslations();
            });
        };
        function checkSenpaiRuleTranslations() {
            console.log("(6)");
            var sql = 'SELECT lang,ruleTranslationID FROM ruleTranslations WHERE ruleID=?;';
            sys.db.all(sql,[senpaiRuleID],function(err,rows){
                if (err) {return oops(response,err,'classes/mergetworules(6)')};
                console.log("CHECKING FOR SENPAI: "+senpaiRuleID);
                if (rows && rows.length) {
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        console.log("  "+row.lang+" "+row.ruleTranslationID);
                        rtData.senpai[row.lang] = row.ruleTranslationID;
                    }
                }
                moveKohaiRuleTranslations();
            });
        };
        function moveKohaiRuleTranslations() {
            console.log("(7)");
            var sqlparams = [];
            var sqlstr = [];
            for (var key in rtData.kohai) {
                if (!rtData.senpai[key]) {
                    sqlparams.push(key);
                    sqlstr.push('?');
                }
            }
            var sql = 'INSERT OR REPLACE INTO ruleTranslations (ruleTranslationID,ruleID,string,lang) '
                + 'SELECT ruleTranslationID,?,string,lang '
                + 'FROM ruleTranslations '
                + 'WHERE ruleID=? AND lang IN (' + sqlstr.join(',') + ')';
            sqlparams = [senpaiRuleID,kohaiRuleID].concat(sqlparams);
            console.log("SQL: "+sql);
            console.log("PARAMS: "+sqlparams);
            sys.db.run(sql,sqlparams,function(err){
                if (err) {return oops(response,err,'classes/mergetworules(7)')};
                moveKohaiRuleTranslationEdits();
            });
        };
        //
        // Point all kohai entries in ruleTranlsationEdits to point
        // at new senpai entries.
        function moveKohaiRuleTranslationEdits() {
            console.log("(8)");
            var sqlparams_senpai = [];
            var sqlparams_kohai = [];
            var sqlstr = [];
            // kohai edits that apply to items that were NOT moved
            // in the last step are mapped across here
            for (var key in rtData.kohai) {
                if (rtData.senpai[key]) {
                    sqlparams_senpai.push(rtData.senpai[key]);
                    sqlstr.push('?');
                }
            }
            for (var key in rtData.kohai) {
                if (rtData.senpai[key]) {
                    sqlparams_kopai.push(rtData.kohai[key]);
                    sqlstr.push('?');
                }
            }
            // Don't actually need to have two WHERE clauses here, the join would take care of it.
            var sqlparams = sqlparams_senpai.concat(sqlparams_kohai);
            var sql = 'INSERT OR REPLACE INTO ruleTranslationEdits (ruleTranslationEditID,ruleTranslationID,studentID,editDate) '
                + 'SELECT ruleTranslationEditID,ruleTranslationID,studentID,editDate '
                + 'FROM ('
                +   'SELECT ruleID,lang,ruleTranslationID '
                +   'FROM ruleTranslations AS rt '
                +   'JOIN ruleTranslationEdits USING(ruleTranslationID) '
                +   'WHERE rt.ruleTranslationID IN (' + sqlstr.join(',') + ') ' 
                + ') AS senpai '
                + 'JOIN ('
                +   'SELECT ruleID,lang,ruleTranslationEditID,studentID,editDate '
                +   'FROM ruleTranslations AS rt '
                +   'JOIN ruleTranslationEdits USING(ruleTranslationID) '
                +   'WHERE rt.ruleTranslationID IN (' + sqlstr.join(',') + ') '
                + ') AS kohai USING(ruleID,lang)'
            console.log("SQL: "+sql);
            console.log("PARAMS: "+sqlparams)
            sys.db.run(sql,sqlparams,function(err){
                if (err) {return oops(response,err,'classes/mergetworules(8)')};
                // There should now be no key violation when the ruleTranslations are deleted
                deleteKohaiRuleTranslations();
            });
        };
        function deleteKohaiRuleTranslations() {
            console.log("(9)");
            var sqlparams = [];
            var sqlstr = [];
            for (var key in rtData.kohai) {
                if (rtData.senpai[key]) {
                    sqlparams.push(key);
                    sqlstr.push('?');
                }
            }
            var sql = 'DELETE FROM ruleTranslations WHERE ruleID=? AND lang IN (' + sqlstr.join(',') + ')';
            sqlparams = [kohaiRuleID].concat(sqlparams);
            sys.db.run(sql,sqlparams,function(err){
                if (err) {return oops(response,err,'classes/mergetworules(9)')};
                checkKohaiRule();
            });
        };
        // Check ruleStringID of rule before wiping it out
        var kohaiRuleStringID = {};
        function checkKohaiRule() {
            console.log("(10)");
            var sql = 'SELECT ruleStringID FROM rules WHERE ruleID=?';
            sys.db.get(sql,[kohaiRuleID],function(err,row){
                if (err||!row) {return oops(response,err,'classes/mergetworules(10)')};
                kohaiRuleStringID.id = row.ruleStringID;
                deleteKohaiRule();
            });
        };
        //
        // Delete kohai rule entry.
        function deleteKohaiRule() {
            console.log("(11)");
            var sql = 'DELETE FROM rules WHERE ruleID=?';
            sys.db.run(sql,[kohaiRuleID],function(err){
                if (err) {return oops(response,err,'classes/mergetworules(11)')};
                checkKohaiRuleString();
            });
        };
        //
        // Delete kohai ruleStrings entry IF it is no longer used.
        function checkKohaiRuleString() {
            console.log("(12)");
            var sql = 'SELECT COUNT(*) AS count FROM ruleStrings WHERE ruleStringID=?';
            sys.db.get(sql,[kohaiRuleStringID.id],function(err,row){
                if (err||!row) {return oops(response,err,'classes/mergetworules(12)')};
                if (row.count == 0) {
                    deleteKohaiRuleString()
                } else {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(['success']));
                }
            });
        };
        function deleteKohaiRuleString() {
            console.log("(13)");
            var sql = 'DELETE FROM ruleStrings WHERE ruleStringID=?';
            sys.db.run(sql,[kohaiRuleStringID.id],function(err){
                if (err) {return oops(response,err,'classes/mergetworules(12)')};
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(['success']));
            });
        };
        //
    }
    exports.cogClass = cogClass;
})();
