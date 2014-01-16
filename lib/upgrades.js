(function () {
    var upgraderClass = function (db,fromVersion,toVersion) {
        this.fromVersion = fromVersion;
        this.toVersion = toVersion;
        this.db = db;
    };
    upgraderClass.prototype.run = function (callback) {
        var db = this.db;
        var pos = this.fromVersion-1;
        console.log("Upgrading schema from version " + this.fromVersion + " to version " + this.toVersion);
        var toVersion = this.toVersion;

        var steps = [
            function () {
                db.run('BEGIN TRANSACTION',function(err){
                    reportStep(0,err);
                    performUpgrade();
                });
                function performUpgrade (){
                    db.exec(
                        'CREATE TEMP TABLE oldAdmin AS SELECT * FROM admin;'
                            + 'DROP TABLE admin;'
                            + 'CREATE TABLE admin (adminID INTEGER PRIMARY KEY,name TEXT, adminKey TEXT, role INTEGER, interval INTEGER);'
                            + 'CREATE UNIQUE INDEX admin_name_idx ON admin(name);'
                            + 'CREATE UNIQUE INDEX admin_key_idx ON admin(adminKey);'
                            + 'INSERT INTO admin (name,adminKey,role,interval) SELECT name,adminID AS adminKey,role,interval FROM oldAdmin;'
                            + 'ALTER TABLE comments ADD COLUMN commenterID INTEGER;'
                            + 'CREATE TEMP TABLE newComments AS SELECT c.commentID,c.classID,c.quizNumber,c.questionNumber,c.choice,c.commentTextID,a.adminID AS commenterID FROM comments AS c JOIN admin AS a ON a.name=c.commenter;'
                            + 'DROP TABLE comments;'
                            + 'CREATE TABLE comments ('
                            +   'commentID INT PRIMARY KEY,'
                            +   'classID INT,'
                            +   'quizNumber INT,'
                            +   'questionNumber INT,'
                            +   'choice INT,'
                            +   'commentTextID INT,'
                            +   'commenterID INT'
                            + ');'
                            + 'INSERT INTO comments SELECT * FROM newComments;'
                            + 'CREATE UNIQUE INDEX comments_idx ON comments(classID,quizNumber,questionNumber,choice,commenterID);'
                        ,function(err){
                        reportStep(1,err);
                        setVersion();
                    });
                };
                function setVersion () {
                    db.run('UPDATE version SET version=? WHERE schema=?',[(pos+2),'quizzer'],function(err){
                        reportStep(2,err);
                        closeTransaction();
                    });
                }
                function closeTransaction () {
                    db.run('END TRANSACTION',function(err){
                        reportStep(3,err);
                        nextStep();
                    });
                }
            },
            function () {
                db.run('BEGIN TRANSACTION',function(err){
                    reportStep(0,err);
                    performUpgrade();
                });
                function performUpgrade (){
                    db.exec(
                        'ALTER TABLE quizzes ADD COLUMN examName TEXT;'
                            + 'ALTER TABLE quizzes ADD COLUMN examDate TEXT;'
                        ,function(err){
                        reportStep(1,err);
                        setVersion();
                    });
                };
                function setVersion () {
                    db.run('UPDATE version SET version=? WHERE schema=?',[(pos+2),'quizzer'],function(err){
                        reportStep(2,err);
                        closeTransaction();
                    });
                }
                function closeTransaction () {
                    db.run('END TRANSACTION',function(err){
                        reportStep(3,err);
                        nextStep();
                    });
                }
            },
            function () {
                db.run('BEGIN TRANSACTION',function(err){
                    reportStep(0,err);
                    performUpgrade();
                });
                function performUpgrade (){
                    db.exec(
                        'ALTER TABLE admin ADD COLUMN email TEXT;'
                        ,function(err){
                        reportStep(1,err);
                        setVersion();
                    });
                };
                function setVersion () {
                    db.run('UPDATE version SET version=? WHERE schema=?',[(pos+2),'quizzer'],function(err){
                        reportStep(2,err);
                        closeTransaction();
                    });
                }
                function closeTransaction () {
                    db.run('END TRANSACTION',function(err){
                        reportStep(3,err);
                        nextStep();
                    });
                }
            },
            function () {
                db.run('BEGIN TRANSACTION',function(err){
                    reportStep(0,err);
                    performUpgrade();
                });
                function performUpgrade (){
                    db.exec(
                        'ALTER TABLE memberships ADD COLUMN last_mail_date DATE;'
                        ,function(err){
                        reportStep(1,err);
                        setVersion();
                    });
                };
                function setVersion () {
                    db.run('UPDATE version SET version=? WHERE schema=?',[(pos+2),'quizzer'],function(err){
                        reportStep(2,err);
                        closeTransaction();
                    });
                }
                function closeTransaction () {
                    db.run('END TRANSACTION',function(err){
                        reportStep(3,err);
                        nextStep();
                    });
                }
            },
            function () {
                db.run('BEGIN TRANSACTION',function(err){
                    reportStep(0,err);
                    performUpgrade();
                });
                function performUpgrade (){
                    db.exec(
                        'CREATE TABLE IF NOT EXISTS showing (showID INTEGER PRIMARY KEY, adminID INTEGER, classID INTEGER, studentID INTEGER);'
                        ,function(err){
                        reportStep(1,err);
                        setVersion();
                    });
                };
                function setVersion () {
                    db.run('UPDATE version SET version=? WHERE schema=?',[(pos+2),'quizzer'],function(err){
                        reportStep(2,err);
                        closeTransaction();
                    });
                }
                function closeTransaction () {
                    db.run('END TRANSACTION',function(err){
                        reportStep(3,err);
                        nextStep();
                    });
                }
            },
            function () {
                db.run('BEGIN TRANSACTION',function(err){
                    reportStep(0,err);
                    performUpgrade();
                });
                function performUpgrade (){
                    db.exec(
                        'CREATE UNIQUE INDEX IF NOT EXISTS showing_idx ON showing(adminID,classID,studentID);'
                        ,function(err){
                        reportStep(1,err);
                        setVersion();
                    });
                };
                function setVersion () {
                    db.run('UPDATE version SET version=? WHERE schema=?',[(pos+2),'quizzer'],function(err){
                        reportStep(2,err);
                        closeTransaction();
                    });
                }
                function closeTransaction () {
                    db.run('END TRANSACTION',function(err){
                        reportStep(3,err);
                        nextStep();
                    });
                }
            },
            function () {
                db.run('BEGIN TRANSACTION',function(err){
                    reportStep(0,err);
                    performUpgrade();
                });
                function performUpgrade (){
                    db.exec(
                        'CREATE TEMP TABLE newAnswers AS SELECT a.answerID,q.questionID,a.studentID,a.choice FROM answers AS a JOIN questions AS q ON q.classID=a.classID AND q.quizNumber=a.quizNumber AND q.questionNumber=a.questionNumber;'
                            + 'DROP INDEX answers_idx;'
                            + 'DROP TABLE answers;'
                            + 'CREATE TABLE answers AS SELECT * FROM newAnswers;'
                            + 'CREATE UNIQUE INDEX answers_idx ON answers(questionID,studentID,choice);'
                        ,function(err){
                        reportStep(1,err);
                        setVersion();
                    });
                };
                function setVersion () {
                    db.run('UPDATE version SET version=? WHERE schema=?',[(pos+2),'quizzer'],function(err){
                        reportStep(2,err);
                        closeTransaction();
                    });
                }
                function closeTransaction () {
                    db.run('END TRANSACTION',function(err){
                        reportStep(3,err);
                        nextStep();
                    });
                }
            },
            function () {
                db.run('BEGIN TRANSACTION',function(err){
                    reportStep(0,err);
                    performUpgrade();
                });
                function performUpgrade (){
                    // Clean up a potential mess of duplicate answer entries, in preparation
                    // for turning on foreign key constraints
                    db.exec(
                        'CREATE TEMP TABLE newAnswers AS SELECT * FROM answers;'
                            + 'DROP TABLE answers;'
                            + 'CREATE TABLE answers('
                            +   'answerID INTEGER PRIMARY KEY AUTOINCREMENT,'
                            +   'questionID INTEGER,'
                            +   'studentID INTEGER,'
                            +   'choice INTEGER'
                            + ');'
                            + 'INSERT INTO answers SELECT * FROM newAnswers WHERE answerID IS NOT NULL;'
                            + 'INSERT INTO answers (questionID,studentID,choice) SELECT questionID,studentID,choice FROM newAnswers WHERE answerID IS NULL;'
                            + 'DROP TABLE newAnswers;'
                            + 'CREATE UNIQUE INDEX answers_idx ON answers(questionID,studentID,choice);'
                            + 'CREATE TEMP TABLE uniqueAnswerIDs AS '
                            +   'SELECT a.answerID FROM answers AS a '
                            +   'JOIN answers AS aa ON aa.questionID=a.questionID AND aa.studentID=a.studentID AND ('
                            +     'NOT a.answerID=aa.answerID '
                            +     'OR a.answerID IS NULL'
                            +   ') '
                            +   'LEFT JOIN questions AS q ON q.questionID=a.questionID '
                            +   'GROUP BY a.questionID,a.answerID '
                            +   'ORDER BY q.classID,q.quizNumber,q.questionNumber,a.answerID DESC;'
                            + 'DELETE FROM answers WHERE answerID IN ('
                            +   'SELECT a.answerID FROM answers AS a '
                            +   'JOIN answers AS aa ON aa.questionID=a.questionID '
                            +   'AND aa.studentID=a.studentID '
                            +   'AND ('
                            +     'NOT a.answerID=aa.answerID '
                            +     'OR a.answerID IS NULL'
                            +   ')'
                            + ') '
                            + 'AND answerID NOT IN (select answerID FROM uniqueAnswerIDs);'
                        ,function(err){
                        reportStep(1,err);
                        setVersion();
                    });
                };
                function setVersion () {
                    db.run('UPDATE version SET version=? WHERE schema=?',[(pos+2),'quizzer'],function(err){
                        reportStep(2,err);
                        closeTransaction();
                    });
                }
                function closeTransaction () {
                    db.run('END TRANSACTION',function(err){
                        reportStep(3,err);
                        nextStep();
                    });
                }
            }
        ];

        function reportStep(opno,err) {
            if (err) throw 'Upgrade error at step pos=' + pos + '(' + opno + '): ' + err;
            if (!opno) {
                console.log("* Migrating version " + (pos+1) + " schema to version " + (pos+2));
            }
        };
        function nextStep() {
            pos += 1;
            if (pos === steps.length) {
                callback();
            } else {
                steps[pos]();
            }
        };
        steps[pos]();

    };
    exports.upgraderClass = upgraderClass;
})();
