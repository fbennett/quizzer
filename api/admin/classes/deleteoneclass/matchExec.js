(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var sys = this.sys;

        // Simple classID deletes: memberships, showing

        // Chained deletes:
        //   answers [each questionID]
        //   choices [each questionID]
        //   quizAnswers [each quizID]
        //   questions [each quizID]
        //   quizzes [for the classID]

        // Purges:

        //   students (dependencies):
        //     memberships
        //     showing
        //     quizAnswers
        //     answers
        //     ruleTranslationEdits

        //   strings (dependencies):
        //     questions
        //     choices
        //     comments

        sys.db.run('BEGIN TRANSACTION',function(err){
            if (err) {return oops(response,err,'**classes/deleteoneclass(1)')};
            deleteOne(0);
        });

        var deleteTables = ["memberships","showing"];
        function deleteOne (pos) {
            if (pos == deleteTables.length) {
                deleteAnswers();
                return;
            }
            var table = deleteTables[pos];
            var sql = "DELETE FROM " + table + " WHERE classID=?;"
            sys.db.run(sql,[classID],function (err) {
                if (err) {return oops(response,err,'classes/deleteoneclass [deleteOne] (' + pos + ')')};
                deleteOne(pos+1);
            });
        }

        function deleteAnswers() {
            var sql = "DELETE FROM answers WHERE questionID IN (SELECT questionID "
                + "FROM questions WHERE quizID IN (SELECT quizID "
                + "FROM quizzes WHERE classID=?));"
            sys.db.run(sql,[classID],function (err) {
                if (err) {return oops(response,err,'classes/deleteoneclass [deleteAnswers]')};
                deleteComments();
            });
        }

        function deleteComments() {
            var sql = "DELETE FROM comments WHERE choiceID IN (SELECT choiceID "
                + "FROM choices WHERE questionID IN (SELECT questionID "
                + "FROM questions WHERE quizID IN (SELECT quizID "
                + "FROM quizzes WHERE classID=?)));"
            sys.db.run(sql,[classID],function (err) {
                if (err) {return oops(response,err,'classes/deleteoneclass [deleteComments]')};
                deleteRulesToChoices();
            });
        }

        function deleteRulesToChoices() {
            var sql = "DELETE FROM rulesToChoices WHERE choiceID IN (SELECT choiceID "
                + "FROM choices WHERE questionID IN (SELECT questionID "
                + "FROM questions WHERE quizID IN (SELECT quizID "
                + "FROM quizzes WHERE classID=?)));"
            sys.db.run(sql,[classID],function (err) {
                if (err) {return oops(response,err,'classes/deleteoneclass [deleteComments]')};
                deleteChoices();
            });
        }

        function deleteChoices() {
            var sql = "DELETE FROM choices WHERE questionID IN (SELECT questionID "
                + "FROM questions WHERE quizID IN (SELECT quizID "
                + "FROM quizzes WHERE classID=?));"
            sys.db.run(sql,[classID],function (err) {
                if (err) {return oops(response,err,'classes/deleteoneclass [deleteChoices]')};
                deleteQuizAnswers();
            });
        }

        function deleteQuizAnswers() {
            var sql = "DELETE FROM quizAnswers WHERE quizID IN (SELECT quizID "
                + "FROM quizzes WHERE classID=?);"
            sys.db.run(sql,[classID],function (err) {
                if (err) {return oops(response,err,'classes/deleteoneclass [deleteQuizAnswers]')};
                deleteQuestions();
            });
        }

        function deleteQuestions() {
            var sql = "DELETE FROM questions WHERE quizID IN (SELECT quizID "
                + "FROM quizzes WHERE classID=?);"
            sys.db.run(sql,[classID],function (err) {
                if (err) {return oops(response,err,'classes/deleteoneclass [deleteQuestions]')};
                deleteQuizzes();
            });
        }

        function deleteQuizzes() {
            var sql = "DELETE FROM quizzes WHERE classID=?;"
            sys.db.run(sql,[classID],function (err) {
                if (err) {return oops(response,err,'classes/deleteoneclass [deleteQuizzes]')};
                deleteClasses();
            });
        }

        function deleteClasses() {
            var sql = "DELETE FROM classes WHERE classID=?;"
            sys.db.run(sql,[classID],function (err) {
                if (err) {return oops(response,err,'classes/deleteoneclass [deleteClasses]')};
                purgeStudents();
            });
        }

        function purgeStudents () {
            var sql = "DELETE FROM students WHERE studentID IN "
                + "(SELECT S.studentID FROM students S "
                + "  LEFT JOIN memberships M ON M.studentID=S.studentID "
                + "  LEFT JOIN showing Sh ON Sh.studentID=S.studentID "
                + "  LEFT JOIN quizAnswers QA ON QA.studentID=S.studentID "
                + "  LEFT JOIN answers A ON A.studentID=S.studentID "
                + "  LEFT JOIN ruleTranslationEdits RTE ON RTE.studentID=S.studentID "
                + "WHERE M.studentID IS NULL "
                + "  AND Sh.studentID IS NULL "
                + "  AND QA.studentID IS NULL "
                + "  AND A.studentID IS NULL "
                + "  AND RTE.studentID IS NULL);";
            sys.db.run(sql,function(err){
                if (err) {return oops(response,err,'classes/deleteoneclass [purgeStudents]')};
                purgeStrings();
            });
            
        }

        function purgeStrings () {
            var sql = "DELETE FROM strings WHERE stringID IN "
                + "(SELECT S.stringID FROM strings S "
                + "  LEFT JOIN questions Q ON Q.stringID=S.stringID "
                + "  LEFT JOIN choices Ch ON Ch.stringID=S.stringID "
                + "  LEFT JOIN comments Co ON Co.stringID=S.stringID "
                + "WHERE Q.stringID IS NULL "
                + "  AND Ch.stringID IS NULL "
                + "  AND Co.stringID IS NULL);";
            sys.db.run(sql,function(err){
                if (err) {return oops(response,err,'classes/deleteoneclass [purgeStrings]')};
                endTransaction();
            });
            
        }

        function endTransaction() {
            sys.db.run('END TRANSACTION',function(err){
                if (err) {return oops(response,err,'classes/deleteoneclass(2)')};
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end('["success"]');
            });
        };







    }
    exports.cogClass = cogClass;
})();
