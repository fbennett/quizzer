(function () {
    var utilClass = function (sys) {
        this.sys = sys;
    };
    utilClass.prototype.getUtils = function () {
        var sys = this.sys;
        return {
            writeQuestion: function (response,classID,quizNumber,questionNumber,data) {
                var oops = this.apiError;
                var stringsCount = 0;
                var choicesCount = 0;
                // data travels across the functions.
                // It starts off with text content and the correct answer index, viz:
                // data = {
                //   rubric: rubric,
                //   questions: questions,
                //   correct: correct
                // }
                //
                // (During string creation, we temporarily add the rubric to the end of questions)
                var sql = 'SELECT quizzes.quizID,MAX(questionNumber) AS questionNumber '
                    + 'FROM quizzes '
                    + 'LEFT JOIN questions USING(quizID) '
                    + 'WHERE classID=? AND quizNumber=?;'
                sys.db.get(sql,[classID,quizNumber],function(err,row) {
                    if (err) {return oops(response,err,'utils/writeQuestion(1)')};
                    if (row && row.quizID) {
                        data.quizID = row.quizID;
                        if (questionNumber == 0) {
                            data.questionNumber = (row.questionNumber+1);
                        } else {
                            data.questionNumber = row.questionNumber;
                        }
                        confirmStrings();
                    } else {
                        var sql = 'INSERT INTO quizzes VALUES (NULL,?,?,0,NULL,NULL);'
                        // Constraints here are on 
                        sys.db.run(sql,[classID,quizNumber],function(err){
                            if (err) {return oops(response,err,'utils/writeQuestion(2)')}
                            data.quizID = this.lastID;
                            data.questionNumber = 1;
                            confirmStrings();
                        });
                    }
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(data.questionNumber));
                });
                // Okay, time to clean this up.
                // (1) Establish the strings and add the string IDs to data object
                // (2) Write all the questions
                // (3) Write all the choices
                function confirmStrings() {
                    var strings = data.questions.slice();
                    strings.push(data.rubric);
                    stringsCount += strings.length;
                    writeStringRepeater(strings,0,5);
                };
                function writeStringRepeater(strings,pos,limit) {
                    if (pos < limit) {
                        console.log("Trying to write: "+strings[pos]);
                        sys.db.get('SELECT stringID FROM strings WHERE string=?',[strings[pos]],function(err,row){
                            if (err) {return oops(response,err,'utils/writeQuestion/writeString(1)')}
                            if (row && row.stringID) {
                                console.log("  confirming "+row.stringID+" for "+strings[pos]);
                                strings[pos] = row.stringID;
                                writeStringRepeater(strings,pos+1,limit);
                            } else {
                                sys.db.run('INSERT INTO strings VALUES (NULL,?)',[strings[pos]],function(err){
                                    if (err) {return oops(response,err,'utils/writeQuestion/writeString(2)')};
                                    console.log("  created "+this.lastID+" for "+strings[pos]);
                                    strings[pos] = this.lastID;
                                    writeStringRepeater(strings,pos+1,limit);
                                });
                            }
                        });
                    } else {
                        data.rubric = strings.pop();
                        data.questions = strings;
                        saveQuestion();
                    }
                };
                function saveQuestion() {
                    var sql = 'SELECT questionID '
                        + 'FROM quizzes '
                        + 'NATURAL JOIN questions '
                        + 'WHERE classID=? AND quizNumber=? AND questionNumber=?';
                    sys.db.get(sql,[classID,quizNumber,data.questionNumber],function(err,row){
                        if (err) {return oops(response,err,'utils/writeQuestion/saveQuestion(1)')};
                        var questionID = null;
                        if (row && row.questionID) {
                            data.questionID = row.questionID;
                            saveChoices();
                        } else {
                            var sql = 'INSERT OR REPLACE INTO questions VALUES (?,?,?,?,?)'
                            console.log("WRITING: "+data.quizID+" "+data.rubric);
                            sys.db.run(sql,[questionID,data.quizID,data.questionNumber,data.correct,data.rubric],function(err){
                                if (err) {return oops(response,err,'utils/writeQuestion/saveQuestion(2)')};
                                data.questionID = this.lastID;
                                saveChoices();
                            });
                        }
                    });
                };
                function saveChoices () {
                    saveChoiceRepeater(0,4);
                };
                function saveChoiceRepeater (pos,limit) {
                    if (pos < limit) {
                        var sql = 'SELECT choiceID FROM choices '
                            + 'WHERE questionID=? AND choice=?';
                        sys.db.get(sql,[data.questionID,pos],function(err,row){
                            if (err) {return oops(response,err,'utils/writeQuestion/saveChoice(1)')};
                            var choiceID = null;
                            if (row && row.choiceID) {
                                choiceID = row.choiceID;
                            }
                            var sql = 'INSERT OR REPLACE INTO choices VALUES (?,?,?,?)'
                            console.log("DOIN: questionID="+data.questionID+", stringID="+data.questions[pos]);
                            sys.db.run(sql,[choiceID,data.questionID,pos,data.questions[pos]],function(err){
                                if (err) {return oops(response,err,'utils/writeQuestion/saveChoice(2)')};
                                saveChoiceRepeater(pos+1,limit)
                            });
                        });
                    }
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
            apiError: function (response,err,str) {
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
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.end('server-side error or warning');
                
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
