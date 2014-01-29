(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var sys = this.sys;
        var util = this.utils;
        var questionsCount = 0;
        var quizobj = {};
        // Set flag to -1 if quiz is unsent
        // Set flag to 0 if the quiz has been sent and all students have responded
        // Otherwise set flag to number of pending entries

        var sql = 'SELECT quizID,examName,CASE WHEN sent IS NULL OR sent=0 THEN -1 ELSE COUNT(pending) END AS pending '
            + 'FROM quizzes '
            + 'LEFT JOIN ('
            +     'SELECT quizNumber AS pending '
            +     'FROM memberships '
            +     'NATURAL JOIN students '
            +     'JOIN classes USING(classID) '
            +     'JOIN quizzes USING(classID) '
            +     'JOIN questions USING(quizID) '
            +     'LEFT JOIN answers USING (questionID,studentID) '
            +     'WHERE memberships.classID=? AND quizNumber=? AND answers.studentID IS NULL AND (privacy IS NULL OR privacy=0) '
            +     'GROUP BY memberships.classID,quizNumber,memberships.studentID'
            + ') AS res '
            + 'WHERE classID=? AND quizNumber=?'
        sys.db.get(sql,[classID,quizNumber,classID,quizNumber],function(err,row){
            if (err||!row) {return oops(response,err,'quiz/readquestions(1)')};
            quizobj.quizID = row.quizID;
            quizobj.examName = row.examName;
            quizobj.pending = row.pending;
            quizobj.questions = [];
            getQuestions();
        });
        function getQuestions() {
            var sql = 'SELECT questionID,questionNumber,strings.string AS rubric,correct '
                + 'FROM questions '
                + 'NATURAL JOIN strings '
                + 'WHERE quizID=?';
            var quizID = quizobj.quizID;
            sys.db.all(sql,[quizID],function(err,rows){
                if (err||!rows) {return oops(response,err,'quiz/readquestions(2)')};
                if (rows.length) {
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        var obj = {
                            questionID: row.questionID,
                            questionNumber: row.questionNumber,
                            rubric: row.rubric,
                            correct: row.correct
                        }
                        quizobj.questions.push(obj);
                    }
                    getChoices(0,quizobj.questions.length);
                } else {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(quizobj));
                }
            });
        }
        function getChoices (pos,limit) {
            var sql = 'SELECT questionNumber,one.string AS one,two.string AS two,three.string AS three,four.string AS four '
                + 'FROM questions '
                + 'JOIN ('
                +   'SELECT questionID,string '
                +   'FROM choices '
                +   'NATURAL JOIN strings '
                +   'WHERE questionID=? AND choice=0'
                + ') AS one ON one.questionID=questions.questionID '
                + 'JOIN ('
                +   'SELECT questionID,string '
                +   'FROM choices '
                +   'NATURAL JOIN strings '
                +   'WHERE questionID=? AND choice=1'
                + ') AS two ON two.questionID=questions.questionID '
                + 'JOIN ('
                +   'SELECT questionID,string '
                +   'FROM choices '
                +   'NATURAL JOIN strings '
                +   'WHERE questionID=? AND choice=2'
                + ') AS three ON three.questionID=questions.questionID '
                + 'JOIN ('
                +   'SELECT questionID,string '
                +   'FROM choices '
                +   'NATURAL JOIN strings '
                +   'WHERE questionID=? AND choice=3'
                + ') AS four ON four.questionID=questions.questionID '
                + 'WHERE questions.questionID=?'
            var questionID = quizobj.questions[pos].questionID;
            sys.db.get(sql,[questionID,questionID,questionID,questionID,questionID],function(err,row){
                if (err||!row) {return oops(response,err,'quiz/readquestions(3)')};
                quizobj.questions[pos].questions = [
                    row.one,
                    row.two,
                    row.three,
                    row.four
                ];
                //quizobj.questions[pos].correct = row.correct;
                pos += 1;
                if (pos === limit) {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(quizobj));
                } else {
                    getChoices(pos,limit);
                }
            });
        };
    }
    exports.cogClass = cogClass;
})();
