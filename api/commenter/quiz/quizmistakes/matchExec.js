(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var commenter = this.sys.validCommenter(params).name;
        var commenterID = this.sys.validCommenter(params).id;
        // This gets us a clean list of wrong answers, with rubric, correct and wrong choices, and the stringID and text for each,
        // plus a count of the frequency of each error
        //
        // quizNumber  questionNumber  rubricID  rubricText  correct  correctID  correctText   wrong  wrongID  wrongText   COUNT(res.studentID)
        // ----------  --------------  --------  ----------  -------  ---------  ------------  -----  -------  ----------  --------------------
        // 3           1               3         How high a  1        30         A lot.        0      16       Ten meter   2                   
        // 3           1               3         How high a  1        30         A lot.        2      43       Many.       1                   
        //
        var mistakeCount = 0;
        var data = {commenter:commenter,commenterID:commenterID,mistakes:[],selections:[]};
        var sql = 'SELECT ruleID,string AS ruleText '
            + 'FROM classes '
            + 'JOIN rules USING(ruleGroupID) '
            + 'JOIN ruleStrings USING(ruleStringID) '
            + 'WHERE classID=? AND adminID IN (1,?);';
        sys.db.all(sql,[classID,commenterID],function(err,rows){
            if (err||!rows) {return oops(response,err,'**quiz/quizmistakes(0)')};
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                data.selections.push({ruleid:row.ruleID,ruletext:row.ruleText});
            }
            getMistakeData(classID,quizNumber);
        });

        
        function getMistakeData(classID,quizNumber) {
            var sql = "SELECT qq.questionNumber,"
                + "res.rubricID,r.string AS rubricText,"
                + "res.correct,res.correctID,cc.string AS correctText,"
                + "res.wrong,res.wrongID,ww.string AS wrongText,"
                + "COUNT(res.studentID) AS count,"
                + "COUNT(res.comment) AS commentCount,"
                + "group_concat(distinct res.lang) AS langs "
                + "FROM quizzes AS qz "
                + 'JOIN questions AS qq USING(quizID) '
                + "JOIN classes AS cls ON cls.classID=qz.classID "
                + "LEFT JOIN ("
                +     "SELECT DISTINCT que.questionID,que.questionNumber,que.correct,ach.choice AS wrong,"
                +     'qch.stringID AS correctID,'
                +     'ach.stringID AS wrongID,'
                +     'que.stringID AS rubricID,'
                +     'ans.studentID,'
                +     "com.choiceID AS comment,"
                +     "stu.lang "

                +     'FROM quizzes AS qui '
                +     'JOIN questions AS que USING(quizID) '
                +     'JOIN answers AS ans ON ans.questionID=que.questionID '
                +     "JOIN students AS stu ON stu.studentID=ans.studentID "
                +     'JOIN choices AS qch ON qch.questionID=que.questionID AND qch.choice=que.correct '
                +     'JOIN choices AS ach ON ach.questionID=que.questionID AND ach.choice=ans.choice '
                +     "LEFT JOIN comments AS com ON com.choiceID=ach.choiceID "
                +     "WHERE NOT ans.choice=que.correct AND qui.classID=? AND qui.quizNumber=? "
                +     "GROUP BY qui.quizNumber,que.questionNumber,ans.choice,ans.studentID"
                + ") as res ON res.questionID=qq.questionID "
                + "LEFT JOIN strings AS r ON r.stringID=res.rubricID "
                + "LEFT JOIN strings AS cc ON cc.stringID=res.correctID "
                + "LEFT JOIN strings AS ww ON ww.stringID=res.wrongID "
                + "WHERE qz.classID=? AND qz.quizNumber=? AND res.questionNumber IS NOT NULL "
                + "GROUP BY qz.quizNumber,res.questionNumber,res.wrong "
                + "ORDER BY commentCount,count DESC,langs;";
            sys.db.all(sql,[classID,quizNumber,classID,quizNumber],function(err,rows){
                if (err||!rows) {return oops(response,err,'**quiz/quizmistakes(1)')};
                mistakeCount += rows.length;
                if (!mistakeCount) {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(data));
                }
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    var questionNumber = row.questionNumber;
                    var wrongChoice = row.wrong;
                    var langs = row.langs;
                    var obj = {
                        questionNumber: questionNumber,
                        wrongChoice: wrongChoice,
                        langs:langs,
                        rubric: row.rubricText,
                        correct: row.correctText,
                        wrong: row.wrongText,
                        count: row.count,
                        comments:[],
                        rules:[]
                    };
                    data.mistakes.push(obj);
                    getMistakeRules(classID,quizNumber,questionNumber,wrongChoice,obj);
                }
            });
        };
        function getMistakeRules (classID,quizNumber,questionNumber,wrongChoice,obj) {
            var sql = 'SELECT rules.ruleID,ruleStrings.string AS ruleText '
                + 'FROM quizzes '
                + 'JOIN questions USING(quizID) '
                + 'JOIN choices USING(questionID) '
                + 'JOIN rulesToChoices USING(choiceID) '
                + 'JOIN rules USING(ruleID) '
                + 'JOIN ruleStrings USING(ruleStringID) '
                + 'WHERE classID=? AND quizNumber=? AND questionNumber=? AND choice=?';
            sys.db.all(sql,[classID,quizNumber,questionNumber,wrongChoice],function(err,rows){
                if (err||!rows) {return oops(response,err,'**quiz/quizmistakes(2)')};
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    obj.rules.push({ruleid:row.ruleID,ruletext:row.ruleText});
                }
                getComments(classID,quizNumber,questionNumber,wrongChoice,obj);
            });
        };
        function getComments (classID,quizNumber,questionNumber,wrongChoice,obj) {
            var sql = 'SELECT c.adminID AS commenterID,'
                + 'admin.name AS commenter,'
                + 's.string AS comment '
                + 'FROM quizzes AS qz '
                + 'NATURAL JOIN questions as que '
                + 'JOIN choices AS ch ON ch.questionID=que.questionID '
                + 'JOIN comments AS c ON c.choiceID=ch.choiceID '
                + 'JOIN admin AS admin USING(adminID) '
                + 'LEFT JOIN strings as s ON s.stringID=c.stringID '
                + 'WHERE classID=? AND quizNumber=? AND questionNumber=? AND ch.choice=?'
            sys.db.all(sql,[classID,quizNumber,questionNumber,wrongChoice],function(err,rows){
                if (err||!rows) {return oops(response,err,'**quiz/quizmistakes(2)')};
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    obj.comments.push({commenter:row.commenter,comment:row.comment,commenterID:row.commenterID});
                    if (commenterID === row.commenterID) {
                        obj.hasCommenterComment = true;
                    }
                }
                mistakeCount += -1;
                if (!mistakeCount) {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(data));
                }
            });
        }
    }
    exports.cogClass = cogClass;
})();
