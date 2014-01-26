(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var studentID = params.studentid;
        var studentLang;
        var items = [];

        getStudentLanguage();

        function getStudentLanguage () {
            console.log("(1)");
            var sql = 'SELECT lang FROM students WHERE studentID=?';
            sys.db.get(sql,[studentID],function(err,row){
                if (err) {return oops(response,err,'*quiz/myquizresult(0)')};
                studentLang = row.lang;
                setEntryPlaceholders();
            });
        }

        function setEntryPlaceholders () {
            console.log("(2)");
            var sql = 'SELECT questionNumber '
                + 'FROM answers '
                + 'NATURAL JOIN questions '
                + 'JOIN quizzes USING (quizID) '
                + 'WHERE quizzes.classID=? AND quizzes.quizNumber=? AND answers.studentID=? AND NOT answers.choice=questions.correct';
            sys.db.all(sql,[classID,quizNumber,studentID],function(err,rows){
                if (err||!rows) {return oops(response,err,'*quiz/myquizresult(1)')};
                if (rows.length) {
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        items.push({questionNumber:row.questionNumber});
                    }
                    getMistakes(0,items.length);
                } else {
                    var data = JSON.stringify([])
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(data);
                }
            });
        }

        function getMistakes (pos,limit) {
            console.log("(3)");
            var sql = 'SELECT rubric.string AS rubric,right.string AS right,wrong.string AS wrong,wrong.choice AS wrongChoice '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'JOIN answers USING(questionID) '
                + 'JOIN strings AS rubric USING(stringID) '
                + 'JOIN ('
                +     'SELECT questionID,string '
                +     'FROM questions '
                +     'JOIN choices USING(questionID) '
                +     'JOIN strings ON strings.stringID=choices.stringID '
                +     'WHERE choices.choice=questions.correct'
                + ') AS right USING(questionID) '
                + 'JOIN ('
                +     'SELECT questionID,string,answers.choice '
                +     'FROM questions '
                +     'JOIN answers USING(questionID) '
                +     'JOIN choices USING(questionID,choice) '
                +     'JOIN strings ON strings.stringID=choices.stringID'
                + ') AS wrong USING (questionID) '
                + 'WHERE quizzes.classID=? AND quizzes.quizNumber=? AND questions.questionNumber=? AND answers.studentID=?'
            var questionNumber = items[pos].questionNumber;
            sys.db.get(sql,[classID,quizNumber,questionNumber,studentID],function(err,row) {
                if (err||!row) {return oops(response,err,'*quiz/myquizresult(2)')}
                items[pos].rubric = row.rubric;
                items[pos].right = row.right;
                items[pos].wrong = row.wrong;
                items[pos].wrongChoice = row.wrongChoice;
                pos += 1;
                if (pos === items.length) {
                    getGoodAnswerStudents(0,limit);
                } else {
                    getMistakes(pos,limit);
                }
            });
        };

        function getGoodAnswerStudents(pos,limit) {
            console.log("(4)");
            var sql = 'SELECT name '
                + 'FROM quizzes '
                + 'JOIN questions USING(quizID) '
                + 'JOIN answers USING(questionID) '
                + 'JOIN students USING(studentID) '
                + 'WHERE quizzes.classID=? AND quizzes.quizNumber=? AND questions.questionNumber=? AND questions.correct=answers.choice'
            var questionNumber = items[pos].questionNumber;
            sys.db.all(sql,[classID,quizNumber,questionNumber],function(err,rows){
                if (err||!rows) {return oops(response,err,'*quiz/myquizresult(3)')}
                items[pos].goodAnswerStudents = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    items[pos].goodAnswerStudents.push(row.name);
                }
                pos += 1;
                if (pos === items.length) {
                    getRules(0,limit);
                } else {
                    getGoodAnswerStudents(pos,limit);
                }
            });
        };


        function getRules(pos,limit) {
            console.log("(5)");
            var sql = 'SELECT r.string AS ruleText,'
                + 'CASE WHEN rtO.string IS NOT NULL THEN rtO.string ELSE CASE WHEN rtE.string IS NOT NULL THEN rtE.string ELSE \'\' END END AS ruleGloss '
                + 'FROM quizzes '
                + 'JOIN questions USING(quizID) '
                + 'JOIN choices USING(questionID) '
                + 'JOIN answers USING(questionID) '
                + 'JOIN students USING(studentID) '
                + 'JOIN rulesToChoices USING(choiceID) '
                + 'JOIN rules USING(ruleID) '
                + 'JOIN ruleStrings AS r USING(ruleStringID) '
                + 'LEFT JOIN ('
                +   'SELECT ruleID,string '
                +   'FROM ruleTranslations '
                +   'WHERE lang=\'en\''
                + ') AS rtE USING(ruleID) '
                + 'LEFT JOIN ('
                +   'SELECT ruleID,string '
                +   'FROM ruleTranslations '
                +   'WHERE lang=?'
                + ') AS rtO USING(ruleID) '
                + 'WHERE quizzes.classID=? AND quizNumber=? AND questionNumber=?';
            var questionNumber = items[pos].questionNumber;
            sys.db.all(sql,[studentLang,classID,quizNumber,questionNumber],function(err,rows){
                if (err||!rows) {return oops(response,err,'*quiz/myquizresult(4)')};
                items[pos].rules = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    items[pos].rules.push({ruleText:row.ruleText,ruleGloss:row.ruleGloss});
                }
                pos += 1;
                if (pos === items.length) {
                    getComments(0,limit);
                } else {
                    getRules(pos,limit);
                }
            });
        };

        function getComments(pos,limit) {
            console.log("(6)");
            var sql = 'SELECT admin.name AS commenter,s.string AS comment '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'JOIN choices USING(questionID) '
                + 'JOIN comments USING(choiceID) '
                + 'JOIN admin USING(adminID) '
                + 'LEFT JOIN strings AS s ON s.stringID=comments.stringID '
                + 'WHERE quizzes.classID=? AND quizzes.quizNumber=? AND questions.questionNumber=? AND choices.choice=?'
            var questionNumber = items[pos].questionNumber;
            var wrongChoice = items[pos].wrongChoice;
            sys.db.all(sql,[classID,quizNumber,questionNumber,wrongChoice],function(err,rows){
                if (err||!rows) {return oops(response,err,'*quiz/myquizresults(5)')};
                items[pos].comments = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    items[pos].comments.push({commenter:row.commenter,comment:row.comment});
                }
                pos += 1;
                if (pos === items.length) {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(items));
                    console.log(JSON.stringify(items,null,2))
                } else {
                    getComments(pos,limit);
                }
            });
        };
    }
    exports.cogClass = cogClass;
})();
