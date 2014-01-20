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
            var sql = 'DELETE FROM comments '
                + 'WHERE choiceID IN ('
                +   'SELECT choiceID '
                +   'FROM quizzes '
                +   'NATURAL JOIN questions '
                +   'JOIN choices USING(questionID) '
                +   'WHERE classID=? AND quizNumber=? AND questionNumber=? AND choice=? AND adminID=?'
                + ')'
            sys.db.run(sql,[classID,quizNumber,questionNumber,wrongChoice,commenterID],function(err){
                if (err) {return oops(response,err,'**quiz/writeonecomment(1)')};
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end('success');
            });
        } else {
            sys.db.run('INSERT OR IGNORE INTO strings VALUES(NULL,?)',[comment],function(err){
                if (err) {return oops('response',err,'**quiz/writeonecomment(2)')};
                getStringID(comment);
            });
        }
        function getStringID(comment) {
            sys.db.get('SELECT stringID FROM strings WHERE string=?',[comment],function(err,row){
                var commentTextID = row.stringID;
                if (err|!row) {return oops(response,err,'**quiz/writeonecomment(3)')};
                console.log("SAVE: classID="+classID+", quizNumber="+quizNumber+", questionNumber="+questionNumber+", wrongChoice="+wrongChoice+", commenterID="+commenterID);
                getCommentIDandWrongChoiceID(classID,quizNumber,questionNumber,wrongChoice,commenterID,commentTextID);
            });
        }
        function getCommentIDandWrongChoiceID(classID,quizNumber,questionNumber,wrongChoice,commenterID,commentTextID) {
            var sql = 'SELECT choiceID,res.commentID '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'JOIN choices USING(questionID) '
                + 'LEFT JOIN ('
                +   'SELECT choiceID,commentID '
                +   'FROM quizzes '
                +   'NATURAL JOIN questions '
                +   'JOIN choices USING(questionID) '
                +   'JOIN comments USING(choiceID) '
                +   'WHERE classID=? AND quizNumber=? AND questionNumber=? AND choice=? AND adminID=?'
                + ') AS res USING (choiceID) '
                + 'WHERE classID=? AND quizNumber=? AND questionNumber=? AND choice=?'
            sys.db.get(sql,[classID,quizNumber,questionNumber,wrongChoice,commenterID,classID,quizNumber,questionNumber,wrongChoice],function(err,row){
                if (err) {return oops(response,err,'**quiz/writeonecomment(4)')}
                var commentID = null;
                if (row && row.commentID) {
                    commentID = row.commentID;
                }
                var wrongChoiceID = row.choiceID;
                saveComment(commentID,wrongChoiceID,commenterID,commentTextID);
            })
        }
        function saveComment(commentID,wrongChoiceID,commenterID,commentTextID){
            console.log("INSERT AS: commentID="+commentID+", wrongChoiceID="+wrongChoiceID+", commenterID="+commenterID+", commentTextID="+commentTextID);
            var sql = 'INSERT OR REPLACE INTO comments VALUES (?,?,?,?)'
            sys.db.run(sql,[commentID,wrongChoiceID,commenterID,commentTextID],function(err){
                if (err) {return oops(response,err,'**quiz/writeonecomment(5)')};
                response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(['success']));
            });
        }
    }
    exports.cogClass = cogClass;
})();
