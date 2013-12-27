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
        sys.db.get('SELECT COUNT(*) AS count FROM answers WHERE classID=? AND quizNumber=? AND studentID=?',[classID,quizNumber,studentID],function(err,row){
            if (err) {return oops(response,err,'*quiz')}
            if (row.count == 0) {
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(page);
            } else {
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(altpage);
            }
        });
    }
    exports.cogClass = cogClass;
})();
