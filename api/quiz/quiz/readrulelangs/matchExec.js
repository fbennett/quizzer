(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var studentID = params.studentid;
        var studentKey = params.studentkey;
        var sql = 'SELECT students.lang,languages.langName FROM students '
            + 'JOIN languages ON languages.lang=students.lang '
            + 'WHERE students.studentID=?';
        sys.db.all(sql,[studentID],function(err,rows){
            if (err) {return oops(response,err,'**classes/readrulelangs(1)')};
            if (rows && rows.length) {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(rows));
            } else {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify([]));
            }
        });
    }
    exports.cogClass = cogClass;
})();
