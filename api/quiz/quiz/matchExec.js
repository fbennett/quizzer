(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {

        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var questionIDs = params.questionids ? params.questionids.split(',') : [];
        var glossLang = params.glosslang;
        var studentID = params.studentid;
        var page = this.page.toString();
        var altpage = this.altpage.toString();
        var errpage = '<html>\n'
            + '<head><title>Page removed</title></head><body><h1>Our apologies!</h1><p>This page has been removed. Sorry for the inconvenience.</p></body></html>';

        // Okay, right. So to generalize this, we need to ship the
        // questionIDs to the page, and make it populate itself
        // with a callback to the server.

        // We still need to craft two forms of call to this matchExec, though.
        
        // Cast two separate head functions. Discriminate on whether
        // our call has (questionids) or (classid + quizno)

        if (questionIDs.length) {
            getClassName();
        } else {
            getClassAndQuizName();
        }

        function getClassName () {
            var sql = 'SELECT name AS className FROM classes WHERE classID=?;';
            sys.db.get(sql,[classID],function(err,row){
                if (err) {return oops(response,err,'*quiz(a)')};
                if (row) {
                    page = page
                        .replace(/@@CLASS@@/g,row.className)
                        .replace(/@@QUIZ_LABEL@@/g,"Self-Test")
                        .replace(/@@QUIZ_NUMBER@@/,quizNumber)
                        .replace(/@@GLOSS_LANGUAGE@@/,glossLang)
                        .replace(/@@QUESTION_IDS@@/,questionIDs.join(','));
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    response.end(page);
                } else {
                    response.writeHead(404, {'Content-Type': 'text/html'});
                    response.end(errpage);
                }
            });
        }

        function getClassAndQuizName () {
            var sql = 'SELECT qz.examName,c.name AS className '
                + 'FROM classes AS c '
                + 'LEFT JOIN quizzes AS qz ON c.classID=qz.classID '
                + 'WHERE qz.classID=? AND qz.quizNumber=?;';
            sys.db.get(sql,[classID,quizNumber],function(err,row){
                if (err) {return oops(response,err,'*quiz(1)')};
                if (row) {
                    getQuizOrResult(row.className,row.examName);
                } else {
                    response.writeHead(404, {'Content-Type': 'text/html'});
                    response.end(errpage);
                }
            });
        }

        function getQuizOrResult(className,examName) {
            var sql = 'SELECT students.name AS studentName,classes.name AS className '
                + 'FROM answers '
                + 'NATURAL JOIN questions '
                + 'JOIN quizzes USING(quizID) '
                + 'JOIN students USING(studentID) '
                + 'JOIN classes USING(classID) '
                + 'WHERE quizzes.classID=? AND quizzes.quizNumber=? AND answers.studentID=? '
                + 'LIMIT 1;'
            sys.db.get(sql,[classID,quizNumber,studentID],function(err,row){
                if (err) {return oops(response,err,'*quiz(2)')}
                var quizLabel;
                if (examName) {
                    quizLabel = examName;
                } else {
                    quizLabel = 'Quiz ' + quizNumber;
                }
                if (!row) {
                    page = page
                        .replace(/@@CLASS@@/g,className)
                        .replace(/@@QUIZ_LABEL@@/g,quizLabel)
                        .replace(/@@QUIZ_NUMBER@@/,quizNumber)
                        .replace(/@@GLOSS_LANGUAGE@@/,"")
                        .replace(/@@QUESTION_IDS@@/,"");
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    response.end(page);
                } else {
                    altpage = altpage
                        .replace(/@@CLASS@@/g,row.className)
                        .replace(/@@STUDENT_NAME@@/g,row.studentName)
                        .replace(/@@QUIZ_LABEL@@/g,quizLabel);
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    response.end(altpage);
                }
            });
        }
    }
    exports.cogClass = cogClass;
})();
