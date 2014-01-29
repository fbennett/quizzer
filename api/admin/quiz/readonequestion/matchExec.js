(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var questionNumber = params.questionno;
        var sys = this.sys;
        var util = this.utils;

        var sql = 'SELECT questionID,string AS rubric,correct '
            + 'FROM quizzes '
            + 'JOIN questions USING(quizID) '
            + 'JOIN strings USING(stringID) '
            + 'WHERE classID=? AND quizNumber=? AND questionNumber=?';
        sys.db.get(sql,[classID,quizNumber,questionNumber],function(err,row){
            if (err||!row) {return oops(response,err,'quiz/readonequestion(1)')};
            var obj = {
                rubric:row.rubric,
                correct:row.correct
            };
            util.getChoices(response,obj,row.questionID,function(obj,row) {
                var data = {
                    rubric: obj.rubric,
                    questions: [
                        row.one,
                        row.two,
                        row.three,
                        row.four
                    ],
                    correct: obj.correct
                }
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(data));
            });
        });
    }
    exports.cogClass = cogClass;
})();
