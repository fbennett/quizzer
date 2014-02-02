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
        // * are tagged against at least one choice in five questions, working back from the most recent
        // * and were not violated in any of those five questions
        //
        // Obtain the data in two steps
        // * get all ruleIDs
        // * for each ruleID, get the 5 most recent attempted answers
        // * for each attempted answer, also get the attempt results
        // * constrain select by count of those two tests
        // * for each succeeding rule, return the ruleID, ruleText, origText and transText

        var rulesData = [];
        var rulesReturn = [];

        sys.db.run('BEGIN TRANSACTION',function(err){
            if (err) {};
            getRuleIds();
        });

        function getRuleIds () {
        var sql = 'SELECT DISTINCT rulesToChoices.ruleID '
                + 'FROM classes '
                + 'JOIN quizzes USING(classID) '
                + 'JOIN questions USING(quizID) '
                + 'JOIN choices USING(questionID) '
                + 'JOIN rulesToChoices USING(choiceID) '
                + 'WHERE classes.classID=?'
            sys.db.all(sql,[classID],function(err,rows){
                if (err||!rows) {return oops(response,err,'**quiz/readrules(1)')}
                if (rows && rows.length) {
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        console.log("XX ruleID: "+row.ruleID);
                        rulesData.push(row);
                    }
                    getRuleResults(0,rulesData.length);
                } else {
                    endTransaction();
                }
            });
        }

        function getRuleResults(pos,limit) {
            var sql = 'SELECT ruleStrings.string AS ruleText,'
                + 'CASE WHEN rtE.string IS NOT NULL THEN rtE.string ELSE \'\' END AS origGloss,'
                + 'CASE WHEN rtO.string IS NOT NULL THEN rtO.string ELSE \'\' END AS transGloss,'
                + 'classes.classID,'
                + 'ans.studentID,'
                + 'rules.ruleID,'
                + 'counts.numberAttempted,'
                + 'counts.numberFailed '
                + 'FROM classes '
                + 'JOIN quizzes USING(classID) '
                + 'JOIN questions AS q USING(quizID) '
                + 'JOIN choices USING(questionID) '
                + 'JOIN answers AS ans ON ans.questionID=q.questionID AND ans.choice=choices.choice '
                + 'JOIN rulesToChoices AS rtc ON rtc.choiceID=choices.choiceID '
                + 'JOIN rules USING(ruleID) '
                + 'JOIN ruleStrings USING(ruleStringID) '
                + 'LEFT JOIN ('
                +   'SELECT ruleID,string '
                +   'FROM ruleTranslations '
                +   'WHERE lang=\'en\''
                + ') AS rtE ON rtE.ruleID=rules.ruleID '
                + 'LEFT JOIN ('
                +   'SELECT ruleID,string '
                +   'FROM ruleTranslations '
                +   'WHERE lang=?'
                + ') AS rtO ON rtO.ruleID=rules.ruleID '
                + 'LEFT JOIN ('
                +   'SELECT attempts.ruleID,'
                +   'COUNT(attempts.attempt) AS numberAttempted,'
                +   'COUNT(attempts.failure) AS numberFailed '
                +   'FROM ('
                +     'SELECT rtc.ruleID,'
                +     'ans.answerID AS attempt,'
                +     'failures.answerID AS failure '
                +     'FROM quizzes AS qz '
                +     'JOIN questions AS q USING(quizID) '
                +     'JOIN choices USING(questionID) '
                +     'JOIN answers AS ans ON ans.questionID=q.questionID AND ans.choice=choices.choice '
                +     'JOIN quizAnswers as qa ON qa.quizID=q.quizID AND qa.studentID=ans.studentID '
                +     'JOIN rulesToChoices AS rtc ON rtc.choiceID=choices.choiceID '
                +     'LEFT JOIN ('
                +       'SELECT answerID '
                +       'FROM answers '
                +       'WHERE answers.studentID=?'
                +     ') AS failures ON failures.answerID=ans.answerID '
                +     'WHERE qz.classID=? AND rtc.ruleID=? '
                +     'ORDER BY qa.submissionDate DESC '
                +     'LIMIT 5'
                +   ') AS attempts'
                + ') AS counts ON counts.ruleID=rtc.ruleID '
                + 'WHERE classes.classID=? AND rules.ruleID=? AND counts.numberAttempted=5 AND counts.numberFailed=0;'
            var ruleID = rulesData[pos].ruleID;
            console.log("SQL "+sql);
            sys.db.get(sql,[lang,studentID,classID,ruleID,classID,ruleID],function(err,row){
                if (err) {return oops(response,err,'**quiz/readrules(2)')};
                if (row) {
                    console.log("ROW "+row+" classID="+row.classID+" studentID="+studentID+" ruleID="+row.ruleID+" numberAttempted="+row.numberAttempted+" numberFailed="+row.numberFailed);
                } else {
                    console.log("NO RETURN");
                }
                if (row && row.ruleText) {
                    data = rulesData[pos];
                    data.ruleText = row.ruleText;
                    data.origGloss = row.origGloss;
                    data.transGloss = row.transGloss;
                    rulesReturn.push(data);
                }
                pos += 1;
                if (pos < limit) {
                    getRuleResults(pos,limit);
                } else {
                    endTransaction();
                }
            });
        };
        function endTransaction () {
            sys.db.run('END TRANSACTION',function(err){
                if (err) {return oops(response,err,'**quiz/readrules(3)')};
                console.log("OK "+JSON.stringify(rulesReturn));
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(rulesReturn));
            });
        };
    }
    exports.cogClass = cogClass;
})();
