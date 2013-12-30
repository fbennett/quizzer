(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var db = this.sys.db;
        var classID = params.classid;
        // Get all quizzes sent
        // Add a field numberOfCommentsNeeded that is a count of
        // wrong answers for the target quiz that do NOT have a 
        // corresponding comment in the comments table
        //
        // After much fiddling about, it seems a left join of comments
        // to the full list of answers, counting NULL-inverted fields
        // in the former within the resulting list gives us what we're
        // after.
        //
        // SQL is a real headache for those of us who never studied it
        // properly, but it has a way of paying back for the pain all
        // in one go.
        // 
        var sql = "SELECT q.quizNumber,COUNT(res.choice) AS numberOfCommentsNeeded "
            + "FROM quizzes AS q "
            + "LEFT JOIN ("
            +   "SELECT DISTINCT qq.classID,qq.quizNumber,qq.questionNumber,aa.choice "
            +   "FROM questions AS qq "
            +   "JOIN answers AS aa ON aa.classID=qq.classID AND aa.quizNumber=qq.quizNumber AND aa.questionNumber=qq.questionNumber "
            +   "LEFT JOIN comments AS c ON c.classID=aa.classID AND c.quizNumber=aa.quizNumber AND c.questionNumber=aa.questionNumber AND c.choice=aa.choice "
            +   "WHERE NOT aa.choice=qq.correct AND qq.classID=? AND c.choice IS NULL "
            +   "GROUP BY aa.quizNumber, aa.questionNumber, aa.choice "
            + ") as res ON res.classID=q.classID AND res.quizNumber=q.quizNumber "
            + "WHERE q.classID=? AND q.sent=1 "
            + "GROUP BY q.quizNumber;";
        db.all(sql,[classID,classID],function(err,rows){
            if (err||!rows) {return oops(response,err,'class/readquizzes')};
            var retRows = [];
            var hasNew = false;
            var maxval = 0;
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                retRows.push({number:row.quizNumber,numberOfCommentsNeeded:row.numberOfCommentsNeeded});
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(retRows));
        });
    }
    exports.cogClass = cogClass;
})();

