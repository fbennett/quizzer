(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var questionNumber = params.questionno;
        var data = params.data;
        var strings = data.questions.slice();
        strings.push(data.rubric);
        var sys = this.sys;
        // data is:
        // {
        //   rubric: str
        //   questions: lst
        //   correct: num
        // }
        var sys = this.sys;
        var utils = this.utils;
        // START OVER
        var qObj = {
            haveStringId:{},
            needStringId:{},
            needStringIdList:[],
            choiceIdList:[null,null,null,null]
        };
        beginTransaction();

        

        function beginTransaction () {
            sys.db.run('BEGIN TRANSACTION',function(err){
                checkQuiz();
            })
        };

        // Check for existence of quiz, create if necessary, get ID
        function checkQuiz () {
            var sql = 'SELECT quizID FROM quizzes WHERE classID=? AND quizNumber=?;';
            sys.db.get(sql,[classID,quizNumber],function(err,row){
                if (err) {return oops(response,err,'quiz/writeonequestion(1)')}
                if (row && row.quizID) {
                    qObj.quizID = row.quizID;
                    checkStrings(0,5);
                } else {
                    createQuiz();
                }
            });
        }
        function createQuiz () {
            var sql = 'INSERT INTO quizzes VALUES(NULL,?,?,0,NULL,NULL);'
            sys.db.run(sql,[classID,quizNumber],function(err){
                if (err) {return oops(response,err,'quiz/writeonequestion(2)')};
                qObj.quizID = this.lastID;
                checkStrings(0,5);
            });
        };

        // Check for existence of strings, create if necessary, save IDs
        function checkStrings (pos,limit) {
            if (pos === limit) {
                createStrings(0,qObj.needStringIdList.length);
                return;
            }
            var sql = 'SELECT stringID FROM strings WHERE string=?;'
            var string = strings[pos];
            sys.db.get(sql,[string],function(err,row){
                if (err) {return oops(response,err,'quiz/writeonequestion(3)')};
                if (row && row.stringID) {
                    qObj.haveStringId[pos] = row.stringID;
                } else {
                    qObj.needStringId[pos] = strings[pos];
                    qObj.needStringIdList.push(pos);
                }
                checkStrings(pos+1,limit);
            });
        };
        function createStrings (pos,limit) {
            if (pos === limit) {
                checkQuestionNumber();
                return;
            }
            var sql = 'INSERT INTO strings VALUES (NULL,?)';
            var key = qObj.needStringIdList[pos];
            var string = qObj.needStringId[key];
            sys.db.run(sql,[string],function(err){
                if (err) {return oops(response,err,'quiz/writeonequestion(4)')};
                qObj.haveStringId[key] = this.lastID;
                createStrings(pos+1,limit);
            });
        };

        // Check for existence of question, create if necessary, save ID
        function checkQuestionNumber () {
            if (questionNumber == 0) {
                makeQuestionNumber();
            } else {
                qObj.questionNumber = questionNumber;
                checkQuestion();
            }
        };
        function makeQuestionNumber () {
            var sql = 'SELECT MAX(questionNumber) AS questionMax FROM quizzes JOIN questions USING(quizID) WHERE quizID=?'
            sys.db.get(sql,[qObj.quizID],function(err,row){
                if (err) {return oops(response,err,'quiz/writeonequestion(5)')};
                if (row && row.questionMax) {
                    qObj.questionNumber = (row.questionMax + 1);
                } else {
                    qObj.questionNumber = 1;
                }
                createQuestion();
            });
        };
        function createQuestion () {
            // Jumps to checkChoices
            var sql = 'INSERT INTO questions VALUES (NULL,?,?,?,?);'
            var quizID = qObj.quizID;
            var questionNumber = qObj.questionNumber;
            var correct = data.correct;
            var rubricID = qObj.haveStringId[4];
            sys.db.run(sql,[quizID,questionNumber,correct,rubricID],function (err) {
                if (err) {return oops(response,err,'quiz/writeonequestion(6)')};
                qObj.questionID = this.lastID;
                checkChoices();
            });
        };
        function checkQuestion () {
            // To updateQuestion
            var sql = 'SELECT questionID FROM questions WHERE quizID=? AND questionNumber=?;';
            var quizID = qObj.quizID;
            var questionNumber = qObj.questionNumber;
            sys.db.get(sql,[quizID,questionNumber],function(err,row){
                if (err||!row) {return oops(response,err,'quiz/writeonequestion(7)')};
                qObj.questionID = row.questionID;
                updateQuestion();
            });
        };
        function updateQuestion () {
            // To checkChoices
            var sql = 'UPDATE questions SET stringID=?,correct=? WHERE questionID=?;';
            var stringID = qObj.haveStringId[4];
            var correct = data.correct;
            var questionID = qObj.questionID;
            sys.db.run(sql,[stringID,correct,questionID],function(err){
                if (err) {return oops(response,err,'quiz/writeonequestion(8)')};
                checkChoices();
            });
        };
        function checkChoices() {
            // To writeChoices
            var sql = "SELECT choice,choiceID FROM choices WHERE questionID=? ORDER BY choice;";
            var questionID = qObj.questionID;
            sys.db.all(sql,[questionID],function(err,rows){
                if (err) {return oops(response,err,'quiz/writeonequestion(9)')}
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    qObj.choiceIdList[row.choice] = row.choiceID;
                }
                writeChoices(0,4);
            });
        };

        // Insert or replace is good enough for choices
        function writeChoices(pos,limit) {
            if (pos === limit) {
                endTransaction();
                return;
            }
            var sql = 'INSERT OR REPLACE INTO choices VALUES (?,?,?,?)';
            var choiceID = qObj.choiceIdList[pos];
            var questionID = qObj.questionID;
            var choice = pos;
            var stringID = qObj.haveStringId[pos];
            sys.db.run(sql,[choiceID,questionID,choice,stringID],function(err){
                if (err) {return oops(response,err,'quiz/writeonequestion(10)')};
                writeChoices(pos+1,limit);
            });
        };
        function endTransaction () {
            sys.db.run('END TRANSACTION',function(){
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(qObj.questionNumber));
            })
        };
    }
    exports.cogClass = cogClass;
})();
