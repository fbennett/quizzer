(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var db = this.sys.db;
        var classID = params.classid;
        var locale = this.sys.locale;
        var commenterKey = params.commenter;
        var commenterLangs = [];
        var commenterID;

        getCommenterLanguages();

        // Get all quizzes sent
        // Add a field numberOfCommentsNeeded that is a count of
        // wrong answers for the target quiz that do NOT have a 
        // corresponding comment in the comments table.
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
        // Project: extend this so that it counts all items that (a)
        // for instance-language commenters (and commenters with no
        // designated language) *have* *not* *been* commented in the
        // instance language; or (b) for other-language commenters
        // *have* *been* commented in the instance language, but
        // *have* *not* *been* commented in (all of) the language(s)
        // of the commenter.
        //
        // The idea is that other-language commenters be invited to
        // follow the lead of the instance-language comments, for the
        // benefit of students who can benefit from the extra support.
        //
        // Final do-list:
        //   For other-language mode:
        //     * Inject query SQL and build variable list for other language(s) [DONE]
        //     * Toggle commentNeeded based on whether OTHER.choiceID count     [DONE]
        //       is equal to commenter language count
        //   For instance-language mode:
        //     * Completely drop out OTHER SQL block                            [DONE]
        //     * Keep current toggle behavior                                   [DONE]


        // XXX Need to collect commenter languages before executing the code below. Just chain SQL calls to keep from going completely crazy.
        function getCommenterLanguages() {
            var sql = "SELECT adminID,lang FROM admin LEFT JOIN adminLanguages USING (adminID) WHERE adminKey=?;"
            db.all(sql,[commenterKey],function(err,rows){
                if (err||!rows) {return oops(response,err,'class/readquizzes(1)')};
                for (var i=0,ilen=rows.length;i<ilen;i++) {
                    var commenter = rows[i];
                    commenterID = commenter.adminID;
                    if (commenter.lang) {
                        commenterLangs.push(commenter.lang);
                    }
                }
                getQuizData(commenterID,commenterLangs);
            })
        }


        function getQuizData(commenterID,commenterLangs) {
            
            var otherLanguageJoin = "LEFT JOIN ("
                +     "SELECT choiceID "
                +     "FROM quizzes "
                +     "JOIN questions USING(quizID) "
                +     "JOIN choices USING(questionID) "
                +     "JOIN answers USING(questionID,choice) "
                +     "JOIN comments USING(choiceID) "
                +     "JOIN admin USING(adminID) "
                +     "JOIN adminLanguages USING(adminID) "
                +     "WHERE classID=? AND NOT answers.choice=questions.correct AND lang IN (@@langSQL@@) "     // commenter langs
                +   ") OTHER USING(choiceID) ";

            var instanceCounterSQL = "CASE WHEN INSTANCE.choiceID IS NULL THEN 1 ELSE NULL END";

            var otherCounterSQL = "CASE WHEN INSTANCE.choiceID IS NOT NULL AND COUNT(OTHER.choiceID) < @@COMMENTER_LANGUAGE_COUNT@@ THEN 1 ELSE NULL END";

            var instanceInnerSelectConditions = "INSTANCE.choiceID IS NULL AND rulesToChoices.choiceID IS NULL ";

            var otherInnerSelectConditions = "students.lang IN (@@langSQL@@) AND INSTANCE.choiceID IS NOT NULL AND OTHER.choiceID IS NULL ";

            // For locale commentrs, below
            // "WHERE quizzes.classID=? AND NOT answers.choice=questions.correct AND INSTANCE.choiceID IS NULL AND rulesToChoices.choiceID IS NULL "
            //


            var sql = "SELECT quizzes.quizNumber,examName,COUNT(res.commentNeeded) AS numberOfCommentsNeeded "
                + "FROM quizzes "
                + "LEFT JOIN ("
                +   "SELECT classID,quizNumber,@@INSTANCE_COUNTER@@ AS commentNeeded "
                +   "FROM quizzes "
                +   "JOIN questions USING(quizID) "
                +   "JOIN choices USING(questionID) "
                +   "JOIN answers USING(questionID,choice) "
                +   "JOIN students USING(studentID) "
                +   "LEFT JOIN ("
                +     "SELECT choiceID "
                +     "FROM quizzes "
                +     "JOIN questions USING(quizID) "
                +     "JOIN choices USING(questionID) "
                +     "JOIN answers USING(questionID,choice) "
                +     "JOIN comments USING(choiceID)"
                +     "JOIN admin USING(adminID) "
                +     "JOIN adminLanguages USING(adminID) "
                +     "WHERE classID=? AND NOT answers.choice=questions.correct AND lang=? "                        // instance lang
                +   ") INSTANCE USING(choiceID) "
                +   "@@OTHER_LANGUAGE_JOIN@@"
                +   "LEFT JOIN rulesToChoices USING(choiceID) "
                +   "WHERE quizzes.classID=? AND NOT answers.choice=questions.correct AND @@INNER_SELECT_CONDITIONS@@ "
                +   "GROUP BY quizzes.quizNumber, questions.questionNumber, choices.choice "
                + ") as res ON res.classID=quizzes.classID AND res.quizNumber=quizzes.quizNumber "
                + "WHERE quizzes.classID=? AND sent=1 "
                + "GROUP BY quizzes.quizNumber;";

            var sqlVars;

            // XXX Add the otherCounterSQL substitutions below, etc ...

            if (commenterLangs.indexOf(locale) > -1) {
                // Instance lang mode
                sql = sql.replace("@@INSTANCE_COUNTER@@",instanceCounterSQL);
                sqlVars = [classID,locale,classID,classID];
                sql = sql.replace('@@OTHER_LANGUAGE_JOIN@@','');
                sql = sql.replace('@@INNER_SELECT_CONDITIONS@@',instanceInnerSelectConditions);
            } else {
                // Commenter lang mode
                var commenterLanguageCount = 0;
                var langSQL = [];
                sqlVars = [classID,locale,classID];
                for (var i=0,ilen=commenterLangs.length;i<ilen;i++) {
                    sqlVars.push(commenterLangs[i]);
                    langSQL.push('?');
                    commenterLanguageCount += 1;
                }
                langSQL = langSQL.join(',');
                sqlVars.push(classID);
                for (var i=0,ilen=commenterLangs.length;i<ilen;i++) {
                    sqlVars.push(commenterLangs[i]);
                }
                sqlVars.push(classID);
                sql = sql.replace('@@OTHER_LANGUAGE_JOIN@@',otherLanguageJoin);
                otherCounterSQL = otherCounterSQL.replace("@@COMMENTER_LANGUAGE_COUNT@@",commenterLanguageCount);
                sql = sql.replace("@@INSTANCE_COUNTER@@",otherCounterSQL);
                sql = sql.replace('@@INNER_SELECT_CONDITIONS@@',otherInnerSelectConditions);
                sql = sql.replace("@@langSQL@@",langSQL);
                sql = sql.replace("@@langSQL@@",langSQL);
            }

            console.log("SQL: "+sql);
            console.log("VARS: "+sqlVars);

            db.all(sql,sqlVars,function(err,rows){
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
    }
    exports.cogClass = cogClass;
})();

