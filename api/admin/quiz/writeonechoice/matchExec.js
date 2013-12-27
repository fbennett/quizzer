(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var questionNumber = params.questionno;
        var correct = params.choice;
        sys.db.run('UPDATE questions SET correct=? WHERE classID=? AND quizNumber=? AND questionNumber=?',[correct,classID,quizNumber,questionNumber],function(err){
            if (err) {return oops(response,err,'quiz/writeonechoice')};
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.end('done');
        });
    }
    exports.cogClass = cogClass;
})();
