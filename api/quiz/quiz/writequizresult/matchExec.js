(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var studentID = params.studentid;
        var studentKey = params.studentkey;
        var quizNumber = params.quizno;
        var quizResult = params.quizres;
        //console.log("RESULT: "+JSON.stringify(quizResult,null,2));
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
        // Flag to catch retests
        var retestFlag = false;

        // OKAY! So this just needs to work from the quizNumber recorded in the
        // result, rather than making assumptions based on the quiz number
        // provided in the call.

        // quizNumber in the call is still useful, though, since it helps us navigate
        // back to results of a full quiz.

        var glossLangString = params.glosslang ? '&glosslang=' + params.glosslang : '';

        var resultUrl = 'http://' + hostname + port + stub + '?classid=' + classID+ '&studentid=' + studentID + '&studentkey=' + studentKey + '&quizno=' + quizNumber + glossLangString;

        var data = [];
        for (var quizAndQuestionNumber in quizResult) {
            // XXX Here is where we parse out the two elements of the key:
            //   quizNumber:questionNumber
            var quizNumber = quizAndQuestionNumber.split(":")[0];
            var questionNumber = quizAndQuestionNumber.split(":")[1];
            var choice = quizResult[quizAndQuestionNumber];
            data.push({
                quizNumber:quizNumber,
                questionNumber:questionNumber,
                choice:choice
            });
        }
        beginTransaction(0,data.length);

        function beginTransaction(pos,limit){
            sys.db.run('BEGIN TRANSACTION',function(err){
                if (err){return oops(response,err,'quiz/sendquiz(1)')}
                checkAnswers(pos,limit);
            });
        };

        function checkAnswers(pos,limit) {
            if (pos === limit) {
                saveAnswers(0,limit);
                return;
            }
            var quizNumber = data[pos].quizNumber;
            var questionNumber = data[pos].questionNumber;
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
                checkAnswers(pos+1,limit);
            });
        };
        // XXX To overwrite entries, we need to check for presence first, then
        // XXX use UPDATE or INSERT as appropriate.
        function saveAnswers(pos,limit) {
            if (pos === limit) {
                if (retestFlag) {
                    endTransaction();
                } else {
                    setSubmissionTimestamp();
                }
                return;
            }
            if (data[pos].answerID) {
                saveByUpdate(pos,limit);
            } else {
                saveByInsert(pos,limit);
            }
        }
        function saveByInsert (pos,limit) {
            var obj = data[pos];
            var sql = 'INSERT INTO answers (answerID,questionID,studentID,choice) '
                + 'SELECT NULL,questionID,?,? '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'WHERE classID=? AND quizNumber=? AND questionNumber=?;';
            sys.db.run(sql,[obj.studentID,obj.choice,classID,obj.quizNumber,obj.questionNumber],function(err){
                if (err) {return oops(response,err,'*quiz/writequizresult(2)')};
                saveAnswers(pos+1,limit);
            });
        };
        function saveByUpdate (pos,limit) {
            retestFlag = true;
            var obj = data[pos];
            var sql = 'UPDATE answers SET choice=? WHERE answerID=?;';
            sys.db.run(sql,[obj.choice,obj.answerID],function(err){
                if (err) {return oops(response,err,'*quiz/writequizresult(3)')};
                saveAnswers(pos+1,limit);
            });
        };
        function setSubmissionTimestamp() {
            var sql = 'INSERT INTO quizAnswers '
                + '(quizID,studentID,submissionDate) '
                + 'SELECT quizID,?,DATETIME(\'now\') AS submissionDate '
                + 'FROM quizzes '
                + 'WHERE classID=? AND quizNumber=?';
            sys.db.run(sql,[studentID,classID,quizNumber],function(err){
                if (err) {return oops(response,err,'*quiz/writequizresult(4)')};
                endTransaction();
            });
        };
        function endTransaction () {
            sys.db.run('END TRANSACTION',function(err){
                if (err) {return oops(response,err,'quiz/sendquiz(8)')};
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end(resultUrl);
            });
        };
    }
    exports.cogClass = cogClass;
})();
