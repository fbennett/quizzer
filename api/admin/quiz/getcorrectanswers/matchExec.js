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
        
        sys.db.all('SELECT q.questionNumber,q.correct FROM questions AS q WHERE q.classID=? AND q.quizNumber=?',[classID,quizNumber],function(err,rows){
            if (err||!rows) {return oops(response,err,'quiz/getcorrectanswers(1)')};
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                quizInfo.correctAnswers[row.questionNumber] = row.correct;
                quizInfo.numberOfQuestions += 1;
            }
            getStudentNames();
        });

        function getStudentNames () {
            sys.db.all('SELECT s.name,s.studentID FROM memberships AS m JOIN students AS s ON s.studentID=m.studentID WHERE m.classID=? AND (s.privacy IS NULL OR s.privacy=0)',[classID],function(err,rows){
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
            sys.db.all('SELECT questionNumber,choice FROM answers WHERE classID=? AND quizNumber=? AND studentID=?',[classID,quizNumber,studentID],function(err,rows){
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


