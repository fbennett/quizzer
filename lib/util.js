(function () {
    var utilClass = function (sys) {
        this.sys = sys;
    };
    utilClass.prototype.getUtils = function () {
        var sys = this.sys;
        return {
            writeQuestion: function (response,classID,quizNumber,questionNumber,data) {
                var oops = this.apiError;
                var sys = this.sys;

                var qObj = {
                    haveStringId:{},
                    needStringId:{},
                    needStringIdList:[]
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
                        pos += 1;
                        if (pos == limit) {
                            createStrings(0,qObj.needStringIdList.length);
                        } else {
                            checkStrings(pos,limit);
                        }
                    });
                };
                function createStrings (pos,limit) {
                    if (pos < limit) {
                        var sql = 'INSERT INTO strings VALUES (NULL,?)';
                        var key = qObj.needStringIdList[pos];
                        var string = qObj.needStringId[key];
                        sys.db.run(sql,[string],function(err){
                            if (err) {return oops(response,err,'quiz/writeonequestion(4)')};
                            qObj.haveStringId[key] = this.lastID;
                            pos += 1;
                            createStrings(pos,limit);
                        });
                    } else {
                        checkQuestionNumber();                
                    }
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
                        writeChoices(0,4);
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
                        writeChoices(0,4);
                    });
                };

                // Insert or replace is good enough for choices
                function writeChoices(pos,limit) {
                    var sql = 'INSERT OR REPLACE INTO choices VALUES (NULL,?,?,?)';
                    var questionID = qObj.questionID;
                    var choice = pos;
                    var stringID = qObj.haveStringId[pos];
                    sys.db.run(sql,[questionID,choice,stringID],function(err){
                        if (err) {return oops(response,err,'quiz/writeonequestion(9)')};
                        pos += 1;
                        if (pos == limit) {
                            endTransaction();
                        } else {
                            writeChoices(pos,limit);
                        }
                    });
                };
                function endTransaction () {
                    sys.db.run('END TRANSACTION',function(){
                        response.writeHead(200, {'Content-Type': 'application/json'});
                        response.end(JSON.stringify(qObj.questionNumber));
                    })
                };
            },
            getClassMemberships: function (params,request,response) {
                var oops = this.apiError;
                var classID = params.classid;
                var sql = "SELECT s.name,s.studentID AS studentID,m.studentID AS enroled,sh.studentID AS showing "
                    + "FROM students AS s "
                    + "LEFT JOIN ("
                    +   "SELECT classID,studentID "
                    +   "FROM memberships "
                    +     "WHERE classID=?"
                    + ") AS m ON m.studentID=s.studentID "
                    + 'LEFT JOIN ('
                    +   'SELECT studentID FROM showing AS mysh '
                    +   'WHERE mysh.classID=?'
                    + ') AS sh ON sh.studentID=s.studentID'
                sys.db.all(sql,[classID,classID],function(err,rows) {
                    if (err||!rows) {return oops(response,err,'getClassMemberships()')};
                    var rowsets = [[],[]];
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        var dataitem = {name:row.name,studentid:row.studentID};
                        if (row.enroled) {
                            rowsets[0].push(dataitem);
                        } else if (row.showing) {
                            rowsets[1].push(dataitem);
                        }
                    }
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(rowsets));
                });
            },
            apiError: function (response,err,str,transaction) {
                if (str) {
                    str = " in " + str;
                } else {
                    str = "";
                }
                if (err) {
                    console.log("Error" + str + ": " + err)
                } else {
                    console.log("Warning" + str + ": no results returned");
                }
                sys.db.run('ROLLBACK TRANSACTION',function(err){
                    response.writeHead(500, {'Content-Type': 'text/plain'});
                    response.end('server-side error or warning');
                });
            },
            getChoices: function (response,obj,questionID,callback) {
                var oops = this.apiError;
                var sql = 'SELECT questionNumber,one.string AS one,two.string AS two,three.string AS three,four.string AS four '
                    + 'FROM questions '
                    + 'JOIN ('
                    +   'SELECT questionID,string '
                    +   'FROM choices '
                    +   'NATURAL JOIN strings '
                    +   'WHERE questionID=? AND choice=0'
                    + ') AS one ON one.questionID=questions.questionID '
                    + 'JOIN ('
                    +   'SELECT questionID,string '
                    +   'FROM choices '
                    +   'NATURAL JOIN strings '
                    +   'WHERE questionID=? AND choice=1'
                    + ') AS two ON two.questionID=questions.questionID '
                    + 'JOIN ('
                    +   'SELECT questionID,string '
                    +   'FROM choices '
                    +   'NATURAL JOIN strings '
                    +   'WHERE questionID=? AND choice=2'
                    + ') AS three ON three.questionID=questions.questionID '
                + 'JOIN ('
                    +   'SELECT questionID,string '
                    +   'FROM choices '
                    +   'NATURAL JOIN strings '
                    +   'WHERE questionID=? AND choice=3'
                    + ') AS four ON four.questionID=questions.questionID '
                    + 'WHERE questions.questionID=?'
                sys.db.get(sql,[questionID,questionID,questionID,questionID,questionID],function(err,row){
                    if (err||!row) {return oops(response,err,'getChoices()')};
                    callback(obj,row);
                });
            }
        }
    }
    exports.utilClass = utilClass;
})();
