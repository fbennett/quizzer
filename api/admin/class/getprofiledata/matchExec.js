(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var adminID = params.adminid;
        var classID = params.classid;
        var sys = this.sys;
        var sql = 'SELECT students.studentID,'
            + 'CAST(COUNT(correct.questionID) AS REAL)*100/CAST(COUNT(total.questionID) AS REAL) AS percentageCorrect '
            + 'FROM memberships '
            + 'JOIN students USING(studentID) '
            + 'JOIN ('
            +   'SELECT questionID,answerID,studentID '
            +   'FROM answers'
            + ') AS total ON total.studentID=students.studentID '
            + 'LEFT JOIN ('
            +   'SELECT answers.questionID,answers.answerID '
            +   'FROM questions '
            +   'JOIN answers USING(questionID) '
            +   'WHERE choice=correct'
            + ') AS correct ON correct.answerID=total.answerID '
            + 'WHERE privacy=0 AND memberships.classID=? '
            + 'GROUP BY students.studentID '
            + 'ORDER BY percentageCorrect DESC;'
        sys.db.all(sql,[classID],function(err,rows){
            if (err||!rows) {return oops(response,err,'class/getprofiledata(1)')}
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
