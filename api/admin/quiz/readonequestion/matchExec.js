(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var questionNumber = params.questionno;
        this.sys.db.get('SELECT r.string AS rubric,one.string AS one,two.string AS two,three.string AS three,four.string AS four,q.correct FROM questions AS q JOIN strings AS r ON r.stringID=q.rubricID JOIN strings AS one ON one.stringID=q.qOneID JOIN strings AS two ON two.stringID=q.qTwoID JOIN strings AS three ON three.stringID=q.qThreeID JOIN strings AS four ON four.stringID=q.qFourID WHERE classID=? AND quizNumber=? AND questionNumber=?',[classID,quizNumber,questionNumber],function(err,row){
            if (err||!row) {return oops(response,err,'quiz/readonequestion')};
            var data = {
                rubric: row.rubric,
                questions: [
                    row.one,
                    row.two,
                    row.three,
                    row.four
                ],
                correct: row.correct
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(data));
        });
    }
    exports.cogClass = cogClass;
})();
