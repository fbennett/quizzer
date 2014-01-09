(function () {
    var utilClass = function (sys) {
        this.sys = sys;
    };
    utilClass.prototype.getUtils = function () {
        var sys = this.sys;
        return {
            writeQuestion: function (response,classID,quizNumber,questionNumber,fields) {
                var oops = this.apiError;
                var purgeStrings = this.purgeStrings;
                sys.db.get('SELECT MAX(questionNumber) AS questionNumber FROM questions WHERE classID=? AND quizNumber=?',[classID,quizNumber],function(err,row) {
                    if (err||!row) {return oops(response,err,'writeQuestion()')};
                    if (questionNumber == 0) {
                        questionNumber = (row.questionNumber+1);
                    }
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(questionNumber));
                    saveRubric(classID,quizNumber,questionNumber, fields);
                });
                function saveRubric (classID,quizNumber,questionNumber, dataIn) {
                    // From here, we chain from inside the callback
                    sys.db.run('INSERT OR IGNORE INTO strings VALUES (NULL,?)',[dataIn.rubric],function(err){
                        if (err) {return oops(response,err,'saveRubric()')};
                        sys.db.get('SELECT stringID FROM strings WHERE string=?',[dataIn.rubric], function (err, row){
                            if (err||!row) {return oops(response,err,'saveRubric()')};
                            var rubricID = row.stringID;
                            saveChoice(classID, quizNumber, questionNumber, 0, dataIn, [rubricID]);
                        });
                    });
                };
                function saveChoice (classID,quizNumber,questionNumber,choiceNumber, dataIn, dataOut) {
                    // Here, we watch choiceNumber, and call ourselves until we have all the choices
                    var str = dataIn.questions[dataOut.length-1];
                    sys.db.run('INSERT OR IGNORE INTO strings VALUES (NULL,?)',[str],function(err){
                        if (err) {return oops(response,err,'saveChoice()')};
                        sys.db.get('SELECT stringID FROM strings WHERE string=?',[str], function (err, row){
                            dataOut.push(row.stringID);
                            if (dataOut.length === 5) {
                                saveCorrect(classID,quizNumber,questionNumber,dataIn,dataOut);
                            } else {
                                saveChoice(classID,quizNumber,questionNumber,choiceNumber,dataIn,dataOut);
                            }
                        });
                    });
                };
                function saveCorrect (classID,quizNumber,questionNumber, dataIn, dataOut) {
                    // From here, we chain to the final callback for the quiz question, and we're done with this one
                    dataOut.push(dataIn.correct);
                    saveQuestion(classID, quizNumber, questionNumber,dataOut);
                };
                function saveQuestion (classID,quizNumber,questionNumber,dataOut) {
                    sys.db.run('INSERT OR REPLACE INTO questions VALUES (NULL,?,?,?,?,?,?,?,?,?)',[classID, quizNumber, questionNumber, dataOut[5], dataOut[0], dataOut[1], dataOut[2], dataOut[3], dataOut[4]],function(err){
                        if (err) {return oops(response,err,'saveChoice()')};
                    });
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
                    + 'LEFT JOIN showing AS sh '
                    + 'ON sh.studentID=s.studentID'
                sys.db.all(sql,[classID],function(err,rows) {
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
                
            }
        }
    }
    exports.utilClass = utilClass;
})();
