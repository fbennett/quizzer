(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var data = {};
        data.classID = params.classid;
        data.examTitle = params.examtitle;
        data.examDate = params.examdate;
        data.questions = [];
        var examNumberOfQuestions = params.examnumberofquestions;
        var quizNumberMax;
        var choicesCount = 0;

        console.log("Creating exam: title='"+data.examTitle+"', date='"+data.examDate+"', number-of-questions="+examNumberOfQuestions);
        // Get the questionID for questions in each quiz for this class that is not an examination
        getQuizzes();

        function getQuizzes () {
            var sql = 'SELECT quizNumber,questionID,sent,examName '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'WHERE classID=? '
                + 'ORDER BY quizNumber;'
            sys.db.all(sql,[data.classID],function(err,rows){
                if (err||!rows) {return oops(response,err,'class/createexam(1)')};
                var quizQuestionIDs = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    quizNumberMax = row.quizNumber;
                    if (row.sent !== 1 || row.examName) continue;
                    quizQuestionIDs.push(row.questionID);
                }
                sys.randomize(quizQuestionIDs);
                quizQuestionIDs = quizQuestionIDs.slice(0,examNumberOfQuestions);
                getQuestions(quizQuestionIDs);
            });
        }

        function getQuestions(quizQuestionIDs) {
            console.log("RUN: getQuestions()");
            var sqlparams = [];
            for (i=0,ilen=quizQuestionIDs.length;i<ilen;i+=1) {
                sqlparams.push(quizQuestionIDs[i]);
            }
            console.log("  getting these questions: "+sqlparams);
            var sql = 'SELECT correct,stringID,questionID FROM questions WHERE questionID IN (' + sqlparams + ')';
            sys.db.all(sql,function(err,rows){
                if (err||!rows) {return oops(response,err,'class/createexam(1)')};
                choicesCount += (rows.length * 4);
                console.log("choicesCount set to: "+choicesCount);
                for (i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    var qobj = {
                        correct:row.correct,
                        rubricID:row.stringID,
                        choices:[]
                    }
                    data.questions.push(qobj);
                    getChoicesRepeater(qobj,row.questionID,0,4);
                }
            });
            function getChoicesRepeater(qobj,questionID,pos,limit) {
                var sql = 'SELECT stringID FROM choices WHERE questionID=? AND choice=?';
                sys.db.get(sql,[questionID,pos],function(err,row){
                    if (err) {return oops(response,err,'class/createexam(2)')};
                    if (pos < limit) {
                        console.log("choicesCount decremented to: "+choicesCount);
                        qobj.choices[pos] = row.stringID;
                        getChoicesRepeater(qobj,questionID,pos+1,limit);
                        choicesCount += -1;
                        if (!choicesCount) {
                            saveExam();
                        }
                    }
                });
            }
        }

        function saveExam() {
            console.log("RUN: saveExam()");
            // Create a fresh quiz, with sent=-1
            var quizNumber = quizNumberMax + 1;
            sys.db.run('INSERT INTO quizzes VALUES (NULL,?,?,?,?,?)',[data.classID,quizNumber,0,data.examTitle,data.examDate],function(err){
                if (err) {return oops(response,err,'class/createexam(3)')};
                var quizID = this.lastID;
                choicesCount += (data.questions.length * 4);
                saveQuestionsRepeater(quizID,quizNumber,0,data.questions.length);
            });
        }

        function saveQuestionsRepeater(quizID,quizNumber,pos,limit) {
            if (pos < limit) {
                console.log("RUN: saveQuestionsRepeater("+pos+")");
                // Recast the questions on the fresh quiz
                var questionNumber = (pos + 1);
                var correct = data.questions[pos].correct;
                var stringID = data.questions[pos].rubricID;
                var sql = 'INSERT INTO questions VALUES (NULL,?,?,?,?)';
                sys.db.run(sql,[quizID,questionNumber,correct,stringID],function(err){
                    if (err) {return oops(response,err,'class/createexam(4)')};
                    saveQuestionsRepeater(quizID,quizNumber,pos+1,limit);
                    var questionID = this.lastID;
                    saveChoicesRepeater(questionID,pos,0,4);
                });
            } else {
                // Finished registering questions
                // This will finish before choices are all registered, so
                // do nothing.
            }
        }
        function saveChoicesRepeater(questionID,qindex,pos,limit){
            console.log("saveChoicesRepeater: "+questionID+" "+qindex+" "+pos+" "+limit);
            if (pos < limit) {
                var stringID = data.questions[qindex].choices[pos];
                var sql = 'INSERT INTO choices VALUES (NULL,?,?,?)';
                sys.db.run(sql,[questionID,pos,stringID],function(err){
                    if (err) {return oops(response,err,'class/createexam(5)')};
                    saveChoicesRepeater(questionID,qindex,pos+1,limit);
                    choicesCount += -1;
                    console.log("choicesCount is: "+choicesCount);
                    if (!choicesCount) {
                        // Done! What now?
                        response.writeHead(200, {'Content-Type': 'application/json'});
                        response.end(JSON.stringify(['success']));
                    }
                });
            }
        };
    }
    exports.cogClass = cogClass;
})();
