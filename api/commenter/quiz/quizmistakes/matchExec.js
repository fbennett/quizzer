(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var commenter = params.commenter;
        // This gets us a clean list of wrong answers, with rubric, correct and wrong choices, and the stringID and text for each,
        // plus a count of the frequency of each error
        //
        // quizNumber  questionNumber  rubricID  rubricText  correct  correctID  correctText   wrong  wrongID  wrongText   COUNT(res.studentID)
        // ----------  --------------  --------  ----------  -------  ---------  ------------  -----  -------  ----------  --------------------
        // 3           1               3         How high a  1        30         A lot.        0      16       Ten meter   2                   
        // 3           1               3         How high a  1        30         A lot.        2      43       Many.       1                   
        //
        var sql = "SELECT res.questionNumber,"
            + "res.rubricID,r.string AS rubricText,"
            + "res.correct,res.correctID,cc.string AS correctText,"
            + "res.wrong,res.wrongID,ww.string AS wrongText,"
            + "COUNT(res.studentID) AS count "
            + "FROM quizzes AS q "
            + "LEFT JOIN ("
            +     "SELECT DISTINCT qq.classID,qq.quizNumber,qq.questionNumber,qq.correct,aa.choice AS wrong,"
            +     "CASE WHEN qq.correct=0 THEN qq.qOneID "
            +          "WHEN qq.correct=1 THEN qq.qTwoID "
            +          "WHEN qq.correct=2 THEN qq.qThreeID "
            +          "WHEN qq.correct=3 THEN qq.qFourID "
            +          "ELSE 0 END "
            +     "AS correctID,"
            +     "CASE WHEN aa.choice=0 THEN qq.qOneID "
            +          "WHEN aa.choice=1 THEN qq.qTwoID "
            +          "WHEN aa.choice=2 THEN qq.qThreeID "
            +          "WHEN aa.choice=3 THEN qq.qFourID "
            +          "ELSE 0 END "
            +     "AS wrongID,"
            +     "qq.rubricID,aa.studentID "
            +     "FROM questions AS qq "
            +     "JOIN answers AS aa ON aa.classID=qq.classID AND aa.quizNumber=qq.quizNumber AND aa.questionNumber=qq.questionNumber "
            +     "WHERE NOT aa.choice=qq.correct AND qq.classID=? AND qq.quizNumber=? "
            +     "GROUP BY aa.quizNumber,aa.questionNumber,aa.choice,aa.studentID"
            + ") as res ON res.classID=q.classID AND res.quizNumber=q.quizNumber "
            + "JOIN strings AS r ON r.stringID=res.rubricID "
            + "JOIN strings AS cc ON cc.stringID=res.correctID "
            + "JOIN strings AS ww ON ww.stringID=res.wrongID "
            + "JOIN classes AS cls ON cls.classID=q.classID "
            + "WHERE q.classID=? AND q.quizNumber=? "
            + "GROUP BY q.quizNumber,res.questionNumber,res.wrong "
            + "ORDER BY count;";
        var mistakeCount = 0;
        var mistakes = []
        sys.db.all(sql,[classID,quizNumber,classID,quizNumber],function(err,rows){
            if (err||!rows) {return oops(response,err,'**quiz/quizmistakes(1)')};
            mistakeCount += rows.length;
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                var questionNumber = row.questionNumber;
                var wrongChoice = row.wrong;
                var obj = {
                    questionNumber: questionNumber,
                    wrongChoice: wrongChoice,
                    rubric: row.rubricText,
                    correct: row.correctText,
                    wrong: row.wrongText,
                    count: row.count,
                    comments:[]
                };
                getComments(classID,quizNumber,questionNumber,wrongChoice,obj);
            }
        });
        function getComments (classID,quizNumber,questionNumber,wrongChoice,obj) {
            sys.db.all('SELECT c.commenter,s.string AS comment FROM comments AS c JOIN strings as s ON s.stringID=c.commentTextID WHERE classID=? AND quizNumber=? AND questionNumber=? AND choice=?',[classID,quizNumber,questionNumber,wrongChoice],function(err,rows){
                if (err||!rows) {return oops(response,err,'**quiz/quizmistakes(2)')};
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    obj.comments.push({commenter:row.commenter,comment:row.comment});
                    if (commenter === row.commenter) {
                        obj.hasCommenterComment = true;
                    }
                }
                mistakes.push(obj);
                mistakeCount += -1;
                if (!mistakeCount) {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(mistakes));
                }
            });
        }
    }
    exports.cogClass = cogClass;
})();
