(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var studentID = params.studentid;
        var studentKey = params.studentkey;
        var quizNumber = params.quizno;
        var sys = this.sys;
        var quizData = {classID:classID,studentID:studentID,studentKey:studentKey,quizNumber:quizNumber};
        quizData.questions = [];
        sys.db.all('SELECT q.questionNumber,r.string AS rubric,one.string AS one,two.string AS two,three.string AS three,four.string AS four,q.correct FROM questions as q LEFT JOIN strings AS r ON r.stringID=q.rubricID LEFT JOIN strings AS one ON one.stringID=q.qOneID LEFT JOIN strings AS two ON two.stringID=q.qTwoID LEFT JOIN strings AS three ON three.stringID=q.qThreeID LEFT JOIN strings AS four ON four.stringID=q.qFourID WHERE q.classID=? AND q.quizNumber=? ORDER BY q.questionNumber',[classID,quizNumber],function(err,rows){
            if (err||!rows) {return oops(response,err,'*quiz/quizdata')};
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                var obj = {
                    rubric: row.rubric,
                    questions: [row.one,row.two,row.three,row.four],
                    correct: row.correct,
                    number: row.questionNumber
                }
                quizData.questions.push(obj);
            }
            var quizObject = JSON.stringify(quizData);
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(quizObject);
        });
    }
    exports.cogClass = cogClass;
})();
