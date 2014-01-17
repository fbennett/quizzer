(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var adminID = params.adminid;
        var classID = params.classid;
        var sys = this.sys;
        var sql = 'SELECT s.studentID,CAST(COUNT(correct.questionID) AS REAL)*100/CAST(COUNT(total.questionID) AS REAL) AS percentageCorrect '
            + 'FROM memberships AS m '
            + 'JOIN students AS s ON s.studentID=m.studentID '
            + 'JOIN ('
            +   'SELECT questionID,studentID '
            +   'FROM answers'
            + ') AS total ON total.studentID=s.studentID '
            + 'LEFT JOIN ('
            +   'SELECT a.questionID,a.studentID '
            +   'FROM answers AS a '
            +   'JOIN questions AS q ON q.questionID=a.questionID '
            +   'WHERE a.choice=q.correct'
            + ') AS correct ON correct.studentID=s.studentID AND correct.questionID=total.questionID '
            + 'WHERE s.privacy=0 AND m.classID=? '
            + 'GROUP BY s.studentID '
            + 'ORDER BY percentageCorrect DESC;'
        sys.db.all(sql,[classID],function(err,rows){
            if (err||!rows) {return oops(response,err,'class/getprofiledata(1)')}
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
