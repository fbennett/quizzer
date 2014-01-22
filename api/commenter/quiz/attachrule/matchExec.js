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
        var ruleID = params.ruleid;
        var commenter = this.sys.validCommenter(params).name;
        var commenterID = this.sys.validCommenter(params).id;
        getRule();

        function getRule (httpRespond) {
            var sql = 'SELECT ruleID,string AS ruleText '
                + 'FROM quizzes '
                + 'JOIN questions USING(quizID) '
                + 'JOIN choices USING(questionID) '
                + 'JOIN rulesToChoices USING(choiceID) '
                + 'JOIN rules USING(ruleID) '
                + 'JOIN ruleStrings USING(ruleStringID) '
                + 'WHERE classID=? AND quizNumber=? AND questionNumber=? AND choices.choice=? AND rules.ruleID=?';
            sys.db.get(sql,[classID,quizNumber,questionNumber,wrongChoice,ruleID],function(err,row){
                if (err) {return oops(response,err,'**quiz/attachrule(2)')};
                if (!httpRespond) {
                    if (row) {
                        response.writeHead(200, {'Content-Type': 'application/json'});
                        response.end(JSON.stringify({}));
                    } else {
                        attachRule();
                    }
                } else {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(row));
                }
            });
        };
        function attachRule () {
            var sql = 'INSERT OR IGNORE INTO rulesToChoices (choiceID,ruleID) '
                + 'SELECT choiceID,? '
                + 'FROM quizzes '
                + 'JOIN questions USING(quizID) '
                + 'JOIN choices USING(questionID) '
                + 'WHERE classID=? AND quizNumber=? AND questionNumber=? AND choices.choice=?';
            sys.db.run(sql,[ruleID,classID,quizNumber,questionNumber,wrongChoice],function(err){
                if (err) {return oops(response,err,'**quiz/attachrule(1)')};
                getRule(true);
            });
        }
    }
    exports.cogClass = cogClass;
})();
