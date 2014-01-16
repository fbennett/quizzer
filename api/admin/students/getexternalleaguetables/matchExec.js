(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var adminName = sys.admin[params.admin].name;
        if (adminName !== 'admin') {
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify([]));
            return;
        }
        var sql = 'SELECT s.name,'
            + 'count(total.answerID) AS totalAnswers,'
            + '(CAST(count(correct.answerID) AS REAL)/CAST(count(total.answerID) AS REAL)*100) AS correctPercentage '
            + 'FROM students AS s '
            + 'LEFT JOIN (SELECT studentID,answerID FROM answers) AS total ON total.studentID=s.studentID '
            + 'LEFT JOIN (SELECT studentID,answerID FROM answers AS a JOIN questions AS q ON q.correct=a.choice AND q.questionID=a.questionID) AS correct ON correct.studentID=s.studentID AND total.answerID=correct.answerID '
            + 'WHERE s.privacy=1 '
            + 'GROUP BY s.name '
            + 'ORDER BY correctPercentage DESC;'
        sys.db.all(sql,function(err,rows){
            if (err|!rows) {return oops(response,err,'students/getexternalleaguetables')}
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
