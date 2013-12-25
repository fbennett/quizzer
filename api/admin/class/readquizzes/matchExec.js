(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var db = this.sys.db;
        var payload = JSON.parse(request.POSTDATA)
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
            + "ORDER BY c.name,q.quizNumber;"
        db.all(sql,[payload.classid],function(err,rows){
            if (err) console.log('Error in class/readquizzes: '+err);
            var retRows = [];
            var hasNew = false;
            var maxval = 0;
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                console.log("Check: "+row.quizNumber+", "+row.sent+", "+row.enroled+", "+row.submitted);
                if (row.sent) {
                    if (enroled > submitted) {
                        retRows.push({number:row.quizNumber,isnew:1});
                    } else {
                        retRows.push({number:row.quizNumber,isnew:0});
                    }
                } else {
                    hasNew = true;
                    retRows.push({number:row.quizNumber,isnew:2});
                }
                maxval = row.quizNumber;
            }
            if (!hasNew) {
                retRows.push({number:maxval+1,isnew:true});
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(retRows));
        });
    }
    exports.cogClass = cogClass;
})();

