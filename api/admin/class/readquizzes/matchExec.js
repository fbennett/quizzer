(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var db = this.sys.db;
        var sql = "SELECT q.quizNumber,q.sent,COUNT(s.studentID) AS enroled,COUNT(a.choice) AS submitted "
            + "FROM quizzes AS q "
            + "JOIN classes AS c ON q.classID=c.classID "
            + "JOIN memberships AS m ON c.classID=m.classID "
            + "JOIN students AS s ON m.studentID=s.studentID "
            + "LEFT JOIN answers AS a ON a.studentID=s.studentID "
            + "AND a.classID=q.classID "
            + "AND a.quizNumber=q.quizNumber "
            + "WHERE q.classID=? "
            + "GROUP BY q.quizID "
            + "ORDER BY q.quizNumber;"
        console.log("XX>> "+sql);
        db.all(sql,[params.classid],function(err,rows){
            if (err||!rows) {return oops(response,err,'class/readquizzes')};
            var retRows = [];
            var hasNew = false;
            var maxval = 0;
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                if (row.sent) {
                    if (row.enroled > row.submitted) {
                        retRows.push({number:row.quizNumber,isnew:(row.enroled - row.submitted)});
                    } else {
                        retRows.push({number:row.quizNumber,isnew:0});
                    }
                } else {
                    hasNew = true;
                    retRows.push({number:row.quizNumber,isnew:-1});
                }
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

