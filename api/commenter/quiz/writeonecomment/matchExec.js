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
        var comment = params.comment;
        if (!comment) {
            sys.db.run('DELETE FROM comments WHERE classID=? AND quizNumber=? AND questionNumber=? AND choice=? AND commenterID=?',[classID,quizNumber,questionNumber,wrongChoice,commenterID],function(err){
                if (err) {return oops('response',err,'**quiz/writeonecomment(1)')};
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end('success');
            });
        } else {
            sys.db.run('INSERT OR IGNORE INTO strings VALUES(NULL,?)',[comment],function(err){
                if (err) {return oops('response',err,'**quiz/writeonecomment(2)')};
                sys.db.get('SELECT stringID FROM strings WHERE string=?',[comment],function(err,row){
                    var commentTextID = row.stringID;
                    if (err|!row) {return oops('response',err,'**quiz/writeonecomment(3)')};
                    sys.db.run('INSERT OR REPLACE INTO comments VALUES (NULL,?,?,?,?,?,?)',[classID,quizNumber,questionNumber,wrongChoice,commentTextID,commenterID],function(err){
                        if (err) {return oops('response',err,'**quiz/writeonecomment(4)')};
                        response.writeHead(200, {'Content-Type': 'application/json'});
                        response.end(JSON.stringify(['success']));
                    });
                });
            });
        }
    }
    exports.cogClass = cogClass;
})();
