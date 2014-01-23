(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var questionNumber = params.questionno;
        var wrongChoice = params.wrongchoice;
        var commenter = this.sys.validCommenter(params).name;
        var commenterID = this.sys.validCommenter(params).id;
        var rules = params.rules;
        var rulesCount = 0;
        var createRulesCount = 0;
        var retObj = {ruleID:null,selections:[],rulesByChoice:{}}
        if (rules) {
            var rulesList = rules.other.slice();
            if (rules.top) {
                rulesList.push(rules.top);
                retObj.ruleID = true;
            }
            // Search for each rule.
            // When done, iteratively call function to save remaining rules to DB
            rulesCount += rulesList.length;
            findRules(rulesList,0,rulesList.length);
        } else {
            returnList();
        }
        function findRules (rulesList,pos,limit) {
            //console.log("findRules()");
            var ruleText = rulesList[pos];
            var sql = 'SELECT ruleID,ruleStringID FROM rules JOIN ruleStrings USING(ruleStringID) WHERE string=?';
            sys.db.get(sql,[ruleText],function(err,row){
                if (err) {return oops(response,err,'**quiz/getrule(1)')};
                if (!row) {
                    createRuleString(rulesList[pos],pos);
                } else {
                    if (pos === 0 && retObj.ruleID === true) {
                        retObj.ruleID = row.ruleID;
                        attachRule(retObj.ruleID);
                    }
                    rulesCount += -1;
                    if (rulesCount>0) {
                        findRules(rulesList,pos+1,limit);
                    } else {
                        returnList();
                    }
                }
            });
        };
        function createRuleString(ruleString,pos) {
            //console.log("createRuleString()");
            var sql = 'INSERT INTO ruleStrings VALUES (NULL,?);';
            sys.db.run(sql,[ruleString],function(err){
                if (err) {return oops(response,err,'**quiz/getrule(2)')};
                createRule(this.lastID,pos);
            });
        };
        function createRule(ruleStringID,pos) {
            //console.log("createRule()");
            var sql = 'INSERT INTO rules VALUES (NULL,?,?);';
            sys.db.run(sql,[ruleStringID,commenterID],function(err){
                if (err) {return oops(response,err,'**quiz/getrule(3)')};
                //console.log("CREATING RULE: "+pos+" "+retObj.ruleID+" "+typeof retObj.ruleID+" "+this.lastID);
                if (pos === 0 && retObj.ruleID === true) {
                    retObj.ruleID = this.lastID;
                    attachRule(retObj.ruleID);
                }
                rulesCount += -1;
                if (!rulesCount) {
                    returnList();
                }
            });
        };
        function attachRule (ruleID) {
            //console.log("attachRule()");
            var sql = 'INSERT OR IGNORE INTO rulesToChoices (choiceID,ruleID) '
                + 'SELECT choiceID,? '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'JOIN choices USING(questionID) '
                + 'WHERE classID=? AND quizNumber=? AND questionNumber=? AND choice=?;';
            sys.db.run(sql,[ruleID,classID,quizNumber,questionNumber,wrongChoice],function(err){
                if (err) {return oops(response,err,'**quiz/getrule(4)')};
                // Do nothing.
            });
        };
        function returnList () {
            //console.log("returnList();");
            // adminID=1 is admin user, with the keys to the fort
            var sql = 'SELECT ruleID AS ruleid,string AS ruletext '
                + 'FROM rules '
                + 'JOIN ruleStrings USING(ruleStringID) '
                + 'WHERE adminID IN (1,?) '
                + 'ORDER BY string;';
            sys.db.all(sql,[commenterID],function(err,rows){
                if (err||!rows) {return oops(response,err,'**quiz/getrule(5)')};
                retObj.selections = rows;
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(retObj));
            });
        }
    }
    exports.cogClass = cogClass;
})();
