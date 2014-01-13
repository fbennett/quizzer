(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var questionNumber = params.questionno;
        var wrongChoice = params.wrongchoice;
        this.sys.db.get('SELECT s.string AS wrongChoice FROM answers AS a JOIN questions AS q ON q.questionID=a.questionID JOIN strings AS s ON CASE WHEN a.choice=0 THEN s.stringID=q.qOneID WHEN a.choice=1 THEN s.stringID=q.qTwoID WHEN a.choice=2 THEN s.stringID=q.qThreeID WHEN a.choice=3 THEN s.stringID=q.qFourID END WHERE q.classID=? AND q.quizNumber=? AND q.questionNumber=? AND a.choice=? GROUP BY q.classID,q.quizNumber,q.questionNumber,a.choice',[classID,quizNumber,questionNumber,wrongChoice],function(err,row){
            if (err) {return oops(response,err,'class')};
            if (row) {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({wrongChoice:row.wrongChoice}));
            } else {
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.end('fail');
            }
        });
    }
    exports.cogClass = cogClass;
})();
