(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var adminID = params.adminid;
        var classID = params.classid;
        var sys = this.sys;

        var randomTableName = 'tbl_' + sys.getRandomKey(8,36);
        
        // Split results into two cohorts of equal length, and graph each separately

        var graphData = [[],[]];
        var midRowID = null;

        beginTransaction();

        function beginTransaction () {
            sys.db.run('BEGIN TRANSACTION',function(err){
                if (err) {return oops(response,err,'class/getprofiledata(1)')};
                makeTable();
            });
        };

        function makeTable () {
            // Use a temporary table with numbered rows
            var sql = 'CREATE TEMPORARY TABLE ' + randomTableName + ' ('
                +   'rowIndex INTEGER PRIMARY KEY AUTOINCREMENT,'
                +   'answerID,'
                +   'quizNumber'
                + ');'
            sys.db.run(sql,function(err){
                if (err) {return oops(response,err,'class/getprofiledata(2)')};
                populateTable();
            });
        };

        function populateTable() {
            var sql = 'INSERT INTO ' + randomTableName + ' (answerID,quizNumber) '
                + 'SELECT answerID,quizzes.quizNumber '
                +   'FROM quizzes '
                +   'JOIN questions USING(quizID) '
                +   'JOIN answers ON answers.questionID=questions.questionID '
                +   'JOIN students ON students.studentID=answers.studentID '
                +   'LEFT JOIN quizAnswers ON quizAnswers.quizID=quizzes.quizID AND quizAnswers.studentID=answers.studentID '
                +   'WHERE quizzes.classID=' + classID + ' AND privacy=0 AND quizzes.examName IS NULL '
                +   'ORDER BY quizAnswers.submissionDate,quizzes.quizNumber,questions.questionNumber,answers.studentID'
            sys.db.exec(sql,function(err){
                if (err){return oops(response,err,'class/getprofiledata(2)')};
                getMidRowID();
            });
        }

        function getMidRowID () {
            var sql = 'SELECT * FROM ' + randomTableName + ';'

            sys.db.all(sql,function(err,rows){
                if (err) {return oops(response,err,'class/getprofiledata(1)')};
                console.log("XX "+~~(rows.length/2));
                midRowID = rows[~~(rows.length/2)].rowIndex;
                //console.log("MID ROW ID: "+midRowID);
                evaluateData(0,2);
            });
        };

        function evaluateData (pos,limit) {
            if (pos === limit) {
                destroyTable();
                return;
            }
            if (pos === 0) {
                compStr = '<'
            } else {
                compStr = '>'
            }
            var sql = 'SELECT students.studentID,qa.submissionDate,quizzes.quizNumber,'
                + 'CAST(COUNT(correct.questionID) AS REAL)*100/CAST(COUNT(total.questionID) AS REAL) AS percentageCorrect '
                + 'FROM memberships '
                + 'JOIN students ON students.studentID=memberships.studentID '
                + 'JOIN quizzes ON quizzes.classID=memberships.classID '
                + 'JOIN questions USING(quizID) '
                + 'JOIN ('
                +   'SELECT questionID,answerID,studentID '
                +   'FROM answers'
                + ') AS total ON total.studentID=students.studentID AND total.questionID=questions.questionID '
                + 'LEFT JOIN quizAnswers AS qa ON qa.quizID=quizzes.quizID AND qa.studentID=memberships.studentID '
                + 'LEFT JOIN ('
                +   'SELECT answers.questionID,answers.answerID '
                +   'FROM questions '
                +   'JOIN answers USING(questionID) '
                +   'WHERE choice=correct'
                + ') AS correct ON correct.answerID=total.answerID '
                + 'WHERE privacy=0 AND memberships.classID=? AND total.answerID IN ('
                +   'SELECT answerID FROM ' + randomTableName + ' WHERE rowIndex ' + compStr + ' ? '
                + ') '
                + 'GROUP BY students.studentID '
                + 'ORDER BY percentageCorrect DESC;'
            sys.db.all(sql,[classID,midRowID],function(err,rows){
                if (err||!rows) {return oops(response,err,'class/getprofiledata(2)')};
                graphData[pos] = rows;
                evaluateData(pos+1,limit);
            });
        };

        function destroyTable () {
            var sql = 'DROP TABLE ' + randomTableName;
            sys.db.run(sql,function(err){
                if (err) {return oops(response,err,'class/getprofiledata(4)')};
                endTransaction();
            });
        };

        function endTransaction() {
            sys.db.run('END TRANSACTION',function(err){
                if (err) {return oops(response,err,'class/getprofiledata(5)')};
                sendResponse();
            });
        };

        function sendResponse () {
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(graphData));
        }
    }
    exports.cogClass = cogClass;
})();
