(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var sys = this.sys;

        // Okay, let's be more clever here.
        // Two chained ops: status, then question data
        // Set flag to -1 if quiz is unsent
        // Set flag to 0 if the quiz has been sent and all students have responded
        // Otherwise set flag to number of pending entries
        var sql = 'SELECT CASE WHEN qz.sent IS NULL OR qz.sent=0 THEN -1 ELSE COUNT(res.pending) END AS pending,'
            + 'qz.examName '
            + 'FROM quizzes AS qz LEFT JOIN ('
            +     'SELECT q.quizNumber AS pending FROM memberships AS m '
            +     'JOIN students AS s ON s.studentID=m.studentID '
            +     'JOIN questions AS q ON q.classID=m.classID '
            +     'LEFT JOIN answers AS a ON a.classID=q.classID AND a.quizNumber=q.quizNumber AND a.questionNumber=q.questionNumber AND a.studentID=m.studentID '
            +     'WHERE q.classID=? AND q.quizNumber=? AND a.quizNumber IS NULL AND (s.privacy IS NULL OR s.privacy=0) '
            +     'GROUP BY q.classID,q.quizNumber,m.studentID'
            + ') AS res '
            + 'WHERE qz.classID=? AND qz.quizNumber=? '
            + 'GROUP BY res.pending';
        sys.db.get(sql,[classID,quizNumber,classID,quizNumber],function(err,row){
            if (err||!row) {return oops(response,err,'quiz/readquestions(1)')};
            var pending = row.pending;
            var examName = row.examName;
            var sql = 'SELECT q.questionNumber AS questionNumber,'
                + 'r.string AS rubric,'
                + 'one.string AS one,'
                + 'two.string AS two,'
                + 'three.string AS three,'
                + 'four.string AS four,'
                + 'q.correct AS correct '
                + 'FROM questions AS q '
                + 'JOIN quizzes AS qz ON q.classID=qz.classID AND q.quizNumber=qz.quizNumber '
                + 'LEFT JOIN strings AS r ON r.stringID=q.rubricID '
                + 'LEFT JOIN strings AS one ON one.stringID=q.qOneID '
                + 'LEFT JOIN strings AS two ON two.stringID=q.qTwoID '
                + 'LEFT JOIN strings AS three ON three.stringID=q.qThreeID '
                + 'LEFT JOIN strings AS four ON four.stringID=q.qFourID '
                + 'WHERE q.classID=? AND q.quizNumber=?';
            sys.db.all(sql,[classID,quizNumber],function(err,rows){
                if (err||!rows) {return oops(response,err,'quiz/readquestions')};
                var quizobj = {pending:pending,examName:examName,questions:{}};
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    quizobj.questions[row.questionNumber] = {
                        rubric: row.rubric,
                        questions:[
                            row.one,
                            row.two,
                            row.three,
                            row.four
                        ],
                        correct: row.correct
                    }
                }
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(quizobj));
            });
        });
    }
    exports.cogClass = cogClass;
})();
