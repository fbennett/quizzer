(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var ruleGroupID = params.groupid;

        var sql = 'SELECT * FROM languages ORDER BY langName;'
        sys.db.all(sql,function(err,rows){
            if (err||!rows) {return oops(response,err,'students/getlanguages(1)')};
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                if (row.lang === 'en') {
                    rows = rows.slice(i,i+1).concat(rows.slice(0,i).concat(rows.slice(i+1)));
                    break;
                }
            }
            if (ruleGroupID) {
                getRuleCount(rows);
            } else {
                finish(rows);
            }
        });

        function getRuleCount(languages) {
            console.log("WOWZA: "+ruleGroupID);
            var sql = "SELECT COUNT(*) count FROM ruleTranslations JOIN rules USING(ruleID) WHERE lang='en' AND rules.ruleGroupID=?;";
            sys.db.get(sql,[ruleGroupID],function(err,row){
                if (err) {return oops(response,err,'students/getlanguages(2)')};
                // Check rule/translation correspondence for each language
                checkCompleteness(0,languages,row.count);
            });
        };
        
        function checkCompleteness(pos,languages,ruleCount) {
            if (pos === languages.length) {
                finish(languages);
                return;
            }
            var language = languages[pos];
            var lang = language.lang;
            var sql = "SELECT COUNT(*) count FROM ruleTranslations JOIN rules USING(ruleID) WHERE lang=? AND rules.ruleGroupID=?;";
            sys.db.get(sql,[lang,ruleGroupID],function(err,row){
                if (err) {return oops(response,err,'students/getlanguages(3)')};
                var translationCount = row.count;
                // If all rules are null set completeness to 0
                // If some rules are null set completeness to 1
                // If no rules are null set completeness to 2
                if (!translationCount) {
                    language.completeness = 0;
                } else if (translationCount < ruleCount) {
                    language.completeness = 1;
                } else {
                    language.completeness = 2;
                }
                checkCompleteness(pos+1,languages,ruleCount);
            });
        }

        function finish (languages) {
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(languages));
        };

    }
    exports.cogClass = cogClass;
})();
