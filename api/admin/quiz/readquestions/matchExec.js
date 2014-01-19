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
            quizobj.pending = row.pending;
            quizobj.examName = row.examName;
            quizobj.questions = {};
            getQuestions(row.quizID,row.examName,row.pending);
        });
        function getQuestions(quizID,examName,pending) {
            var sql = 'SELECT questionID,questionNumber,strings.string AS rubric,correct '
                + 'FROM questions '
                + 'NATURAL JOIN strings '
                + 'WHERE quizID=?';
            sys.db.all(sql,[quizID],function(err,rows){
                if (err||!rows) {return oops(response,err,'quiz/readquestions(2)')};
                if (rows.length) {
                    questionsCount += rows.length;
                    console.log("Questions count: "+questionsCount);
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        var obj = {
                            questionNumber: row.questionNumber,
                            rubric: row.rubric,
                            correct: row.correct
                        }
                        util.getChoices(response,obj,row.questionID,function(obj,row) {
                            quizobj.questions[row.questionNumber] = {
                                rubric: obj.rubric,
                                questions:[
                                    row.one,
                                    row.two,
                                    row.three,
                                    row.four
                                ],
                                correct: obj.correct
                            }
                            questionsCount += -1;
                            console.log("   decrement: "+questionsCount);
                            if (!questionsCount) {
                                response.writeHead(200, {'Content-Type': 'application/json'});
                                response.end(JSON.stringify(quizobj));
                            }
                        });
                    }
                } else {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(quizobj));
                }
            });
        };
    }
    exports.cogClass = cogClass;
})();
