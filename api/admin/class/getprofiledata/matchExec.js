(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var adminID = params.adminid;
        var classID = params.classid;
        var sys = this.sys;

        // Splits generate two cohorts of (roughly) equal length, graphed separately

        var graphData = [[],[]];

        beginTransaction();

        function beginTransaction () {
            sys.db.run('BEGIN TRANSACTION',function(err){
                if (err) {return oops(response,err,'class/getprofiledata(1)')};
                getStudents();
            });
        };

        function getStudents() {
            // Get a list of students. Splits will be done per-student, to get
            // an idea of per-student progress.
            var sql = "SELECT studentID FROM memberships WHERE classID=?;";
            sys.db.all(sql,[classID],function(err,rows){
                if (err|!rows) {return oops(response,err,'class/getprofiledata(1)')};
                getData(0,rows.length,rows);
            });
        }

        function getData(pos,limit,students) {
            // Get a list of unique answerIDs, sorted by submission date, quiz number, then question number.
            if (pos === limit) {
                endTransaction();
                return;
            }
            var studentID = students[pos].studentID;
            var sql = 'SELECT A.studentID,'
                + 'CASE WHEN Q.correct=A.choice THEN 1 ELSE 0 END AS correct '
                + 'FROM quizzes QZ '
                + 'JOIN questions Q USING(quizID) '
                + 'JOIN answers A USING(questionID) '
                + 'JOIN students S USING(studentID) '
                + 'JOIN quizAnswers QA USING(quizID,studentID) '
                + 'WHERE classID=? AND studentID=? AND privacy=0 AND QZ.examName IS NULL '
                + 'ORDER BY QA.submissionDate ASC,QZ.quizNumber ASC,Q.questionNumber ASC '
            sys.db.all(sql,[classID,studentID],function(err,rows){
                if (err||!rows) {return oops(response,err,'class/getprofiledata(2)')};
                var splitPoint = ~~(rows.length/2);
                graphData[0] = graphData[0].concat(rows.slice(0,splitPoint));
                graphData[1] = graphData[1].concat(rows.slice(splitPoint));
                getData(pos+1,limit,students);
            });

        };

        function endTransaction() {
            sys.db.run('END TRANSACTION',function(err){
                if (err) {return oops(response,err,'class/getprofiledata(3)')};
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(graphData));
            });
        };

    }
    exports.cogClass = cogClass;
})();
