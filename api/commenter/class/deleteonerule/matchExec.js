(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var commenterID = this.sys.validCommenter(params).id;
        var lang = params.lang;
        var ruleID = params.ruleid;
        // Delete from
        //   rulesToChoices (ruleID)
        //   ruleTranslationEdits (ruleTranslationID)
        //   ruleTranslations (ruleID)
        //   rules (ruleID)
        //   ruleStrings (if not in use by rules) (ruleStringID)
        deleteFromRulesToChoices();
        function deleteFromRulesToChoices() {
            var sql = 'DELETE FROM rulesToChoices WHERE ruleID=?';
            sys.db.run(sql,[ruleID],function(err){
                if (err) {return oops(response,err,'**classes/deleteonerule(1)')};
                getRuleTranslationID();
            });
        };
        function getRuleTranslationID() {
            var sql = 'SELECT ruleTranslationID FROM ruleTranslations WHERE ruleID=?';
            sys.db.get(sql,[ruleID],function(err,row){
                if (err) {return oops(response,err,'**classes/deleteonerule(2)')};
                if (row && row.ruleTranslationID) {
                    deleteFromRuleTranslationEdits(row.ruleTranslationID);
                } else {
                    getRuleStringID();
                }
            });
        };
        function deleteFromRuleTranslationEdits(ruleTranslationID){
            var sql = 'DELETE FROM ruleTranslationEdits WHERE ruleTranslationID=?';
            sys.db.run(sql,[ruleTranslationID],function(err){
                if (err) {return oops(response,err,'**classes/deleteonerule(3)')};
                deleteFromRuleTranslations();
            });
        };
        function deleteFromRuleTranslations(){
            var sql = 'DELETE FROM ruleTranslations WHERE ruleID=?;';
            sys.db.run(sql,[ruleID],function(err){
                if (err) {return oops(response,err,'**classes/deleteonerule(4)')};
                getRuleStringID();
            });
        };
        function getRuleStringID() {
            var sql = 'SELECT ruleStringID FROM rules WHERE ruleID=?;';
            sys.db.get(sql,[ruleID],function(err,row){
                if (err||!row) {return oops(response,err,'**classes/deleteonerule(5)')};
                deleteFromRules(row.ruleStringID);
            });
        };
        function deleteFromRules(ruleStringID) {
            var sql = 'DELETE FROM rules WHERE ruleID=?;';
            sys.db.run(sql,[ruleStringID],function(err){
                if (err) {return oops(response,err,'**classes/deleteonerule(6)')};
                checkForRuleStrings(ruleStringID);
            });
        };
        function checkForRuleStrings(ruleStringID) {
            var sql = 'SELECT COUNT(*) AS count FROM rules WHERE ruleStringID=?;';
            sys.db.get(sql,[ruleStringID],function(err,row){
                if (err||!row) {return oops(response,err,'**classes/deleteonerule(7)')};
                if (row.count == 0) {
                    deleteFromRuleStrings(ruleStringID);
                } else {
                    //console.log("ruleStringID still in use: "+ruleStringID);
                    response.writeHead(200, {'Content-Type': 'applicaton/json'});
                    response.end(JSON.stringify(['success']));
                }
            });
        };
        function deleteFromRuleStrings(ruleStringID) {
            var sql = 'DELETE FROM ruleStrings WHERE ruleStringID=?;';
            sys.db.run(sql,[ruleStringID],function(err){
                if (err) {return oops(response,err,'**classes/deleteonerule(8)')};
                //console.log("deleting ruleStringID: "+ruleStringID);
                response.writeHead(200, {'Content-Type': 'applicaton/json'});
                response.end(JSON.stringify(['success']));
            });
        };
    }
    exports.cogClass = cogClass;
})();
