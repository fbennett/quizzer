(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var db = this.sys.db;
        var getCommenterLanguages = this.utils.getCommenterLanguages;
        var getMistakenChoices = this.utils.getMistakenChoices;
        var locale = this.sys.locale;
        var commenterKey = params.commenter;

        getCommenterLanguages(commenterKey,getClassData);

        function getClassData (commenterLangs) {

            var mistakenChoices = getMistakenChoices(locale,commenterLangs);

            var sql = "SELECT name,classes.classID,CASE WHEN examName IS NULL THEN COUNT(res.commentNeeded) ELSE 0 END AS numberOfCommentsNeeded "
                + "FROM classes "
                + "JOIN quizzes USING(classID) "
                + "LEFT JOIN ("
                + getMistakenChoices(locale,commenterLangs).sql
                + ") as res ON res.classID=quizzes.classID AND quizzes.quizNumber=res.quizNumber "
                + "WHERE sent=1 "
                + "GROUP BY classes.classID "
                + "ORDER BY name";
            var sqlVars = mistakenChoices.vars;
            
            db.all(sql,sqlVars,function(err,rows){
                if (err||!rows) {return oops(response,err,'classes/readclasses')};
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(rows));
            });
        }
    }
    exports.cogClass = cogClass;
})();
