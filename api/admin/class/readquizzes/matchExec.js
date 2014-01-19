(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var db = this.sys.db;
        var sql = 'SELECT quizNumber,examName,CASE WHEN sent IS NULL OR sent=0 THEN -1 ELSE COUNT(pending) END AS pending '
            + 'FROM quizzes '
            + 'LEFT JOIN ('
            +     'SELECT quizNumber AS pending '
            +     'FROM memberships '
            +     'NATURAL JOIN students '
            +     'NATURAL JOIN classes '
            +     'NATURAL JOIN quizzes '
            +     'NATURAL JOIN questions '
            +     'LEFT JOIN answers USING (questionID,studentID) '
            +     'WHERE memberships.classID=? AND answers.questionID IS NULL AND (privacy IS NULL OR privacy=0) '
            +     'GROUP BY memberships.classID,quizNumber,memberships.studentID'
            + ') AS res ON res.pending=quizNumber '
            + 'WHERE classID=? '
            + "GROUP BY classID,quizNumber "
            + "ORDER BY quizNumber;"
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
                retRows.push({name:row.examName,number:row.quizNumber,isnew:row.pending});
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

