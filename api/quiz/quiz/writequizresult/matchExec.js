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
        var data = [];
        for (var questionNumber in quizResult) {
            var choice = quizResult[questionNumber];
            data.push({questionNumber:questionNumber,choice:choice});
        }
        checkAnswers(0,data.length);

        function checkAnswers(pos,limit) {
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
                data[pos].answerID = answerID;
                data[pos].studentID = studentID;
                pos += 1;
                if (pos === limit) {
                    saveAnswers(0,limit);
                } else {
                    checkAnswers(pos,limit);
                }
            });
        };
        function saveAnswers(pos,limit) {
            var sql = 'INSERT OR REPLACE INTO answers (answerID,questionID,studentID,choice) '
                + 'SELECT ?,questionID,?,? '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'WHERE classID=? AND quizNumber=? AND questionNumber=?'
            var o = data[pos];
            sys.db.run(sql,[o.answerID,o.studentID,o.choice,classID,quizNumber,o.questionNumber],function(err){
                if (err) {return oops(response,err,'*quiz/writequizresult')};
                pos += 1;
                if (pos === limit) {
                    setSubmissionTimestamp();
                } else {
                    saveAnswers(pos,limit);
                }
            });
        };
        function setSubmissionTimestamp() {
            var sql = 'INSERT INTO quizAnswers '
                + '(quizID,studentID,submissionDate) '
                + 'SELECT quizID,?,DATETIME(\'now\') AS submissionDate '
                + 'FROM quizzes '
                + 'WHERE classID=? AND quizNumber=?';
            sys.db.run(sql,[studentID,classID,quizNumber],function(err){
                if (err) {return oops(response,err,'*quiz/writequizresult')};
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end(resultUrl);
            });
        };
    }
    exports.cogClass = cogClass;
})();
