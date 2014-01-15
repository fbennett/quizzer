(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var studentID = params.studentid;
        var studentKey = params.studentkey;
        var quizNumber = params.quizno;
        var quizResult = params.quizres;
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
        for (var questionNumber in quizResult) {
            var choice = quizResult[questionNumber];
            checkAnswer(classID,quizNumber,questionNumber,studentID);
        }
        function checkAnswer(classID,quizNumber,questionNumber,studentID) {
            sys.db.get('SELECT a.answerID FROM answers AS a JOIN questions AS q ON q.questionID=a.questionID WHERE q.classID=? AND q.quizNumber=? AND q.questionNumber=? AND a.studentID=?',[classID,quizNumber,questionNumber,studentID],function(err,row){
                if (err) {return oops(response,err,'*quiz/writequizresult(1)')}
                if (row && row.answerID) {
                    saveAnswer(row.answerID,classID,quizNumber,questionNumber,studentID,choice);
                } else {
                    saveAnswer(null,classID,quizNumber,questionNumber,studentID,choice);
                }
            });

        }
        function saveAnswer (answerID,classID,quizNumber,questionNumber,studentID,choice) {
            sys.db.run('INSERT OR REPLACE INTO answers (answerID,questionID,studentID,choice) SELECT ?,q.questionID,?,? FROM questions AS q WHERE classID=? AND quizNumber=? AND questionNumber=?',[answerID,studentID,choice,classID,quizNumber,questionNumber],function(err){
                if (err) {return oops(response,err,'*quiz/writequizresult')};
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end(resultUrl);
            });
        }
    }
    exports.cogClass = cogClass;
})();
