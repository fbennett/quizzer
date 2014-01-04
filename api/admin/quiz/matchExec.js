(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var sys = this.sys;
        sys.db.get('SELECT c.name,q.quizNumber,q.examName FROM classes AS c JOIN quizzes AS q ON q.classID=c.classID WHERE q.classID=? AND q.quizNumber=?',[classID,quizNumber],function(err,row){
            if (err) {return oops(response,err,'quiz(1)')};
            if (!row) {
                sys.db.run('INSERT INTO quizzes VALUES (NULL,?,?,0)',[classID,quizNumber],function(err){
                    if (err) {return oops(response,err,'quiz(2)')};
                    sys.db.get('SELECT c.name,q.quizNumber FROM classes AS c JOIN quizzes AS q ON q.classID=c.classID WHERE q.classID=? AND q.quizNumber=?',[classID,quizNumber],function(err,row){
                        if (err||!row) {return oops(response,err,'quiz(3)')};
                        var myPage = page.toString().replace(/@@CLASS@@/g, row.name);
                        if (row.examName) {
                            myPage = myPage.replace(/@@QUIZ_LABEL@@/g, row.examName);
                        } else {
                            var quizLabel = 'Quiz ' + row.quizNumber;
                            myPage = myPage.replace(/@@QUIZ_LABEL@@/g, quizLabel);
                        }
                        response.writeHead(200, {'Content-Type': 'text/html'});
                        response.end(myPage);
                    });
                });
            } else {
                var myPage = page.toString().replace(/@@CLASS@@/g, row.name);
                if (row.examName) {
                    myPage = myPage.replace(/@@QUIZ_LABEL@@/g, row.examName);
                } else {
                    var quizLabel = 'Quiz ' + row.quizNumber;
                    myPage = myPage.replace(/@@QUIZ_LABEL@@/g, quizLabel);
                }
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(myPage);
            }
        });
    }
    exports.cogClass = cogClass;
})();
