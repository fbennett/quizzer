(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var studentID = params.studentid;
        var page = this.page;
        var altpage = this.altpage;
        
        sys.db.get('SELECT s.name AS studentName,c.name AS className FROM answers AS a JOIN students AS s ON s.studentID=a.studentID JOIN classes AS c ON c.classID=a.classID WHERE a.classID=? AND a.quizNumber=? AND a.studentID=?',[classID,quizNumber,studentID],function(err,row){
            if (err) {return oops(response,err,'*quiz')}
            if (!row) {
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(page);
            } else {
                altpage = altpage.toString()
                    .replace(/@@CLASS@@/g,row.className)
                    .replace(/@@STUDENT_NAME@@/g,row.studentName)
                    .replace(/@@QUIZ_NUMBER@@/g,quizNumber);
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(altpage);
            }
        });
    }
    exports.cogClass = cogClass;
})();
