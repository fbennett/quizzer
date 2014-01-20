(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var questionNumber = params.questionno;
        var wrongChoice = params.wrongchoice;
        var commenterID = this.sys.validCommenter(params).id;
        var sql = 'SELECT s.string AS commentText '
            + 'FROM quizzes '
            + 'NATURAL JOIN questions '
            + 'JOIN choices USING(questionID) '
            + 'JOIN comments USING(choiceID) '
            + 'LEFT JOIN strings AS s ON s.stringID=comments.stringID '
            + 'WHERE classID=? AND quizNumber=? AND questionNumber=? AND choices.choice=? AND comments.adminID=?'
        sys.db.get(sql,[classID,quizNumber,questionNumber,wrongChoice,commenterID],function(err,row){
            if (err||!row) {return oops(response,err,'**quiz/getonecomment(1)')};
            var txt = row.commentText;
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(txt));
        });
    }
    exports.cogClass = cogClass;
})();
