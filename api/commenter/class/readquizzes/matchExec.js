(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var db = this.sys.db;
        var getCommenterLanguages = this.utils.getCommenterLanguages;
        var getMistakenChoices = this.utils.getMistakenChoices;
        var classID = params.classid;
        var locale = this.sys.locale;
        var commenterKey = params.commenter;

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


        getCommenterLanguages(commenterKey,getQuizData);

        function getQuizData(commenterLangs) {
            
            var mistakenChoices = getMistakenChoices(locale,commenterLangs,classID);
            
            // console.log("XX "+mistakenChoices.sql);
            // console.log("XX "+mistakenChoices.vars);

            var sql = "SELECT quizzes.quizNumber,examName,CASE WHEN examName IS NULL THEN COUNT(res.commentNeeded) ELSE 0 END AS numberOfCommentsNeeded "
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

        
    }
    exports.cogClass = cogClass;
})();

