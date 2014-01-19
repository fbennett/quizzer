(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var sys = this.sys;
        var sql = 'SELECT name,quizNumber,examName '
            + 'FROM classes '
            + 'NATURAL JOIN quizzes '
            + 'WHERE classes.classID=? AND quizNumber=?';
        sys.db.get(sql,[classID,quizNumber],function(err,row){
            if (err) {return oops(response,err,'quiz(1)')};
            if (!row) {
                sys.db.run('INSERT INTO quizzes VALUES (NULL,?,?,0,NULL,NULL)',[classID,quizNumber],function(err){
                    if (err) {return oops(response,err,'quiz(2)')};
                    var sql = 'SELECT name,quizNumber '
                        + 'FROM classes '
                        + 'NATURAL JOIN quizzes '
                        + 'WHERE classes.classID=? AND quizNumber=?';
                    sys.db.get(sql,[classID,quizNumber],function(err,row){
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
