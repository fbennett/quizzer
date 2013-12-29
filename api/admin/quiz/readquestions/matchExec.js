(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var quizNumber = params.quizno;
        var classID = params.classid;
        var sql = 'SELECT qz.sent AS sent,'
            + 'q.questionNumber AS questionNumber,'
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
        this.sys.db.all(sql,[classID,quizNumber],function(err,rows){
            if (err||!rows) {return oops(response,err,'quiz/readquestions')};
            var quizobj = {sent:false,questions:{}};
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                // Slightly wasteful, as it's the same on all rows. But this
                // uses just one database call, which saves a few cycles.
                quizobj.sent = row.sent;
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
    }
    exports.cogClass = cogClass;
})();
