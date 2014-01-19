(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var sys = this.sys;
        var studentsCount = 0;
        var quizInfo = {
            correctAnswers:{},
            studentNames:{},
            numberOfQuestions:0,
            numberOfStudents:0,
            serverResults:{}
        };
        
        // Also send:

        var sql = 'SELECT questionNumber,correct '
            + 'FROM quizzes '
            + 'NATURAL JOIN questions '
            + 'WHERE classID=? AND quizNumber=?';
            sys.db.all(sql,[classID,quizNumber],function(err,rows){
            if (err||!rows) {return oops(response,err,'quiz/getcorrectanswers(1)')};
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                quizInfo.correctAnswers[row.questionNumber] = row.correct;
                quizInfo.numberOfQuestions += 1;
            }
            getStudentNames();
        });

        function getStudentNames () {
            var sql = 'SELECT name,students.studentID '
                + 'FROM memberships '
                + 'NATURAL JOIN students '
                + 'WHERE classID=? AND (privacy IS NULL OR privacy=0)';
            sys.db.all(sql,[classID],function(err,rows){
                if (err||!rows) {return oops(response,err,'quiz/getcorrectanswers(2)')};
                if (rows.length) {
                    studentsCount += rows.length;
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        quizInfo.studentNames[row.studentID] = row.name;
                        quizInfo.numberOfStudents += 1;
                        getAnswers(row.studentID);
                    }
                } else {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(quizInfo));
                }
            });
        };
        function getAnswers (studentID) {
            var sql = 'SELECT questionNumber,choice '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'NATURAL JOIN answers '
                + 'WHERE classID=? AND quizNumber=? AND studentID=?'
            sys.db.all(sql,[classID,quizNumber,studentID],function(err,rows){
                if (err||!rows) {return oops(response,err,'quiz/getcorrectanswers(3)')};
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    if (!quizInfo.serverResults[studentID]) {
                        quizInfo.serverResults[studentID] = {};
                    }
                    quizInfo.serverResults[studentID][row.questionNumber] = row.choice;
                };
                studentsCount += -1;
                if (!studentsCount) {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(quizInfo));
                }
            });
        };
    }
    exports.cogClass = cogClass;
})();


