(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var adminID = params.adminid;
        var classID = params.classid;
        var sys = this.sys;
        var retObj = {
            className:'',
            studentCount:0,
            examIDs:[],
            examIDmap:{},
            sheet:[[]]
        };
        beginTransaction();
        
        // Calls
        // * Get class name
        // * Get list of students
        // * Get list of exams
        // * For each student/exam, get list of results
        function beginTransaction () {
            sys.db.run("BEGIN TRANSACTION",function(err){
                if (err) {return oops(response,err,'class/downloadcsv(0)')};
                getClassName();
            });
        }
        
        function getClassName () {
            var sql = 'SELECT name FROM classes WHERE classID=?;'
            sys.db.get(sql,[classID],function(err,row){
                if (err||!row) {return oops(response,err,'class/downloadcsv(1)')};
                retObj.className = row.name;
                getStudents();
            });
        }

        function getStudents () {
            var sql = 'SELECT students.studentID,students.name,email '
                + 'FROM memberships '
                + 'JOIN students USING(studentID) '
                + 'WHERE memberships.classID=? AND (privacy IS NULL OR privacy=0) '
                + 'ORDER BY students.studentID;'
            sys.db.all(sql,[classID],function(err,rows){
                if (err) {return oops(response,err,'class/downloadcsv(2)')};
                retObj.sheet[0].push('Student ID');
                retObj.sheet[0].push('Name');
                retObj.sheet[0].push('Email');
                if (rows) {
                    retObj.studentCount = rows.length;
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        var sheetrow = [
                            row.studentID,
                            row.name,
                            row.email
                        ];
                        retObj.sheet.push(sheetrow);
                    }
                    getExams();
                } else {
                    endTransaction();
                }
            });
        };

        function getExams() {
            var sql = 'SELECT quizID,examName '
                + 'FROM quizzes '
                + 'WHERE classID=? AND examName IS NOT NULL '
                + 'ORDER BY quizNumber;'
            sys.db.all(sql,[classID],function(err,rows){
                if (err) {return oops(response,err,'class/downloadcsv(3)')};
                if (rows) {
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        retObj.examIDmap[row.quizID] = retObj.sheet[0].length;
                        retObj.sheet[0].push(row.examName);
                        retObj.examIDs.push(row.quizID);
                    }
                    getExamResults(0,retObj.examIDs.length);
                } else {
                    endTransaction();
                }
            });
        };

        function getExamResults(pos,limit) {
            var quizID = retObj.examIDs[pos];
            getStudentResults(quizID);
            pos += 1;
            if (pos < limit) {
                getExamResults(pos,limit);
            }
        };
        function getStudentResults(quizID) {

            // This is a little tricky, since the number and alignment of students
            // must match the list kicked out in the getStudents() function above.

            var sql = 'SELECT memberships.studentID,'
                + 'CASE WHEN counts.numberOfAnswers IS NOT NULL THEN counts.numberOfAnswers ELSE \'\' END AS numberOfAnswers,'
                + 'CASE WHEN counts.numberCorrect IS NOT NULL THEN counts.numberCorrect ELSE \'\' END AS numberCorrect '
                + 'FROM memberships '
                + 'JOIN students USING(studentID) '
                + 'LEFT JOIN ('
                +   'SELECT answers.studentID,'
                +   'COUNT(answers.answerID) AS numberOfAnswers,'
                +   'COUNT(correct.answerID) AS numberCorrect '
                +   'FROM questions '
                +   'LEFT JOIN answers ON answers.questionID=questions.questionID '
                +   'LEFT JOIN answers AS correct ON correct.answerID=answers.answerID AND answers.choice=questions.correct '
                +   'WHERE questions.quizID=? '
                +   'GROUP BY answers.studentID '
                +   'ORDER BY answers.studentID'
                + ') AS counts ON counts.studentID=memberships.studentID '
                + 'WHERE memberships.classID=? AND (privacy IS NULL OR privacy=0) '
                + 'ORDER BY memberships.studentID;'
            sys.db.all(sql,[quizID,classID],function(err,rows){
                if (err) {return oops(response,err,'class/downloadcsv(4)')};
                if (rows) {
                    var colpos = retObj.examIDmap[quizID];
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        retObj.sheet[i+1][colpos] = row.numberCorrect;
                    }
                    endTransaction();
                } else {
                    endTransaction();
                }
            });
        }

        function endTransaction () {
            sys.db.run("END TRANSACTION",function(err){
                if (err) {return oops(response,err,'class/downloadcsv(5)')};
                finishDownload();
            });
        }

        function finishDownload() {
            var sheet = retObj.sheet;
            for (var i=0,ilen=retObj.sheet.length;i<ilen;i+=1) {
                var row = sheet[i];
                for (var j=0,jlen=row.length;j<jlen;j+=1) {
                    var cell = row[j];
                    row[j] = ('' + row[j]).replace('"','\\"');
                }
                row = '"' + row.join('","') + '"';
            };
            response.writeHead(200, {'Content-Type': 'text/csv','Content-Disposition':'attachment; filename="' + retObj.className + ' (roster).csv"'});
            response.end(retObj.sheet.join('\n'));
        }
    }
    exports.cogClass = cogClass;
})();
