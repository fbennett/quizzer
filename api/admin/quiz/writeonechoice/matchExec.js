(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var questionNumber = params.questionno;
        var correct = params.choice;
        var sql = 'INSERT OR REPLACE INTO questions (questionID,quizID,questionNumber,correct,stringID) '
            + 'SELECT questionID,quizzes.quizID,questionNumber,?,stringID '
            + 'FROM quizzes '
            + 'NATURAL JOIN questions '
            + 'WHERE classID=? AND quizNumber=? AND questionNumber=?';
        sys.db.run(sql,[correct,classID,quizNumber,questionNumber],function(err){
            if (err) {return oops(response,err,'quiz/writeonechoice')};
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(['success']));
        });
    }
    exports.cogClass = cogClass;
})();
