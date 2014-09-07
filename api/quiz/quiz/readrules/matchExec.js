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

        var rulesData = [];
        var rulesReturn = [];

        sys.db.run('BEGIN TRANSACTION',function(err){
            if (err) {};
            getRuleData();
        });

        function getRuleData () {
        var sql = 'SELECT DISTINCT rulesToChoices.ruleID AS ruleID,'
                + 'ruleStrings.string AS ruleText,'
                + 'RTO.string AS origGloss,'
                + 'RTT.string AS transGloss '
                + 'FROM classes '
                + 'JOIN quizzes USING(classID) '
                + 'JOIN questions USING(quizID) '
                + 'JOIN choices USING(questionID) '
                + 'JOIN rulesToChoices USING(choiceID) '
                + 'JOIN rules USING(ruleID) '
                + 'JOIN ruleStrings USING(ruleStringID) '
                + "JOIN (SELECT ruleID,string FROM ruleTranslations WHERE lang='en') RTO USING(ruleID) "
                + "LEFT JOIN (SELECT ruleID,string FROM ruleTranslations WHERE lang=?) RTT USING(ruleID) "
                + 'WHERE classes.classID=?;';
            sys.db.all(sql,[lang,classID],function(err,rows){
                if (err||!rows) {return oops(response,err,'**quiz/readrules(1)')}
                if (rows && rows.length) {
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        rulesData.push(row);
                    }
                    getRecentQuestionsForRule(0,rulesData.length);
                } else {
                    endTransaction();
                }
            });
        }

        function getRecentQuestionsForRule(pos,limit) {
            if (pos === limit) {
                endTransaction();
                return;
            }
            var ruleID = rulesData[pos].ruleID;
            // Outer SELECT yields the list of recent questions in which the rule was not missed by this student.
            // Inner SELECT yields the two most recent questions that are relevant
            var sql = 'SELECT COUNT(*) AS count FROM '
                + '(SELECT questionID FROM '
                + '  (SELECT questions.questionID '
                + '    FROM classes '
                + '    JOIN quizzes USING(classID) '
                + '    JOIN questions USING(quizID) '
                + '    JOIN choices USING(questionID) '
                + '    JOIN rulesToChoices USING(choiceID) '
                + '    WHERE classes.classID=? AND rulesToChoices.ruleID=? '
                + '    GROUP BY questions.questionID '
                + '    ORDER BY quizzes.quizNumber DESC, questions.questionNumber DESC '
                + '    LIMIT 2) Q '
                + '  JOIN answers USING(questionID) '
                + '  JOIN choices USING(questionID,choice) '
                + '  LEFT JOIN rulesToChoices USING(choiceID) '
                + '  WHERE answers.studentID=? AND rulesToChoices.ruleToChoiceID IS NULL);'
            sys.db.get(sql,[classID,ruleID,studentID],function(err,row){
                if (err) {return oops(response,err,'**quiz/readrules(2)')};
                if (row.count === 2) {
                    data = rulesData[pos];
                    rulesReturn.push(data);
                }
                getRecentQuestionsForRule(pos+1,limit);
            });
        };
        function endTransaction () {
            sys.db.run('END TRANSACTION',function(err){
                if (err) {return oops(response,err,'**quiz/readrules(3)')};
                rulesReturn.sort(function(a,b){
                    if (a.transGloss && !b.transGloss) {
                        return 1;
                    } else if (!a.transGloss && b.transGloss) {
                        return -1;
                    } else {
                        return 0
                    }
                });
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(rulesReturn));
            });
        };
    }
    exports.cogClass = cogClass;
})();
