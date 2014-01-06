(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var studentID = params.studentid;
        var answers = params.answers;
        var sys = this.sys;
        for (var questionNumber in answers) {
            var choice = answers[questionNumber];
            sys.db.run('INSERT OR REPLACE INTO answers VALUES (NULL,?,?,?,?,?)',[classID,quizNumber,questionNumber,studentID,choice],function(err){
                if (err) {return oops(response,err,'quiz/recordexamresult')};
                console.log("Comleted okay! "+classID+" "+quizNumber+" "+questionNumber+" "+studentID+" "+choice);
            });
        }
    }
    exports.cogClass = cogClass;
})();
