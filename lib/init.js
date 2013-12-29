(function () {
    var initClass = function (config) {
        this.config = config;
        this.config.admin = {};
        this.config.membershipKeys = {};
        var fs = require('fs');
        var sqlite3 = require('sqlite3').verbose();
        var csv = require('csv');
        var events = require("events");
        var eventEmitter = new events.EventEmitter();
        var db;

        // Subdirs created if necessary
        var dirs = ['answer', 'question', 'barcodes'];
        for (var i=0,ilen=dirs.length;i<ilen;i+=1) {
            var dir = dirs[i];
            try {
                fs.mkdirSync(dir);
            } catch (e) {} 
        }

        function purgeStrings () {
            // String IDs are recorded in:
            //   questions
            //     * rubricID
            //     * qOneID
            //     * qTwoID
            //     * qThreeID
            //     * qFourID
            //   comments
            //     * commentTextID
            //
            // Records in the strings table and pointer IDs
            // are written asynchronously, so there is a
            // small risk that this purge function will clobber
            // a string record before its ID is recorded
            //
            // This should therefore be run only at startup, before
            // clients touch the database
            //
            var sql = "DELETE FROM strings"
                + " WHERE stringID NOT IN"
                + "   (SELECT DISTINCT rubricID AS stringID FROM questions"
                + "    UNION SELECT qOneID AS stringID FROM questions"
                + "    UNION SELECT qTwoID AS stringID FROM questions"
                + "    UNION SELECT qThreeID AS stringID FROM questions"
                + "    UNION SELECT qFourID AS stringID FROM questions"
                + "    UNION SELECT commentTextID AS stringID FROM comments);"
            db.run(sql,function(err){
                if (err) console.log("Error in purgeStrings(): "+err);
            })
        }

        function showUrl () {
            db.all('SELECT name,adminID FROM admin',[],function(err,rows){
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    if (row.name === 'admin') {
                        console.log("Admin URL: http://127.0.0.1:" + config.real_port + '/?admin=' + row.adminID);
                    }
                    config.admin[row.adminID] = row.name;
                    console.log("Loaded admin roles");
                }
            });
            db.all('SELECT classID,studentID,studentKey FROM memberships',[],function(err,rows){
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    var mk = config.membershipKeys;
                    if (!mk[row.classID]) {
                        mk[row.classID] = {};
                    }
                    if (!mk[row.classID][row.studentID]) {
                        mk[row.classID][row.studentID] = {};
                    }
                    mk[row.classID][row.studentID] = row.studentKey;
                }
                console.log("Loaded class membership keys\nDone. Ready to shake, rattle and roll!");
            });
        }

        // Initialize database if necessary
        try {
            var fh = fs.openSync('quizzer-' + config.real_port + '.sqlite', 'r')
            fs.close(fh);
            openDatabase(initAdmin);
        } catch (e) {
            if (e.code === 'ENOENT') {
                openDatabase(loadAdmin);
            } else {
                throw e;
            }
        }
        function openDatabase (callback) {
            var sqlite = require('sqlite3').verbose();
            db = new sqlite3.Database('quizzer-' + config.real_port + '.sqlite');
            // Clear out any cruft lying around in the strings table
            process.on('SIGINT', function() {
                console.log('\nGot SIGINT. So that\'s it, then.');
                try {
                    db.close();
                } catch (e) {
                    console.log("Database already closed, apparently");
                }
                process.exit();
            });
            
            // Roles
            // 0 = admin
            // 1 = instructor
            // 2 = commenter

           db.exec(
                "CREATE TABLE IF NOT EXISTS admin (name TEXT,adminID TEXT, role INTEGER, interval INTEGER);"
                   + "CREATE UNIQUE INDEX IF NOT EXISTS admin_idx ON admin(name);"
                   + "CREATE TABLE IF NOT EXISTS students (studentID INTEGER PRIMARY KEY,name TEXT,email TEXT,privacy INTEGER DEFAULT 0, lang TEXT DEFAULT 'en');"
                   + "CREATE TABLE IF NOT EXISTS showing (showID INTEGER PRIMARY KEY, adminID INTEGER, classID INTEGER, studentID INTEGER);"
                   + "CREATE TABLE IF NOT EXISTS classes (classID INTEGER PRIMARY KEY,name TEXT);"
                   + "CREATE TABLE IF NOT EXISTS quizzes (quizID INTEGER PRIMARY KEY, classID INTEGER, quizNumber INTEGER, sent BOOLEAN);"
                   + "CREATE UNIQUE INDEX IF NOT EXISTS quizzes_idx ON quizzes(classID,quizNumber);"
                   + "CREATE TABLE IF NOT EXISTS memberships (membershipID INTEGER PRIMARY KEY,classID INTEGER,studentID INTEGER, studentKey TEXT);"
                   + "CREATE TABLE IF NOT EXISTS strings (stringID INTEGER PRIMARY KEY, string TEXT);"
                   + "CREATE UNIQUE INDEX IF NOT EXISTS strings_idx ON strings(string);"
                   + "CREATE TABLE IF NOT EXISTS questions (questionID INTEGER PRIMARY KEY, classID INTEGER, quizNumber INTEGER, questionNumber INTEGER, correct INTEGER, rubricID INTEGER, qOneID INTEGER, qTwoID INTEGER, qThreeID INTEGER, qFourID INTEGER);"
                   + "CREATE UNIQUE INDEX IF NOT EXISTS questions_idx ON questions(classID,quizNumber,questionNumber);"
                   + "CREATE TABLE IF NOT EXISTS answers (answerID INTEGER PRIMARY KEY, classID INTEGER, quizNumber INTEGER, questionNumber INTEGER, studentID INTEGER, choice INTEGER);"
                   + "CREATE UNIQUE INDEX IF NOT EXISTS answers_idx ON answers(classID,quizNumber,questionNumber,studentID,choice);"
                   + "CREATE TABLE IF NOT EXISTS comments (commentID INTEGER PRIMARY KEY, classID INTEGER, quizNumber INTEGER, questionNumber INTEGER, choice INTEGER, commentTextID INTEGER,commenter TEXT);"
                   + "CREATE UNIQUE INDEX IF NOT EXISTS comments_idx ON comments(classID,quizNumber,questionNumber,choice,commenter);"
           );
            purgeStrings();
            process.on('exit', function() {
                try {
                    db.close();
                } catch (e) {}
                console.log('About to exit.');
            });
            if (callback) {
                callback();
            }
        }

        function getRandomKey(len, base) {
            // Modified from http://jsperf.com/random-md5-hash-implementations
            len = len ? len : 16;
            base = base ? base : 16;
            var _results;
            _results = [];
            for (var i=0;i<len;i+=1) {
                _results.push((Math.random() * base | 0).toString(base));
            }
            return _results.join("");
        }

        var remap = {students:{},classes:{}};
        function initAdmin () {
            db.run("INSERT OR IGNORE INTO admin VALUES (?,?,?,?)",['admin',getRandomKey(8,36), 1,0], function (err) {
                if (err) console.log("Error in initAdmin(): "+e);
                showUrl();
            });
        }
        function loadAdmin() {
            db.run("INSERT OR IGNORE INTO admin VALUES (?,?,?,?)",['admin',getRandomKey(8,36), 1,0], function (err) {
                if (err) console.log("Error in loadAdmin(): "+e);
                loadClasses();
            });
        }

        var rowCount = 0;

        function loadClasses() {
            // To instantiate course list
            csv()
                .from.stream(fs.createReadStream('./ids/classes.csv'))
                .on('record', function (row, index) {
                    if (row[1]) {
                        rowCount += 1;
                        // Class ID should be integer
                        db.run("INSERT INTO classes VALUES (NULL,?)",[row[0]],function() {
                            remap.classes[row[1]] = this.lastID;
                            rowCount += -1;
                            if (!rowCount) {
                                eventEmitter.emit('loadClassesDone');
                            }
                        });
                    }
                })
                .on('end', function(count) {
                    eventEmitter.on('loadClassesDone',loadStudents);
                })
                .on('error', function (e) {
                    throw e;
                });
        }

        function loadStudents() {
            // To instantiate student auth1entication data
            csv()
                .from.stream(fs.createReadStream('./ids/students.csv'))
                .on('record', function (row, index) {
                    if (row[1]) {
                        rowCount += 1;
                        db.run("INSERT INTO students VALUES (NULL,?,?,NULL,NULL)",[row[0],row[1]],function(err) {
                            if (err) console.log("Error in loadStudents(): "+err);
                            remap.students[row[2]] = {studentID:this.lastID,studentKey:row[3]};
                            rowCount += -1;
                            if (!rowCount) {
                                eventEmitter.emit('loadStudentsDone');
                            }
                        });
                    }
                })
                .on('end', function(count) {
                    console.log("Done loading student and class data");
                    eventEmitter.on('loadStudentsDone',loadMemberships);
                })
                .on('error', function (e) {
                    throw e;
                });
        };

        function loadMemberships() {
            // To instantiate course list
            csv()
                .from.stream(fs.createReadStream('./ids/memberships.csv'))
                .on('record', function (row, index) {
                    if (row[0] && remap.classes[row[0]] && remap.students[row[1]]) {
                        rowCount += 1;
                        db.run("INSERT INTO memberships VALUES (NULL,?,?,?)",
                               [remap.classes[row[0]], remap.students[row[1]].studentID, remap.students[row[1]].studentKey], function (err) {
                                   rowCount += -1;
                                   if (!rowCount) {
                                       eventEmitter.emit('loadMembershipsDone');
                                   }
                               });
                    }
                })
                .on('end', function(count) {
                    console.log("Done loading enrolment data");
                    eventEmitter.on('loadMembershipsDone',loadQuizClasses);
                })
                .on('error', function (e) {
                    throw e;
                });
        };

        var questionLoadCount = 0;
        function loadQuizClasses () {
            fs.readdir('./question/',function(err,files) {
                for (var i=0,ilen=files.length;i<ilen;i+=1) {
                    var classID = files[i];
                    loadQuizzes(classID);
                }
            });
        };

        function loadQuizzes (classID) {
            fs.readdir('./question/' + classID, function(err,files) {
                for (var i=0,ilen=files.length;i<ilen;i+=1) {
                    var quizNumber = files[i];
                    loadQuiz(classID, quizNumber);
                }
            });
        };

        function loadQuiz (classID, quizNumber) {
            db.run('INSERT OR REPLACE INTO quizzes VALUES (NULL,?,?,?)',[remap.classes[classID],quizNumber,false],function(err){
                if (err) console.log("OUCH(1)! "+err);
                loadQuestions(classID, quizNumber);                
            });
        };

        function loadQuestions (classID,quizNumber) {
            fs.readdir('./question/' + classID + '/' + quizNumber, function(err,files) {
                for (var i=0,ilen=files.length;i<ilen;i+=1) {
                    var questionNumber = files[i];
                    var question = fs.readFileSync('./question/' + classID + '/' + quizNumber + '/' + questionNumber);
                    dataIn = JSON.parse(question);
                    saveRubric(classID, quizNumber, questionNumber, dataIn);
                }
            });
        };
        
        function saveRubric (classID,quizNumber,questionNumber, dataIn) {
            // From here, we chain from inside the callback
            questionLoadCount += 1;
            db.run('INSERT OR REPLACE INTO strings VALUES (NULL,?)',[dataIn.rubric],function(err){
                if (err) console.log("OUCH(1)! "+err);
                db.get('SELECT stringID FROM strings WHERE string=?',[dataIn.rubric], function (err, row){
                    saveChoice(classID, quizNumber, questionNumber, 0, dataIn, [row.stringID]);
                });
            });
        };
        
        function saveChoice (classID,quizNumber,questionNumber,choiceNumber, dataIn, dataOut) {
            // Here, we watch choiceNumber, and call ourselves until we have all the choices
            var str = dataIn.questions[dataOut.length-1];
            db.run('INSERT OR REPLACE INTO strings VALUES (NULL,?)',[str],function(err){
                if (err) console.log("OUCH(2)! "+err);
                    db.get('SELECT stringID FROM strings WHERE string=?',[str], function (err, row){
                        dataOut.push(row.stringID);
                        if (dataOut.length === 5) {
                            saveCorrect(classID,quizNumber,questionNumber,dataIn,dataOut);
                        } else {
                            saveChoice(classID,quizNumber,questionNumber,choiceNumber,dataIn,dataOut);
                        }
                    });
            });
        };

        function saveCorrect (classID,quizNumber,questionNumber, dataIn, dataOut) {
            // From here, we chain to the final callback for the quiz question, and we're done with this one
            dataOut.push(dataIn.correct);
            saveQuestion(classID, quizNumber, questionNumber,dataOut);
        };

        function saveQuestion (classID,quizNumber,questionNumber,dataOut) {
            db.run('INSERT INTO questions VALUES (NULL,?,?,?,?,?,?,?,?,?)'
                   ,[remap.classes[classID], parseInt(quizNumber,10), parseInt(questionNumber,10), dataOut[5], dataOut[0], dataOut[1], dataOut[2], dataOut[3], dataOut[4]]
                   ,function(err){
                       if (err) console.log("Aw, shucks: "+err);
                       questionLoadCount += -1;
                       if (!questionLoadCount) {
                           console.log("Done loading questions");;
                           loadAnswerClasses();
                       }
                   })
        };

        function loadAnswerClasses () {
            fs.readdir('./answer/',function(err,files) {
                for (var i=0,ilen=files.length;i<ilen;i+=1) {
                    var classID = files[i];
                    loadAnswerQuizzes(classID);
                }
            });
        };

        function loadAnswerQuizzes (classID) {
            fs.readdir('./answer/' + classID, function(err,files) {
                for (var i=0,ilen=files.length;i<ilen;i+=1) {
                    var quizNumber = files[i];
                    loadAnswerStudents(classID, quizNumber);
                }
            });
        };

        function loadAnswerStudents (classID,quizNumber) {
            fs.readdir('./answer/' + classID + '/' + quizNumber, function(err,files) {
                for (var i=0,ilen=files.length;i<ilen;i+=1) {
                    var studentID = files[i];
                    var studentAnswers = fs.readFileSync('./answer/' + classID + '/' + quizNumber + '/' + studentID);
                    dataIn = JSON.parse(studentAnswers);
                    var dataLength = 0;
                    for (var questionNumber in dataIn) {
                        dataLength += 1;
                    }
                    for (var questionNumber in dataIn) {
                        saveAnswer(classID, quizNumber, questionNumber, studentID, dataIn[questionNumber]);
                    }
                }
            });
        };
        
        function saveAnswer (classID, quizNumber, questionNumber, studentID, choice) {
            questionLoadCount += 1;
            db.run('INSERT INTO answers VALUES (NULL,?,?,?,?,?)',[remap.classes[classID],quizNumber,questionNumber,remap.students[studentID].studentID,choice],function (err){
                if (err) console.log("Error loading answer: "+err);
                questionLoadCount += -1;
                if (!questionLoadCount){
                    console.log("Done loading answers too");
                    showUrl();
                }
            });
        }
        this.config.getRandomKey = getRandomKey;
        this.config.db = db;
    };
    initClass.prototype.getInit = function () {
        return this.config;
    };
    exports.initClass = initClass;
})();
