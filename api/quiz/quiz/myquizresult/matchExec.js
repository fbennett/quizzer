(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var studentID = params.studentid;
        var mistakeCount;
        var sql = 'SELECT questionNumber,correct,choice '
            + 'FROM answers '
            + 'NATURAL JOIN questions '
            + 'JOIN quizzes USING (quizID) '
            + 'WHERE quizzes.classID=? AND quizzes.quizNumber=? AND answers.studentID=? AND NOT answers.choice=questions.correct';
        sys.db.all(sql,[classID,quizNumber,studentID],function(err,rows){
            if (err||!rows) {return oops(response,err,'*quiz/myquizresult(1)')};
            if (rows.length) {
                var items = [];
                mistakeCount = rows.length;
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    var fields = ['qOneID','qTwoID','qThreeID','qFourID'];
                    var questionNumber = row.questionNumber;
                    var wrongAnswerFieldName = fields[row.choice];
                    var rightAnswerFieldName = fields[row.correct];
                    getMistakes(classID,quizNumber,questionNumber,studentID,items);

                }
            } else {
                var data = JSON.stringify([])
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(data);
            }
        });

        function getMistakes (classID,quizNumber,questionNumber,studentID,items) {
            var sql = 'SELECT rubric.string AS rubric,right.string AS right,wrong.string AS wrong,wrong.choice AS wrongChoice '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'JOIN answers USING(questionID) '
                + 'JOIN strings AS rubric USING(stringID) '
                + 'JOIN ('
                +     'SELECT questionID,string '
                +     'FROM questions '
                +     'JOIN choices USING(questionID) '
                +     'JOIN strings ON strings.stringID=choices.stringID '
                +     'WHERE choices.choice=questions.correct'
                + ') AS right USING(questionID) '
                + 'JOIN ('
                +     'SELECT questionID,string,answers.choice '
                +     'FROM questions '
                +     'JOIN answers USING(questionID) '
                +     'JOIN choices USING(questionID,choice) '
                +     'JOIN strings ON strings.stringID=choices.stringID'
                + ') AS wrong USING (questionID) '
                + 'WHERE quizzes.classID=? AND quizzes.quizNumber=? AND questions.questionNumber=? AND answers.studentID=?'
            console.log("XXX "+sql)
            console.log(classID+" "+quizNumber+" "+questionNumber+" "+studentID);
             sys.db.get(sql,[classID,quizNumber,questionNumber,studentID],function(err,row) {
                if (err||!row) {return oops(response,err,'*quiz/myquizresult(2)')}
                var rubric = row.rubric;
                var right = row.right;
                var wrong = row.wrong;
                var wrongChoice = row.wrongChoice;
                getGoodAnswerStudents(classID,quizNumber,questionNumber,wrongChoice,items,rubric,right,wrong);
            });
        }

        function getGoodAnswerStudents(classID,quizNumber,questionNumber,wrongChoice,items,rubric,right,wrong) {
            var sql = 'SELECT name '
                + 'FROM answers '
                + 'NATURAL JOIN questions '
                + 'JOIN quizzes USING(quizID) '
                + 'JOIN students USING(studentID) '
                + 'WHERE quizzes.classID=? AND quizzes.quizNumber=? AND questions.questionNumber=? AND questions.correct=answers.choice'
            sys.db.all(sql,[classID,quizNumber,questionNumber],function(err,rows){
                if (err||!rows) {return oops(response,err,'*quiz/myquizresult(3)')}
                var goodAnswerStudents = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    goodAnswerStudents.push(row.name);
                }
                getComments(classID,quizNumber,questionNumber,wrongChoice,items,rubric,right,wrong,goodAnswerStudents);
            });
        }

        function getComments(classID,quizNumber,questionNumber,wrongChoice,items,rubric,right,wrong,goodAnswerStudents) {
            var sql = 'SELECT admin.name AS commenter,s.string AS comment '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'JOIN choices USING(questionID) '
                + 'JOIN comments USING(choiceID) '
                + 'JOIN admin USING(adminID) '
                + 'LEFT JOIN strings AS s ON s.stringID=comments.stringID '
                + 'WHERE quizzes.classID=? AND quizzes.quizNumber=? AND questions.questionNumber=? AND choices.choice=?'
            sys.db.all(sql,[classID,quizNumber,questionNumber,wrongChoice],function(err,rows){
                if (err||!rows) {return oops(response,err,'*quiz/myquizresults(4)')};
                var comments = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    comments.push({commenter:row.commenter,comment:row.comment});
                }
                items.push({
                    rubric:rubric,
                    right:right,
                    wrong:wrong,
                    goodAnswerStudents:goodAnswerStudents,
                    comments:comments
                });
                mistakeCount += -1;
                if (!mistakeCount) {
                    var data = JSON.stringify(items);
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(data);
                }
            });
        }
    }
    exports.cogClass = cogClass;
})();
