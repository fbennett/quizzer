(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var commenter = this.sys.validCommenter(params).name;
        var commenterID = this.sys.validCommenter(params).id;
        var rules = params.rules;
        var rulesCount = 0;
        var createRulesCount = 0;
        if (rules) {
            var rulesList = rules.other.slice();
            if (rules.top) {
                rulesList.push(rules.top);
            }
            // Search for each rule.
            // When done, iteratively call function to save remaining rules to DB
            rulesCount += rulesList.length;
            findRules(rulesList,0,rulesList.length);
        } else {
            returnList();
        }
        function findRules (rulesList,pos,limit) {
            console.log("findRules()");
            var ruleText = rulesList[pos];
            var sql = 'SELECT ruleStringID FROM rules JOIN ruleStrings USING(ruleStringID) WHERE string=?';
            sys.db.get(sql,[ruleText],function(err,row){
                if (err) {return oops(response,err,'**quiz/getrule(1)')};
                if (pos < limit) {
                    if (!row) {
                        console.log("OY! rulesList[pos] = "+pos+' '+rulesList[pos]);
                        createRuleString(rulesList[pos]);
                    } else {
                        rulesCount += -1;
                        if (rulesCount>0) {
                            findRules(rulesList,pos+1,limit);
                        } else {
                            returnList();
                        }
                    }
                }
            });
        };
        function createRuleString(ruleString) {
            console.log("createRuleString()");
            var sql = 'INSERT INTO ruleStrings VALUES (NULL,?);';
            sys.db.run(sql,[ruleString],function(err){
                if (err) {return oops(response,err,'**quiz/getrule(2)')};
                createRule(this.lastID);
            });
        };
        function createRule(ruleStringID) {
            console.log("createRule()");
            var sql = 'INSERT INTO rules VALUES (NULL,?,?);';
            sys.db.run(sql,[ruleStringID,commenterID],function(err){
                if (err) {return oops(response,err,'**quiz/getrule(3)')};
                rulesCount += -1;
                if (!rulesCount) {
                    returnList();
                }
            });
        };
        function returnList () {
            console.log("returList()");
            // Actually, not just adminID=1. Also adminID="whoever this is"
            var sql = 'SELECT ruleID,string AS ruleText '
                + 'FROM rules '
                + 'JOIN ruleStrings USING(ruleStringID) '
                + 'WHERE adminID IN (1,?) '
                + 'ORDER BY string;';
            sys.db.all(sql,[commenterID],function(err,rows){
                if (err||!rows) {return oops(response,err,'**quiz/getrule(4)')};
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(rows));
            });
        }
    }
    exports.cogClass = cogClass;
})();
