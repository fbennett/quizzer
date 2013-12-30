(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var db = this.sys.db;
        var sql = 'SELECT qz.quizNumber,CASE WHEN qz.sent IS NULL OR qz.sent=0 THEN -1 ELSE COUNT(res.pending) END AS pending '
            + 'FROM quizzes AS qz LEFT JOIN ('
            +     'SELECT q.quizNumber AS pending FROM memberships AS m '
            +     'JOIN questions AS q ON q.classID=m.classID '
            +     'LEFT JOIN answers AS a ON a.classID=q.classID AND a.quizNumber=q.quizNumber AND a.questionNumber=q.questionNumber AND a.studentID=m.studentID '
            +     'WHERE q.classID=? AND a.quizNumber IS NULL '
            +     'GROUP BY q.classID,q.quizNumber,m.studentID'
            + ') AS res ON res.pending=qz.quizNumber '
            + 'WHERE qz.classID=? '
            + "GROUP BY qz.classID,qz.quizNumber "
            + "ORDER BY qz.quizNumber;"
        console.log("XX> "+sql);
        db.all(sql,[classID,classID],function(err,rows){
            if (err||!rows) {return oops(response,err,'class/readquizzes')};
            var retRows = [];
            var hasNew = false;
            var maxval = 0;
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                if (row.pending == -1) {
                    hasNew = true;
                }
                retRows.push({number:row.quizNumber,isnew:row.pending});
                maxval = row.quizNumber;
            }
            if (rows.length && !hasNew) {
                retRows.push({number:maxval+1,isnew:-1});
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(retRows));
        });
    }
    exports.cogClass = cogClass;
})();

