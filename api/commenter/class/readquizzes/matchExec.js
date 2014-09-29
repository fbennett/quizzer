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
                getQuizData(commenterLangs);
            });
        }
        
        function getQuizData(commenterLangs) {
            
            var mistakenChoices = getMistakenChoices(locale,commenterLangs,classID);

            var sql = "SELECT quizzes.quizNumber,examName,COUNT(res.commentNeeded) AS numberOfCommentsNeeded "
                + "FROM quizzes "
                + "LEFT JOIN ("
                +   mistakenChoices.sql
                + ") res ON res.classID=quizzes.classID AND res.quizNumber=quizzes.quizNumber "
                + "WHERE quizzes.classID=? AND sent=1 "
                + "GROUP BY quizzes.quizNumber;";


            var sqlVars = mistakenChoices.vars;
            sqlVars.push(classID);

            // console.log("XX "+sql);
            // console.log("XX "+sqlVars);

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

        function getMistakenChoices (locale,commenterLangs,classID,quizNumber) {
            
            if (commenterLangs) {
                if (commenterLangs.length) {
                    if (commenterLangs.indexOf(locale) > -1) {
                        commenterLangs = false;
                    }
                } else {
                    commenterLangs = false;
                }
            }
            
            function getSQL() {
                
                var sql = "SELECT classID,quizNumber,choices.choiceID," + returnColumns(commenterLangs) + " "
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
                    +     "WHERE classID=? AND NOT answers.choice=questions.correct AND lang=? " // instance lang
                    +   ") INSTANCE USING(choiceID) "
                    +   otherLanguageJoin(commenterLangs)
                    +   "LEFT JOIN rulesToChoices USING(choiceID) "
                    +   "WHERE quizzes.classID=? AND NOT answers.choice=questions.correct AND " + innerSelectConditions(commenterLangs) + " "
                    +   "GROUP BY quizzes.quizNumber, questions.questionNumber, choices.choice ";
                
                function returnColumns(commenterLangs) {
                    var sub = {
                        locale: "CASE WHEN INSTANCE.choiceID IS NULL THEN 1 ELSE NULL END AS commentNeeded",
                        langs: "CASE WHEN INSTANCE.choiceID IS NOT NULL AND COUNT(OTHER.choiceID) < " + commenterLangs.length + " THEN 1 ELSE NULL END AS commentNeeded"
                    }
                    return commenterLangs ? sub.langs : sub.locale;
                }
                
                function otherLanguageJoin(commenterLangs) {
                    var sub = {
                        locale: '',
                        langs: "LEFT JOIN ("
                            +     "SELECT choiceID "
                            +     "FROM quizzes "
                            +     "JOIN questions USING(quizID) "
                            +     "JOIN choices USING(questionID) "
                            +     "JOIN answers USING(questionID,choice) "
                            +     "JOIN comments USING(choiceID) "
                            +     "JOIN admin USING(adminID) "
                            +     "JOIN adminLanguages USING(adminID) "
                            +     "WHERE classID=? AND NOT answers.choice=questions.correct AND lang IN (" + langSQL() + ") "
                            +   ") OTHER USING(choiceID) "
                    }
                    return commenterLangs ? sub.langs : sub.locale;
                }
                
                function innerSelectConditions(commenterLangs) {
                    sub = {
                        locale: "INSTANCE.choiceID IS NULL AND rulesToChoices.choiceID IS NULL ",
                        langs: "students.lang IN (" + langSQL() + ") AND INSTANCE.choiceID IS NOT NULL AND OTHER.choiceID IS NULL "
                    }
                    return commenterLangs ? sub.langs : sub.locale;
                }               
                
                function langSQL () {
                    var ret = [];
                    for (var i=0,ilen=commenterLangs.length;i<ilen;i++) {
                        ret.push('?');
                    }
                    return ret.join(',');
                };

                return sql;
            };

            function getSqlVars () {
                var sqlVars;
                if (!commenterLangs) {
                    // Instance lang mode
                    sqlVars = [classID,locale,classID];
                } else {
                    // Commenter lang mode
                    sqlVars = [classID,locale,classID];
                    for (var i=0,ilen=commenterLangs.length;i<ilen;i++) {
                        sqlVars.push(commenterLangs[i]);
                    }
                    sqlVars.push(classID);
                    for (var i=0,ilen=commenterLangs.length;i<ilen;i++) {
                        sqlVars.push(commenterLangs[i]);
                    }
                }
                return sqlVars;
            }
            
            return { sql: getSQL(), vars: getSqlVars() }
        }
        
    }
    exports.cogClass = cogClass;
})();

