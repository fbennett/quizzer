(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var adminID = params.adminid;
        var classID = params.classid;
        var sys = this.sys;

        var randomTableName = 'tbl_' + sys.getRandomKey(8,36);
        
        // Split results into two cohorts of equal length, and graph each separately

        var graphData = [];

        beginTransaction();

        function beginTransaction () {
            sys.db.run('BEGIN TRANSACTION',function(err){
                if (err) {return oops(response,err,'class/getprofiledata(1)')};
                getData();
            });
        };

        // Get a list of unique answerIDs, sorted by submission date, quiz number, then question number.
        function getData() {
            // QZ.quizNumber,Q.questionNumber,answerID
            var sql = 'SELECT A.studentID,'
                + 'CASE WHEN Q.correct=A.choice THEN 1 ELSE 0 END AS correct '
                + 'FROM quizzes QZ '
                + 'JOIN questions Q USING(quizID) '
                + 'JOIN answers A USING(questionID) '
                + 'JOIN students S USING(studentID) '
                + 'JOIN quizAnswers QA USING(quizID,studentID) '
                + 'WHERE classID=? AND privacy=0 AND QZ.examName IS NULL '
                + 'ORDER BY QA.submissionDate ASC,QZ.quizNumber ASC,Q.questionNumber ASC,A.studentID '
            sys.db.all(sql,[classID],function(err,rows){
                if (err||!rows) {return oops(response,err,'class/getprofiledata(1)')};
                graphData = rows;
                endTransaction();
            });

        };

        function endTransaction() {
            sys.db.run('END TRANSACTION',function(err){
                if (err) {return oops(response,err,'class/getprofiledata(2)')};
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
