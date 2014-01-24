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
            },
            function () {
                db.run('BEGIN TRANSACTION',function(err){
                    reportStep(0,err);
                    performUpgrade();
                });
                function performUpgrade (){
                    db.exec(
                        'CREATE TEMP TABLE newAnswers AS SELECT * FROM answers;'
                            + 'DROP TABLE answers;'
                            + 'CREATE TABLE answers('
                            +   'answerID INTEGER PRIMARY KEY AUTOINCREMENT,'
                            +   'questionID INTEGER,'
                            +   'studentID INTEGER,'
                            +   'choice INTEGER,'
                            +   'UNIQUE(questionID,studentID,choice)'
                            +   'FOREIGN KEY (questionID) REFERENCES questions(questionID)'
                            + ');'
                            + 'INSERT INTO answers SELECT * FROM newAnswers;'
                            + 'DROP TABLE newAnswers;'
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
                        'PRAGMA foreign_keys = OFF;'
                            + 'CREATE TEMP TABLE newMemberships AS SELECT * FROM memberships;'
                            + 'DROP TABLE memberships;'
                            + ''
                            + 'CREATE TEMP TABLE newShowing AS SELECT * FROM showing;'
                            + 'DROP TABLE showing;'
                            + ''
                            + 'CREATE TEMP TABLE newAnswers AS SELECT * FROM answers;'
                            + 'DROP TABLE answers;'
                            + ''
                            + 'CREATE TEMP TABLE newQuestions AS SELECT *,quizID FROM questions AS qui JOIN quizzes AS que ON que.classID=qui.classID AND que.quizNumber=qui.quizNumber;'
                            + 'DROP TABLE questions;'
                            + ''
                            + ''
                            + 'CREATE TEMP TABLE newChoices (choiceID INTEGER PRIMARY KEY,questionID INTEGER,choice INTEGER,stringID INTEGER,classID INTEGER,quizNumber INTEGER,questionNumber INTEGER);'
                            + 'INSERT INTO newChoices (questionID,choice,stringID,classID,quizNumber,questionNumber) SELECT questionID,0,qOneID,classID,quizNumber,questionNumber FROM newQuestions;'
                            + 'INSERT INTO newChoices (questionID,choice,stringID,classID,quizNumber,questionNumber) SELECT questionID,1,qTwoID,classID,quizNumber,questionNumber FROM newQuestions;'
                            + 'INSERT INTO newChoices (questionID,choice,stringID,classID,quizNumber,questionNumber) SELECT questionID,2,qThreeID,classID,quizNumber,questionNumber FROM newQuestions;'
                            + 'INSERT INTO newChoices (questionID,choice,stringID,classID,quizNumber,questionNumber) SELECT questionID,3,qFourID,classID,quizNumber,questionNumber FROM newQuestions;'
                            + ''
                            + 'CREATE TEMP TABLE newQuizzes AS SELECT * FROM quizzes;'
                            + 'DROP TABLE quizzes;'
                            + ''
                            + 'ALTER TABLE comments ADD COLUMN choiceID INTEGER;'
                            + 'INSERT OR REPLACE INTO comments SELECT commentID,c.classID,c.quizNumber,c.questionNumber,c.choice,c.commentTextID,c.commenterID,nc.choiceID FROM comments AS c JOIN newChoices AS nc ON nc.classID=c.classID AND nc.quizNumber=c.quizNumber AND nc.questionNumber=c.questionNumber AND nc.choice=c.choice;'
                            + 'CREATE TABLE newComments AS SELECT * FROM comments;'
                            + 'DROP TABLE comments;'
                            + ''
                            + 'CREATE TABLE memberships (membershipID INTEGER PRIMARY KEY,classID INTEGER,studentID INTEGER,studentKey TEXT NOT NULL,last_mail_date DATE,UNIQUE (studentID,classID),FOREIGN KEY (studentID) REFERENCES students(studentID),FOREIGN KEY (classID) REFERENCES classes(classID));'
                            + 'INSERT INTO memberships SELECT * FROM newMemberships;'

                            + 'CREATE TABLE showing (showID INTEGER PRIMARY KEY,adminID INTEGER,classID INTEGER,studentID INTEGER,UNIQUE (adminID,classID,studentID),FOREIGN KEY (adminID) REFERENCES admin(adminID),FOREIGN KEY (classID) REFERENCES classes(classID),FOREIGN KEY (studentID) REFERENCES students(studentID));'
                            + 'INSERT INTO showing SELECT * FROM newShowing;'
                            + ''
                            + 'CREATE TABLE quizzes (quizID INTEGER PRIMARY KEY,classID INTEGER,quizNumber INTEGER,sent BOOLEAN,examName TEXT,examDate TEXT,UNIQUE (classID,quizNumber),FOREIGN KEY (classID) REFERENCES classes(classID));'
                            + 'INSERT INTO quizzes SELECT * FROM newQuizzes;'
                            + ''
                            + 'CREATE TABLE questions (questionID INTEGER PRIMARY KEY,quizID INTEGER,questionNumber INTEGER,correct INTEGER,stringID INTEGER,UNIQUE (quizID,questionNumber),FOREIGN KEY (quizID) REFERENCES quizzes(quizID),FOREIGN KEY (stringID) REFERENCES strings(stringID));'
                            + 'INSERT INTO questions SELECT questionID,quizID,questionNumber,correct,rubricID AS stringID FROM newQuestions;'
                            + ''
                            + 'CREATE TABLE answers(answerID INTEGER PRIMARY KEY AUTOINCREMENT,questionID INTEGER,studentID INTEGER,choice INTEGER,FOREIGN KEY (questionID) REFERENCES questions(questionID));'
                            + 'INSERT INTO answers SELECT * FROM newAnswers;'
                            + ''
                            + 'CREATE TABLE choices (choiceID INTEGER PRIMARY KEY,questionID INTEGER,choice INTEGER,stringID INTEGER,UNIQUE (questionID,choice),FOREIGN KEY (questionID) REFERENCES questions(questionID),FOREIGN KEY (stringID) REFERENCES strings(stringID));'
                            + 'INSERT INTO choices (choiceID,questionID,choice,stringID) SELECT choiceID,questionID,choice,stringID FROM newChoices;'
                            + ''
                            + 'CREATE TABLE comments (commentID INTEGER PRIMARY KEY,choiceID INTEGER,adminID INTEGER,stringID INTEGER,UNIQUE (choiceID,stringID),FOREIGN KEY (choiceID) REFERENCES choices(choiceID),FOREIGN KEY (adminID) REFERENCES admin(adminID),FOREIGN KEY (stringID) REFERENCES strings(stringID));'
                            + 'INSERT INTO comments (choiceID,adminID,stringID) SELECT choiceID,commenterID AS adminID,commentTextID AS stringID FROM newComments;'
                            + ''
                            + 'CREATE TABLE ruleStrings (ruleStringID INTEGER PRIMARY KEY,string TEXT NOT NULL,UNIQUE (string));'
                            + 'CREATE TABLE rules (ruleID INTEGER PRIMARY KEY,ruleStringID INTEGER,FOREIGN KEY (ruleStringID) REFERENCES ruleStrings(ruleStringID));'
                            + 'CREATE TABLE rulesToChoices (ruleToChoiceID INTEGER PRIMARY KEY,choiceID INTEGER,ruleID INTEGER,UNIQUE (choiceID,ruleID),FOREIGN KEY (choiceID) REFERENCES choices(choiceID),FOREIGN KEY (ruleID) REFERENCES rules(ruleID));'
                            + ''
                            + 'DELETE FROM quizzes '
                            + 'WHERE quizID IN ('
                            +     'SELECT quizID '
                            +     'FROM quizzes '
                            +     'LEFT JOIN classes AS x using(classID) '
                            +     'WHERE x.classID IS NULL'
                            + ');'
                            + ''
                            + 'DELETE FROM comments '
                            + 'WHERE commentID IN ('
                            +     'SELECT commentID '
                            +     'FROM comments '
                            +     'LEFT JOIN choices AS x using(choiceID) '
                            +     'WHERE x.choiceID IS NULL' 
                            + ');'
                            + ''
                            + '-- '
                            + '-- Drop the temporary tables'
                            + '-- '
                            + 'DROP TABLE newShowing;'
                            + 'DROP TABLE newMemberships;'
                            + 'DROP TABLE newAnswers;'
                            + 'DROP TABLE newQuizzes;'
                            + 'DROP TABLE newComments;'
                            + 'DROP TABLE newChoices;'
                            + 'DROP TABLE newQuestions;'
                            + 'PRAGMA foreign_keys = ON;'
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
                        'CREATE TEMP TABLE newRules AS SELECT * FROM rules;'
                            + 'DROP TABLE rules;'
                            + 'CREATE TABLE rules ('
                            +   'ruleID INTEGER PRIMARY KEY,'
                            +   'ruleStringID INTEGER,'
                            +   'active BOOLEAN,'
                            +   'FOREIGN KEY (ruleStringID) REFERENCES ruleStrings(ruleStringID)'
                            + ');'
                            + 'INSERT INTO rules SELECT ruleID,ruleStringID,1 FROM newRules;'
                            + 'DROP TABLE newRules;'
                            + 'CREATE TABLE ruleTranslations ('
                            +   'ruleTranslationID INTEGER PRIMARY KEY,'
                            +   'ruleID NOT NULL,'
                            +   'string TEXT NOT NULL,'
                            +   'lang TEXT NOT NULL,'
                            +   'UNIQUE (string),'
                            +   'UNIQUE (ruleID,lang),'
                            +   'FOREIGN KEY (ruleID) REFERENCES rules(ruleID)'
                            + ');'
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
                        'CREATE TEMP TABLE newRules AS SELECT * FROM rules;'
                            + 'DROP TABLE rules;'
                            + 'CREATE TABLE rules ('
                            +   'ruleID INTEGER PRIMARY KEY,'
                            +   'ruleStringID INTEGER,'
                            +   'adminID INTEGER,'
                            +   'FOREIGN KEY (adminID) REFERENCES admin(adminID),'
                            +   'FOREIGN KEY (ruleStringID) REFERENCES ruleStrings(ruleStringID)'
                            + ');'
                            + 'INSERT INTO rules SELECT ruleID,ruleStringID,1 FROM newRules;'
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
                        'CREATE TABLE adminLanguages ('
                            +   'adminLanguageID INTEGER PRIMARY KEY,'
                            +   'adminID INTEGER,'
                            +   'lang TEXT,'
                            +   'UNIQUE(adminID,lang),'
                            +   'FOREIGN KEY (adminID) REFERENCES admin(adminID),'
                            +   'FOREIGN KEY (lang) REFERENCES languages(lang)'
                            + ');'
                            + 'CREATE TABLE quizAnswers ('
                            +   'quizAnswerID INTEGER PRIMARY KEY,'
                            +   'quizID INTEGER,'
                            +   'studentID INTEGER,'
                            +   'submissionDate DATE,'
                            +   'UNIQUE(quizID,studentID),'
                            +   'FOREIGN KEY (quizID) REFERENCES quizzes(quizID),'
                            +   'FOREIGN KEY (studentID) REFERENCES students(studentID)'
                            + ');'
                            + 'CREATE TABLE languages ('
                            +   'lang TEXT PRIMARY KEY,'
                            +   'langName TEXT'
                            + ');'
                            + "INSERT INTO languages VALUES ('en','English');"
                            + "INSERT INTO languages VALUES ('zh','Chinese');"
                            + "INSERT INTO languages VALUES ('fr','French');"
                            + "INSERT INTO languages VALUES ('id','Indonesian');"
                            + "INSERT INTO languages VALUES ('it','Italian');"
                            + "INSERT INTO languages VALUES ('ja','Japanese');"
                            + "INSERT INTO languages VALUES ('kh','Khmer');"
                            + "INSERT INTO languages VALUES ('kr','Korean');"
                            + "INSERT INTO languages VALUES ('la','Laotian');"
                            + "INSERT INTO languages VALUES ('mn','Mongolian');"
                            + "INSERT INTO languages VALUES ('my','Myanmar');"
                            + "INSERT INTO languages VALUES ('pl','Polish');"
                            + "INSERT INTO languages VALUES ('ru','Russian');"
                            + "INSERT INTO languages VALUES ('th','Thai');"
                            + "INSERT INTO languages VALUES ('uz','Uzbek');"
                            + "INSERT INTO languages VALUES ('vn','Vietnamese');"
                            + "CREATE TABLE ruleTranslationEdits ("
                            +   "ruleTranslationEditID INTEGER PRIMARY KEY,"
                            +   "ruleTranslationID INTEGER NOT NULL,"
                            +   "studentID INTEGER,"
                            +   "editDate DATE,"
                            +   "FOREIGN KEY (ruleTranslationID) REFERENCES ruleTranslations(ruleTranslationID),"
                            +   "FOREIGN KEY (studentID) REFERENCES students(studentID)"
                            + ");"
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
