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
        sys.db.get('SELECT s.string AS commentText FROM comments AS c LEFT JOIN strings AS s ON s.stringID=c.commentTextID WHERE classID=? AND quizNumber=? AND questionNumber=? AND choice=? AND commenterID=?',[classID,quizNumber,questionNumber,wrongChoice,commenterID],function(err,row){
            if (err||!row) {return oops(response,err,'**quiz/getonecomment(1)')};
            var txt = row.commentText;
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(txt));
        });
    }
    exports.cogClass = cogClass;
})();
