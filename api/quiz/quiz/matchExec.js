(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {

        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var studentID = params.studentid;
        var page = this.page.toString();
        var altpage = this.altpage.toString();
        var errpage = '<html>\n'
            + '<head><title>Page removed</title></head><body><h1>Our apologies!</h1><p>This page has been removed. Sorry for the inconvenience.</p></body></html>';

        sys.db.get('SELECT qz.examName,c.name AS className FROM classes AS c LEFT JOIN quizzes AS qz ON c.classID=qz.classID WHERE qz.classID=? AND qz.quizNumber=?',[classID,quizNumber],function(err,row){
            if (err) {return oops(response,err,'*quiz(1)')};
            if (row) {
                getQuizOrResult(row.className,row.examName);
            } else {
                response.writeHead(404, {'Content-Type': 'text/html'});
                response.end(errpage);
            }
        });
        
        function getQuizOrResult(className,examName) {
            sys.db.get('SELECT s.name AS studentName,c.name AS className FROM answers AS a JOIN questions AS q ON q.questionID=a.questionID JOIN students AS s ON s.studentID=a.studentID JOIN classes AS c ON c.classID=q.classID WHERE q.classID=? AND q.quizNumber=? AND a.studentID=?',[classID,quizNumber,studentID],function(err,row){
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
                        .replace(/@@QUIZ_LABEL@@/g,quizLabel);
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
