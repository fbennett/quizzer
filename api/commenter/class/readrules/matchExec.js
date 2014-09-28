(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var commenterID = this.sys.admin[params.commenter].id;
        var classID = params.classid;
        var lang = params.lang;
        var systemLang = this.sys.locale;
        // Report all rules that have English, with:
        //
        // * [integer] flag representing
        //   - [0] no gloss yet in this language (RED)
        //   - [1] English revision date later than most recent gloss revision (ORANGE)
        //   - [2] Most recent gloss revision is by a student (YELLOW)
        //   - [3] Most recent gloss revision is by a commenter (GREEN)
        //
        // Should be tracking times as well as dates, but this all works.
        //
        var sql = "SELECT "
            + "  R.ruleID,"
            + "  RS.string AS ruleText,"
            + "  EN.ruleTranslationID AS enID,"
            + "  XX.ruleTranslationID AS xxID,"
            + "  EN.editDate AS ENEditDate,"
            + "  XX.editDate AS XXEditDate,"
            + "  enMaxDate,"
            + "  xxMaxDate,"
            + "  CASE "
            + "    WHEN EN.ruleID IS NULL THEN 0 "
            + "    WHEN ?=? THEN 3 "
            + "    WHEN XX.ruleTranslationID IS NULL THEN 0 "
            + "    WHEN "
            + "      CASE "
            + "        WHEN enMaxDate IS NULL THEN '1970-01-02' "
            + "        ELSE enMaxDate "
            + "      END "
            + "      > "
            + "      CASE "
            + "        WHEN xxMaxDate IS NULL THEN '1970-01-01' "
            + "        ELSE xxMaxDate "
            + "      END "
            + "      THEN 1 "
            + "    WHEN XX.studentID IS NOT NULL THEN 2 "
            + "    ELSE 3 "
            + "  END AS status "
            + "FROM classes "
            + "JOIN rules R USING(ruleGroupID) "
            + "JOIN ruleStrings RS USING(ruleStringID) "
            + "LEFT JOIN ("
            + "  SELECT "
            + "    ruleID,"
            + "    ruleTranslationID,"
            + "    editDate "
            + "  FROM ruleTranslations "
            + "  LEFT JOIN ruleTranslationEdits USING(ruleTranslationID) "
            + "  WHERE lang=?"
            + ") EN ON R.ruleID=CAST(EN.ruleID AS INTEGER) "
            + "LEFT JOIN ("
            + "  SELECT "
            + "    ruleID,"
            + "    ruleTranslationID,"
            + "    studentID,"
            + "    editDate "
            + "  FROM ruleTranslations "
            + "  LEFT JOIN ruleTranslationEdits USING(ruleTranslationID) "
            + "  WHERE lang=?"
            + ") AS XX ON R.ruleID=CAST(XX.ruleID AS INTEGER) "
            + "LEFT JOIN ("
            + "  SELECT "
            + "    ruleTranslationID AS enRuleTranslationID,"
            + "    MAX(editDate) AS enMaxDate "
            + "  FROM ruleTranslations "
            + "  JOIN ruleTranslationEdits USING(ruleTranslationID) "
            + "  WHERE ruleTranslations.lang=? "
            + "  GROUP BY ruleTranslationID"
            + ") ON EN.ruleTranslationID=enRuleTranslationID AND EN.editDate=enMaxDate "
            + "LEFT JOIN ("
            + "  SELECT "
            + "    ruleTranslationID AS xxRuleTranslationID,"
            + "    MAX(editDate) AS xxMaxDate "
            + "  FROM ruleTranslations "
            + "  JOIN ruleTranslationEdits USING(ruleTranslationID) "
            + "  WHERE ruleTranslations.lang=? "
            + "GROUP BY ruleTranslationID"
            + ") ON XX.ruleTranslationID=xxRuleTranslationID AND XX.editDate=xxMaxDate "
            + "WHERE classID=? "
            + "GROUP BY R.ruleID "
            + "ORDER BY ruleText;"
        sys.db.all(sql,[systemLang,lang,systemLang,lang,systemLang,lang,classID],function(err,rows){
            if (err||!rows) {return oops(response,err,'**classes/readrules(1)')};
            //console.log("XXX "+JSON.stringify(rows,null,2))
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
