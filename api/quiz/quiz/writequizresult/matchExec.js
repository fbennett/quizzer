(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var studentID = params.studentid;
        var studentKey = params.studentkey;
        var quizNumber = params.quizno;
        var quizResult = params.quizres;
        console.log("RESULT: "+JSON.stringify(quizResult,null,2));
        var pathName = params.pathname;
        var sys = this.sys;
        // var hostname 
        var hostname = this.sys.proxy_hostname;
        // var port
        var port = ':' + this.sys.real_port;
        // Hack for reverse proxy support
        var stub = '/';
        if (pathName && pathName !== '/') {
            port = '';
            stub = pathName.replace(/(.*\/).*/, '$1/quiz.html');
        }
        var resultUrl = 'http://' + hostname + port + stub + '?classid=' + classID+ '&studentid=' + studentID + '&studentkey=' + studentKey + '&quizno=' + quizNumber;
        var saveList = [];
        var numberOfQuestions = 0;
        for (var questionNumber in quizResult) {
            numberOfQuestions += 1;
        }
        var questionsCount = numberOfQuestions;
        for (var questionNumber in quizResult) {
            var choice = quizResult[questionNumber];
            checkAnswer(classID,quizNumber,questionNumber,studentID,choice);
        }
        function checkAnswer(classID,quizNumber,questionNumber,studentID,choice) {
            var sql = 'SELECT answerID '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'JOIN answers USING(questionID) '
                + 'WHERE quizzes.classID=? AND quizzes.quizNumber=? AND questions.questionNumber=? AND answers.studentID=?'
            sys.db.get(sql,[classID,quizNumber,questionNumber,studentID],function(err,row){
                if (err) {return oops(response,err,'*quiz/writequizresult(1)')}
                var answerID = null;
                if (row && row.answerID) {
                    answerID = row.answerID;
                }
                saveList.push({
                    answerID:answerID,
                    questionNumber:questionNumber,
                    studentID:studentID,
                    choice:choice
                });
                questionsCount += -1;
                if (!questionsCount) {
                    questionsCount = numberOfQuestions;
                    saveAnswersRepeater(saveList,0,numberOfQuestions);
                }
            });

        }
        function saveAnswersRepeater (saveList,pos,limit) {
            if (pos < limit) {
                var o = saveList[pos];
                console.log('>' + pos + ': '+saveList[pos].choice);
                var sql = 'INSERT OR REPLACE INTO answers (answerID,questionID,studentID,choice) '
                    + 'SELECT ?,questionID,?,? '
                    + 'FROM quizzes '
                    + 'NATURAL JOIN questions '
                    + 'WHERE classID=? AND quizNumber=? AND questionNumber=?'
                sys.db.run(sql,[o.answerID,o.studentID,o.choice,classID,quizNumber,o.questionNumber],function(err){
                    if (err) {return oops(response,err,'*quiz/writequizresult')};
                    console.log(' ' + pos + ': '+saveList[pos].choice);
                    saveAnswersRepeater(saveList,pos+1,limit);
                    questionsCount += -1;
                    if (!questionsCount) {
                        response.writeHead(200, {'Content-Type': 'text/plain'});
                        response.end(resultUrl);
                    }
                });
            }
        }
    }
    exports.cogClass = cogClass;
})();
