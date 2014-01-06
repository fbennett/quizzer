(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var studentID = params.studentid;
        var mistakeCount;
        var sql = 'SELECT a.questionNumber,q.correct,a.choice FROM answers AS a JOIN questions AS q ON q.classID=a.classID AND q.quizNumber=a.quizNumber AND q.questionNumber=a.questionNumber WHERE a.classID=? AND a.quizNumber=? AND a.studentID=? AND NOT a.choice=q.correct';
        sys.db.all(sql,[classID,quizNumber,studentID],function(err,rows){
            if (err||!rows) {return oops(response,err,'*quiz/myquizresult(1)')};
            if (rows.length) {
                var items = [];
                mistakeCount = rows.length;
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    var fields = ['qOneID','qTwoID','qThreeID','qFourID'];
                    var questionNumber = row.questionNumber;
                    var wrongAnswerFieldName = fields[row.choice];
                    var rightAnswerFieldName = fields[row.correct];
                    getMistakes(classID,quizNumber,questionNumber,studentID,rightAnswerFieldName,wrongAnswerFieldName,items);

                }
            } else {
                var data = JSON.stringify([])
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(data);
            }
        });

        function getMistakes (classID,quizNumber,questionNumber,studentID,rightAnswerFieldName,wrongAnswerFieldName,items) {
            var sql = 'SELECT r.string AS rubric,qq.string AS right,aa.string AS wrong,a.choice AS wrongChoice FROM answers AS a JOIN questions AS q ON q.classID=a.classID AND q.quizNumber=a.quizNumber AND q.questionNumber=a.questionNumber LEFT JOIN strings AS r ON r.stringID=q.rubricID LEFT JOIN strings AS qq ON qq.stringID=q.' + rightAnswerFieldName + ' LEFT JOIN strings AS aa ON aa.stringID=q.' + wrongAnswerFieldName + ' WHERE a.classID=? AND a.quizNumber=? AND a.questionNumber=? AND a.studentID=?';
            sys.db.get(sql,[classID,quizNumber,questionNumber,studentID],function(err,row) {
                if (err||!row) {return oops(response,err,'*quiz/myquizresult(2)')}
                var rubric = row.rubric;
                var right = row.right;
                var wrong = row.wrong;
                var wrongChoice = row.wrongChoice;
                getGoodAnswerStudents(classID,quizNumber,questionNumber,wrongChoice,items,rubric,right,wrong);
            });
        }

        function getGoodAnswerStudents(classID,quizNumber,questionNumber,wrongChoice,items,rubric,right,wrong) {
            sys.db.all('SELECT s.name FROM answers AS a JOIN questions AS q ON q.classID=a.classID AND q.quizNumber=a.quizNumber AND q.questionNumber=a.questionNumber JOIN students AS s ON s.studentID=a.studentID WHERE a.classID=? AND a.quizNumber=? AND a.questionNumber=? AND q.correct=a.choice',[classID,quizNumber,questionNumber],function(err,rows){
                if (err||!rows) {return oops(response,err,'*quiz/myquizresult(3)')}
                var goodAnswerStudents = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    goodAnswerStudents.push(row.name);
                }
                getComments(classID,quizNumber,questionNumber,wrongChoice,items,rubric,right,wrong,goodAnswerStudents);
            });
        }

        function getComments(classID,quizNumber,questionNumber,wrongChoice,items,rubric,right,wrong,goodAnswerStudents) {
            sys.db.all('SELECT ad.name AS commenter,s.string AS comment FROM comments AS c JOIN admin AS ad ON ad.adminID=c.commenterID LEFT JOIN strings AS s ON s.stringID=c.commentTextID WHERE classID=? AND quizNumber=? AND questionNumber=? AND choice=?',[classID,quizNumber,questionNumber,wrongChoice],function(err,rows){
                if (err||!rows) {return oops(response,err,'*quiz/myquizresults(4)')};
                var comments = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    comments.push({commenter:row.commenter,comment:row.comment});
                }
                items.push({
                    rubric:rubric,
                    right:right,
                    wrong:wrong,
                    goodAnswerStudents:goodAnswerStudents,
                    comments:comments
                });
                mistakeCount += -1;
                if (!mistakeCount) {
                    var data = JSON.stringify(items);
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(data);
                }
            });
        }
    }
    exports.cogClass = cogClass;
})();
