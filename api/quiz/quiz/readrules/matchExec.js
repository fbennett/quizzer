(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var studentID = params.studentid;
        var studentKey = params.studentkey;
        var lang = params.lang;

        // We need a list of individual rules and texts that include an indication of which:
        // * could be missed in two questions, working back from the most recent
        // * and were not violated by this student in those two answers
        //
        // Obtain the data in two steps
        // * get all ruleIDs and texts
        // * for each ruleID, get the TWO most recent questions (high-quizno, high-questionno, 
        //   don't worry about actual submission order) with choices to which the rule has been applied
        // * count the questions, ignoring those in which the student violated the rule
        // * for each rule with no wrong answers in the set, return the ruleID, ruleText, origText and transText

        sys.db.run('BEGIN TRANSACTION',function(err){
            if (err) {};
            getRuleData();
        });

        function getRuleData () {
        var sql = 'SELECT DISTINCT rules.ruleID AS ruleID,'
                + 'ruleStrings.string AS ruleText,'
                + 'RTO.string AS origGloss,'
                + 'RTT.string AS transGloss '
                + 'FROM rules '
                + 'JOIN ruleStrings USING(ruleStringID) '
                + "JOIN (SELECT ruleID,string FROM ruleTranslations WHERE lang='en') RTO USING(ruleID) "
                + "LEFT JOIN (SELECT ruleID,string FROM ruleTranslations WHERE lang=?) RTT USING(ruleID) "
                + 'ORDER BY ruleText;';
            sys.db.all(sql,[lang],function(err,rows){
                if (err||!rows) {return oops(response,err,'**quiz/readrules(1)')}
                if (rows && rows.length) {
                    getRecentQuestionsForRule(0,rows.length,rows);
                } else {
                    endTransaction();
                }
            });
        }

        function getRecentQuestionsForRule(pos,limit,rulesData) {
            if (pos === limit) {
                endTransaction(rulesData);
                return;
            }
            var ruleID = rulesData[pos].ruleID;
            // With a little arm-twisting, SQLite will do this.

            // Inner SELECT yields the two most recent relevant questions answered by this student.
            //   (the select is broader here: choice is not constrained to the student's own choice)
            // Outer SELECT yields the list of recent questions answered (correctly or incorrectly) by this student.
            //   (here the answer.choice constraint is imposed)
            //   (outer select converts ruleToChoiceID to a one-step counter, and the most-outer select sums the result)

            var sql = 'SELECT group_concat(DISTINCT questionID) AS questionIDs,'
                + ' SUM(errors) AS count '
                + ' FROM '
                + ' (SELECT Q.questionID,'
                + '  CASE WHEN RTC.ruleToChoiceID IS NOT NULL THEN 1 ELSE 0 END AS errors '
                + '  FROM '
                + '  (SELECT questions.questionID '
                + '    FROM classes '
                + '    JOIN quizzes USING(classID) '
                + '    JOIN questions USING(quizID) '
                + '    JOIN quizAnswers ON quizAnswers.quizID=quizzes.quizID AND quizAnswers.studentID=? '
                + '    JOIN choices USING(questionID) '
                + '    JOIN rulesToChoices USING(choiceID) '
                + '    WHERE classes.classID=? AND rulesToChoices.ruleID=? AND examName IS NULL '
                + '    GROUP BY questions.questionID '
                + '    ORDER BY quizAnswers.submissionDate DESC,questions.questionID '
                + '    LIMIT 2) Q '
                + '  JOIN answers A ON A.questionID=Q.questionID AND A.studentID=? '
                + '  JOIN choices C ON C.questionID=A.questionID  AND C.choice=A.choice '
                + '  LEFT JOIN rulesToChoices RTC ON RTC.choiceID=C.choiceID);'
            sys.db.all(sql,[studentID,classID,ruleID,studentID],function(err,rows){
                if (err|!rows) {return oops(response,err,'**quiz/readrules(2)')};
                for (var i=0,ilen=rows.length;i<ilen;i++) {
                    if (rows[i].questionIDs) {
                        rulesData[pos].questionIDs = rows[i].questionIDs;
                    } else {
                        rulesData[pos].questionIDs = "";
                    }
                    if (rows[i].count) {
                        rulesData[pos].count = rows[i].count;
                    } else {
                        rulesData[pos].count = 0;
                    }
                    // console.log("XXX: count=" + rulesData[pos].count + ", studentID="+studentID+ ", questionID=" + rulesData[pos].questionIDs + ', ruleID='+rulesData[pos].ruleID+"/"+ruleID+", ruleText="+rulesData[pos].ruleText);
                }
                getRecentQuestionsForRule(pos+1,limit,rulesData);
            });
        };
        function endTransaction (rulesData) {
            sys.db.run('END TRANSACTION',function(err){
                if (err) {return oops(response,err,'**quiz/readrules(3)')};
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(rulesData));
            });
        };
    }
    exports.cogClass = cogClass;
})();
