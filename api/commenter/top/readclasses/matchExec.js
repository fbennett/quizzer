(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sql = "SELECT name,classes.classID,COUNT(res.commentNeeded) AS numberOfCommentsNeeded "
            + "FROM classes "
            + "JOIN quizzes USING(classID) "
            + "LEFT JOIN ("
            +   "SELECT classID,quizNumber,CASE WHEN comments.choiceID IS NULL THEN 1 WHEN rulesToChoices.choiceID THEN 1 ELSE NULL END AS commentNeeded "
            +   "FROM choices "
            +   "JOIN questions USING(questionID) "
            +   "JOIN answers USING(questionID,choice) "
            +   "JOIN quizzes USING(quizID) "
            +   "LEFT JOIN comments USING(choiceID) "
            +   "LEFT JOIN rulesToChoices USING(choiceID) "
            +   "WHERE NOT answers.choice=questions.correct AND comments.choiceID IS NULL AND rulesToChoices.choiceID IS NULL "
            +   "GROUP BY quizzes.quizNumber, questions.questionNumber, choices.choice "
            + ") as res ON res.classID=quizzes.classID AND quizzes.quizNumber=res.quizNumber "
            + "WHERE sent=1 "
            + "GROUP BY classes.classID "
            + "ORDER BY name"
        this.sys.db.all(sql,function(err,rows){
            if (err||!rows) {return oops(response,err,'classes/readclasses')};
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
