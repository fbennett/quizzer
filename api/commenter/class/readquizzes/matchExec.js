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
        var sql = "SELECT quizzes.quizNumber,examName,COUNT(res.commentNeeded) AS numberOfCommentsNeeded "
            + "FROM quizzes "
            + "LEFT JOIN ("
            +   "SELECT classID,quizNumber,CASE WHEN comments.choiceID IS NULL THEN 1 ELSE NULL END AS commentNeeded "
            +   "FROM choices "
            +   "JOIN questions USING(questionID) "
            +   "JOIN answers USING(questionID,choice) "
            +   "JOIN quizzes USING(quizID) "
            +   "LEFT JOIN comments USING(choiceID) "
            +   "LEFT JOIN rulesToChoices USING(choiceID) "
            +   "WHERE NOT answers.choice=questions.correct AND quizzes.classID=? AND comments.choiceID IS NULL AND rulesToChoices.choiceID IS NULL "
            +   "GROUP BY quizzes.quizNumber, questions.questionNumber, choices.choice "
            + ") as res ON res.classID=quizzes.classID AND res.quizNumber=quizzes.quizNumber "
            + "WHERE quizzes.classID=? AND sent=1 "
            + "GROUP BY quizzes.quizNumber;";
        db.all(sql,[classID,classID],function(err,rows){
            if (err||!rows) {return oops(response,err,'class/readquizzes')};
            var retRows = [];
            var hasNew = false;
            var maxval = 0;
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                retRows.push({name:row.examName,number:row.quizNumber,numberOfCommentsNeeded:row.numberOfCommentsNeeded});
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(retRows));
        });
    }
    exports.cogClass = cogClass;
})();

