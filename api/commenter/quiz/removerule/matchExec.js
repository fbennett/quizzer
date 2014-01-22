(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var questionNumber = params.questionno;
        var wrongChoice = params.wrongchoice;
        var ruleID = params.ruleid;

        var sql = 'DELETE FROM rulesToChoices '
            + 'WHERE ruleID=? AND choiceID IN ('
            +   'SELECT choiceID FROM quizzes '
            +   'JOIN questions USING(quizID) '
            +   'JOIN choices USING(questionID) '
            +   'WHERE classID=? AND quizNumber=? AND questionNumber=? AND choice=?'
            + ')'
        sys.db.run(sql,[ruleID,classID,quizNumber,questionNumber,wrongChoice],function(err){
            if (err) {return oops(response,err,'**quiz/removerule(1)')};
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(['success']));
        });
    }
    exports.cogClass = cogClass;
})();
