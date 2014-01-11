(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var studentID = params.studentid;
        var answers = params.answers;
        var sys = this.sys;
        var answerCount = 0;
        for (var questionNumber in answers) {
            answerCount += 1;
        }
        for (var questionNumber in answers) {
            var choice = answers[questionNumber];
            recordResult(classID,quizNumber,questionNumber,studentID,choice);
        }
        function recordResult(classID,quizNumber,questionNumber,studentID,choice) {
            sys.db.run('INSERT OR REPLACE INTO answers (questionID,studentID,choice) SELECT q.questionID,?,? FROM questions AS q WHERE q.classID=? AND q.quizNumber=? AND q.questionNumber=?',[studentID,choice,classID,quizNumber,questionNumber],function(err){
                if (err) {return oops(response,err,'quiz/recordexamresult')};
                console.log("Comleted okay! "+classID+" "+quizNumber+" "+questionNumber+" "+studentID+" "+choice);
                answerCount += -1;
                if (!answerCount) {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(['success']));
                }
            });
        };
    }
    exports.cogClass = cogClass;
})();
