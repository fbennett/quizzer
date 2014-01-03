(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var examTitle = params.examtitle;
        var examDate = params.examdate;
        var examNumberOfQuestions = params.examnumberofquestions;
        var quizNumberMax;
        var quizQuestionCount = 0;

        console.log("Creating exam: title='"+examTitle+"', date='"+examDate+"', number-of-questions="+examNumberOfQuestions);
        // Get the questionID for questions in each quiz for this class that is not an examination
        // (i.e. all that have sent=1 exactly set in the quizzes table)
        // (exams will have sent=-1 or sent=2)
        getQuizzes();

        function getQuizzes () {
            sys.db.all('SELECT q.quizNumber,qq.questionID,q.sent FROM quizzes AS q JOIN questions AS qq ON qq.classID=q.classID AND qq.quizNumber=q.quizNumber WHERE q.classID=? ORDER BY q.quizNumber',[classID],function(err,rows){
                if (err||!rows) {return oops(response,err,'class/createexam(1)')};
                var quizQuestionIDs = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    quizNumberMax = row.quizNumber;
                    if (row.sent !== 1) continue;
                    quizQuestionIDs.push(row.questionID);
                }
                sys.randomize(quizQuestionIDs);
                quizQuestionIDs = quizQuestionIDs.slice(0,examNumberOfQuestions);
                getQuestions(quizQuestionIDs);
            });
        }

        function getQuestions(quizQuestionIDs) {
            console.log("RUN: getQuestions()");
            var sqlslots = [];
            var sqlparams = [];
            for (i=0,ilen=quizQuestionIDs.length;i<ilen;i+=1) {
                sqlparams.push(quizQuestionIDs[i]);
                sqlslots.push('?');
            }
            console.log("  getting these questions: "+sqlparams);
            var sql = 'SELECT q.rubricID,'
                + 'q.correct,'
                + 'q.qOneID,q.qTwoID,q.qThreeID,q.qFourID,'
                + 'r.string AS rubric,'
                + 'one.string AS one,two.string AS two,three.string AS three,four.string AS four '
                + 'FROM questions AS q '
                + 'LEFT JOIN strings AS r ON r.stringID=q.rubricID '
                + 'LEFT JOIN strings AS one ON one.stringID=q.qOneID '
                + 'LEFT JOIN strings AS two ON two.stringID=q.qTwoID '
                + 'LEFT JOIN strings AS three ON three.stringID=q.qThreeID ' 
                + 'LEFT JOIN strings AS four ON four.stringID=q.qFourID '
                + 'WHERE q.questionID IN (' + sqlslots.join(',') + ')'
            sys.db.all(sql,sqlparams,function(err,rows){
                if (err||!rows) {return oops(response,err,'class/createexam(2)')};
                var quizQuestions = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    quizQuestions.push({
                        rubricID:row.rubricID,
                        correct:row.correct,
                        qOneID:row.qOneID,
                        qTwoID:row.qTwoID,
                        qThreeID:row.qThreeID,
                        qFourID:row.qFourID,
                        rubric:row.rubric,
                        choices: [
                            row.one,
                            row.two,
                            row.three,
                            row.four
                        ]
                    });
                }
                // Randomize the list of questions
                sys.randomize(quizQuestions);
                // Slice off the first N questions; this is our set
                quizQuestions = quizQuestions.slice(0,examNumberOfQuestions);
                saveExam(quizQuestions);
            });
        }

        function saveExam(quizQuestions) {
            console.log("RUN: saveExam()");
            // Create a fresh quiz, with sent=-1
            var quizNumber = quizNumberMax + 1;
            sys.db.run('INSERT OR REPLACE INTO quizzes VALUES (NULL,?,?,?,?,?)',[classID,quizNumber,-1,examTitle,examDate],function(err){
                if (err) {return oops(response,err,'class/createexam(3)')};
                saveQuestions(quizNumber,quizQuestions)
            });
        }

        function saveQuestions(quizNumber,quizQuestions) {
            console.log("RUN: saveQuestions()");
            // Recast the questions on the fresh quiz
            quizQuestionCount += quizQuestions.length;
            for (var i=0,ilen=quizQuestions.length;i<ilen;i+=1) {
                quizQuestion = quizQuestions[i];
                var questionNumber = (i + 1);
                var rubricID = quizQuestion.rubricID;
                var correct = quizQuestion.correct;
                var qOneID = quizQuestion.qOneID;
                var qTwoID = quizQuestion.qTwoID;
                var qThreeID = quizQuestion.qThreeID;
                var qFourID = quizQuestion.qFourID;
                //console.log("  try database insert: "+classID+" "+quizNumber+" "+questionNumber+" "+correct+" "+rubricID+" "+qOneID+" "+qTwoID+" "+qThreeID+" "+qFourID);
                sys.db.run('INSERT INTO questions VALUES (NULL,?,?,?,?,?,?,?,?,?)',[classID,quizNumber,questionNumber,correct,rubricID,qOneID,qTwoID,qThreeID,qFourID],function(err){
                    if (err) {return oops(response,err,'class/createexam(4)')};
                    quizQuestionCount += -1;
                    if (!quizQuestionCount) {
                        response.writeHead(200, {'Content-Type': 'application/json'});
                        response.end(JSON.stringify({success:true}));
                    }
                });
            }
        }

    }
    exports.cogClass = cogClass;
})();
