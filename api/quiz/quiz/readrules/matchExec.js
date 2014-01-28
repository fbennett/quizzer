(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var classID = params.classid;
        var studentID = params.studentid;
        var studentKey = params.studentkey;
        var lang = params.lang;

        // Final stretch! Gameiness.

        // We need a list of individual rules that:
        // * are tagged against at least one choice in five questions, working back from the most recent
        // * and were not violated in any of those five questions

        var sql = 'SELECT ruleID '
            + 'FROM classes '
            + 'JOIN quizzes USING(classID) '
            + 'JOIN questions USING(quizID) '
            + 'JOIN choices USING(questionID) '
            + 'JOIN answers AS ans USING(questionID,choice) '
            + 'JOIN rulesToChoices USING(choiceID) '

        var sql = 'SELECT ruleID,'
            + 'string AS ruleText,'
            + 'CASE WHEN trans.ruleID IS NOT NULL THEN 1 ELSE NULL END AS hasGloss '
            + 'FROM classes '
            + 'JOIN rules USING(ruleGroupID) '
            + 'JOIN ruleStrings USING(ruleStringID) '
            + 'LEFT JOIN (SELECT ruleID FROM ruleTranslations WHERE lang=?) AS trans USING(ruleID) '
            + 'WHERE classes.classID=? AND rules.adminID=1 '
            + 'ORDER BY hasGloss,ruleText;';
        sys.db.all(sql,[lang,classID],function(err,rows){
            if (err||!rows) {return oops(response,err,'**classes/readrules(1)')};
            //console.log(JSON.stringify(rows,null,2));
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
