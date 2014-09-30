(function () {
    var utilClass = function (sys) {
        this.sys = sys;
    };
    utilClass.prototype.getUtils = function () {
        var sys = this.sys;
        return {

            getCommenterLanguages: function(commenterKey,callback) {
                var sql = "SELECT adminID,lang FROM admin LEFT JOIN adminLanguages USING (adminID) WHERE adminKey=?;"
                sys.db.all(sql,[commenterKey],function(err,rows){
                    if (err||!rows) {return oops(response,err,'class/readquizzes(1)')};
                    var commenterLangs = [];
                    for (var i=0,ilen=rows.length;i<ilen;i++) {
                        var commenter = rows[i];
                        commenterID = commenter.adminID;
                        if (commenter.lang) {
                            commenterLangs.push(commenter.lang);
                        }
                    }
                    callback(commenterLangs);
                });
            },
            
            getMistakenChoices: function (locale,commenterLangs,classID,quizNumber) {
                
                if (commenterLangs) {
                    if (commenterLangs.length) {
                        if (commenterLangs.indexOf(locale) > -1) {
                            commenterLangs = false;
                        }
                    } else {
                        commenterLangs = false;
                    }
                }
                
                function getSQL() {
                    
                    var sql = "SELECT classID,quizNumber,choices.choice AS wrong,choices.stringID,choices.choiceID," + returnColumns(commenterLangs) + " "
                        +   "FROM quizzes "
                        +   "JOIN questions USING(quizID) "
                        +   "JOIN choices USING(questionID) "
                        +   "JOIN answers USING(questionID,choice) "
                        +   "JOIN students USING(studentID) "
                        +   "LEFT JOIN ("
                        +     "SELECT choiceID "
                        +     "FROM quizzes "
                        +     "JOIN questions USING(quizID) "
                        +     "JOIN choices USING(questionID) "
                        +     "JOIN answers USING(questionID,choice) "
                        +     "JOIN comments USING(choiceID)"
                        +     "JOIN admin USING(adminID) "
                        +     "JOIN adminLanguages USING(adminID) "
                        +     "WHERE " + classCondition() + quizCondition() + "NOT answers.choice=questions.correct AND lang=? " // instance lang
                        +   ") INSTANCE USING(choiceID) "
                        +   otherLanguageJoin(commenterLangs)
                        +   "LEFT JOIN rulesToChoices USING(choiceID) "
                        +   "WHERE " + classCondition() + quizCondition() + "NOT answers.choice=questions.correct AND " + innerSelectConditions(commenterLangs) + " "
                        +   "GROUP BY quizzes.quizNumber, questions.questionNumber, choices.choice ";
                    
                    function classCondition() {
                        if (classID) {
                            return "classID=? AND ";
                        } else {
                            return "";
                        }
                    }

                    function quizCondition() {
                        if (quizNumber) {
                            return "quizNumber=? AND ";
                        } else {
                            return "";
                        }
                    }

                    function returnColumns(commenterLangs) {
                        var sub = {
                            locale: "CASE WHEN INSTANCE.choiceID IS NULL THEN 1 ELSE NULL END AS commentNeeded",
                            langs: "CASE WHEN INSTANCE.choiceID IS NOT NULL AND COUNT(OTHER.choiceID) < " + commenterLangs.length + " THEN 1 ELSE NULL END AS commentNeeded"
                        }
                        return commenterLangs ? sub.langs : sub.locale;
                    }
                    
                    function otherLanguageJoin(commenterLangs) {
                        var sub = {
                            locale: '',
                            langs: "LEFT JOIN ("
                                +     "SELECT choiceID "
                                +     "FROM quizzes "
                                +     "JOIN questions USING(quizID) "
                                +     "JOIN choices USING(questionID) "
                                +     "JOIN answers USING(questionID,choice) "
                                +     "JOIN comments USING(choiceID) "
                                +     "JOIN admin USING(adminID) "
                                +     "JOIN adminLanguages USING(adminID) "
                                +     "WHERE " + classCondition() + quizCondition() + "NOT answers.choice=questions.correct AND lang IN (" + langSQL() + ") "
                                +   ") OTHER USING(choiceID) "
                        }
                        return commenterLangs ? sub.langs : sub.locale;
                    }
                    
                    function innerSelectConditions(commenterLangs) {
                        sub = {
                            locale: "INSTANCE.choiceID IS NULL AND rulesToChoices.choiceID IS NULL ",
                            langs: "students.lang IN (" + langSQL() + ") AND INSTANCE.choiceID IS NOT NULL AND OTHER.choiceID IS NULL "
                        }
                        return commenterLangs ? sub.langs : sub.locale;
                    }               
                    
                    function langSQL () {
                        var ret = [];
                        for (var i=0,ilen=commenterLangs.length;i<ilen;i++) {
                            ret.push('?');
                        }
                        return ret.join(',');
                    };

                    return sql;
                };

                function getSqlVars () {
                    var sqlVars;
                    if (!commenterLangs) {
                        // Instance lang mode
                        sqlVars = [];
                        classID ? sqlVars.push(classID) : null;
                        quizNumber ? sqlVars.push(quizNumber) : null;
                        sqlVars.push(locale);
                        classID ? sqlVars.push(classID) : null;
                        quizNumber ? sqlVars.push(quizNumber) : null;
                    } else {
                        // Commenter lang mode
                        sqlVars = [];
                        classID ? sqlVars.push(classID) : null;
                        quizNumber ? sqlVars.push(quizNumber) : null;
                        sqlVars.push(locale);
                        classID ? sqlVars.push(classID) : null;
                        quizNumber ? sqlVars.push(quizNumber) : null;
                        for (var i=0,ilen=commenterLangs.length;i<ilen;i++) {
                            sqlVars.push(commenterLangs[i]);
                        }
                        classID ? sqlVars.push(classID) : null;
                        quizNumber ? sqlVars.push(quizNumber) : null;
                        for (var i=0,ilen=commenterLangs.length;i<ilen;i++) {
                            sqlVars.push(commenterLangs[i]);
                        }
                    }
                    return sqlVars;
                }
                return { sql: getSQL(), vars: getSqlVars() }
            },


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
                    if (pos === limit) {
                        endTransaction();
                        return;
                    }
                    var sql = 'INSERT OR REPLACE INTO choices VALUES (NULL,?,?,?)';
                    var questionID = qObj.questionID;
                    var choice = pos;
                    var stringID = qObj.haveStringId[pos];
                    sys.db.run(sql,[questionID,choice,stringID],function(err){
                        if (err) {return oops(response,err,'quiz/writeonequestion(9)')};
                        writeChoices(pos+1,limit);
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
                var sql = "SELECT s.name,s.studentID AS studentID,m.studentID AS enroled,sh.studentID AS showing,privacy "
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
                        var dataitem = {name:row.name,studentid:row.studentID,privacy:row.privacy};
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
