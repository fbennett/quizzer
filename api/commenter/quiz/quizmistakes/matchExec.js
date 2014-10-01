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
        var commenterKey = params.commenter;
	var locale = this.sys.locale;
	var getCommenterLanguages = this.utils.getCommenterLanguages;
	var getMistakenChoices = this.utils.getMistakenChoices;
        // This gets us a clean list of wronga answers, with rubric, correct and wrong choices, and the stringID and text for each,
        // plus a count of the frequency of each error
        //
        // quizNumber  questionNumber  rubricID  rubricText  correct  correctID  correctText   wrong  wrongID  wrongText   COUNT(res.studentID)
        // ----------  --------------  --------  ----------  -------  ---------  ------------  -----  -------  ----------  --------------------
        // 3           1               3         How high a  1        30         A lot.        0      16       Ten meter   2                   
        // 3           1               3         How high a  1        30         A lot.        2      43       Many.       1                   
        //
        // Project: Adjust sort behavior so that commenter gets items
        // in his/her own language(s) at the top of the listing. More
        // precisely, the order of sort keys should be: (1) commented
        // in instance language or not [boolean DESC for non-instance
        // languages, ASC for instance language]; then (2) fully
        // commented in commenter's own language(s) or not [boolean
        // ASC]; then (2) frequency of error [integer DESC].
        //
        // Uh-oh, sort of. DB schema does not flag the language of a
        // comment, and commenters can only add one comment each to a
        // given mistake. So ... it needs not to *break* if commenter
        // has multiple languages, but for management simplicity, a
        // commenter should be designated to only one language, and
        // stay there.
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
            getCommenterLanguages(commenterKey,getMistakeData);
        });

	        
        function getMistakeData(commenterLangs) {
            var mistakenChoices = getMistakenChoices(locale,commenterLangs,classID,quizNumber);
            //console.log("XX "+mistakenChoices.sql);
            //console.log("XX "+mistakenChoices.vars);
            var sql = "SELECT questions.questionNumber,"
                + "questions.stringID AS rubricID,RUBRIC.string AS rubricText,"
                + "CHOICE.choice AS correct,CHOICE.stringID AS correctID,CORRECT.string AS correctText,"
                + "MISTAKE.wrong,MISTAKE.choiceID AS wrongID,WRONG.string AS wrongText,"
                + "COUNT(students.studentID) AS count,"
                + "CASE WHEN COUNT(comments.commentID)>0 THEN 1 ELSE 0 END AS commentCount,"
                + "group_concat(DISTINCT students.lang) AS langs "
                + "FROM classes "
                + "JOIN quizzes USING(classID) "
                + 'JOIN questions USING(quizID) '
                + "JOIN ("
                + mistakenChoices.sql
                + ") MISTAKE ON MISTAKE.classID=classes.classID AND MISTAKE.quizNumber=quizzes.quizNumber AND MISTAKE.questionNumber=questions.questionNumber "
                + "JOIN choices CHOICE ON CHOICE.questionID=questions.questionID AND CHOICE.choice=questions.correct "
                + "JOIN answers ANSWERS ON ANSWERS.questionID=questions.questionID AND ANSWERS.choice=MISTAKE.wrong "
                + "JOIN strings CORRECT ON CORRECT.stringID=CHOICE.stringID "
                + "JOIN strings WRONG ON WRONG.stringID=MISTAKE.stringID "
                + "JOIN strings RUBRIC ON RUBRIC.stringID=questions.stringID "
		        + "JOIN students ON students.studentID=ANSWERS.studentID "
		        + "LEFT JOIN comments ON comments.choiceID=MISTAKE.choiceID "
                + "WHERE classes.classID=? AND quizzes.quizNumber=? "
                + "GROUP BY quizzes.quizNumber,questions.questionNumber,MISTAKE.wrong "
                + "ORDER BY commentCount,count DESC,langs;";
            var sqlVars = mistakenChoices.vars;
            console.log("XXX sql: "+sql);
            sqlVars.push(classID);
            sqlVars.push(quizNumber);
            console.log("XXX sqlVars: "+sqlVars);
            sys.db.all(sql,sqlVars,function(err,rows){
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
