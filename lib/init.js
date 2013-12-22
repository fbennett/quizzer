(function () {
    var initClass = function () {
        var fs = require('fs');
        var sqlite3 = require('sqlite3').verbose();
        var csv = require('csv');
        var events = require("events");

        // Subdirs created if necessary
        var dirs = ['answer', 'question', 'barcodes'];
        for (var i=0,ilen=dirs.length;i<ilen;i+=1) {
            var dir = dirs[i];
            try {
                fs.mkdirSync(dir);
            } catch (e) {} 
        }

        // Create and initialize database if necessary
        try {
            var fh = fs.openSync('quizzer.sqlite', 'r')
            fs.close(fh);
            openDatabase();
        } catch (e) {
            if (e.code === 'ENOENT') {
                openDatabase();
                loadAdmin();
            } else {
                throw e;
            }
        }
        var db;
        function openDatabase () {
            var sqlite = require('sqlite3').verbose();
            db = new sqlite3.Database('quizzer.sqlite');
            db.serialize(function () {
                db.run("CREATE TABLE IF NOT EXISTS admin (name TEXT,adminID TEXT, role INTEGER)");
                db.run("CREATE TABLE IF NOT EXISTS students (studentID INTEGER PRIMARY KEY,name TEXT,email TEXT)");
                db.run("CREATE TABLE IF NOT EXISTS classes (classID INTEGER PRIMARY KEY,name TEXT)");
                db.run("CREATE TABLE IF NOT EXISTS memberships (classID INTEGER PRIMARY KEY,studentID INTEGER, studentKey TEXT)");
                db.run("CREATE TABLE IF NOT EXISTS strings (stringID INTEGER PRIMARY KEY, string TEXT)");
                db.run("CREATE UNIQUE INDEX IF NOT EXISTS strings_idx ON strings(string)");
                db.run("CREATE TABLE IF NOT EXISTS questions (quizID INTEGER PRIMARY KEY, classID INTEGER, quizNumber INTEGER, questionNumber INTEGER, correct INTEGER, rubricID INTEGER, qOneID INTEGER, qTwoID INTEGER, qThreeID INTEGER, qFourID INTEGER)");
                db.run("CREATE TABLE IF NOT EXISTS answers (answerID INTEGER PRIMARY KEY, classID INTEGER, quizNumber INTEGER, questionNumber INTEGER, studentID INTEGER, choice INTEGER)");
            });
            process.on('exit', function() {
                console.log('About to exit.');
                db.close();
            });
        }

        var eventEmitter = new events.EventEmitter();

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
        function loadAdmin() {
            var fh = fs.openSync('./ids/admin.csv', 'r')
            fs.close(fh);
            csv()
                .from.stream(fs.createReadStream('./ids/admin.csv'))
                .on ('record', function (row,index) {
                    // Admin is okay as a string key
                    // Generate random here
                    // Set multiple admins. Only quizadmin is superuser,
                    // able to inspect outsider records. Ordinary admins
                    // are able to set and see only records for enrolled students.
                    // We'll set a pale red background on admin pages when
                    // logged in as quizadmin, and add-to-class operations
                    // will set the private toggle.
                    // Superuser quizadmin will also have sole access to the
                    // Purge button, for deleting student records, and to
                    // the Remove button for deleting classes and associated
                    // quizzes.
                    db.serialize(function () {
                        var stmt = db.prepare("INSERT INTO admin VALUES (?,?,?)");
                        stmt.run('admin',getRandomKey(8,36), 1);
                        stmt.finalize();
                    });
                })
                .on('end', function(count){
                    loadClasses();
                })
                .on('error', function (e) {
                    throw e;
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
                        db.serialize(function () {
                            db.run("INSERT INTO classes VALUES (NULL,?)",[row[0]],function() {
                                remap.classes[row[1]] = this.lastID;
                                rowCount += -1;
                                if (!rowCount) {
                                    eventEmitter.emit('loadClassesDone');
                                }
                            });
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
                        db.serialize(function () {
                            db.run("INSERT INTO students VALUES (NULL,?,?)",[row[0],row[1]],function() {
                                remap.students[row[2]] = {studentID:this.lastID,studentKey:row[3]};
                                rowCount += -1;
                                if (!rowCount) {
                                    eventEmitter.emit('loadStudentsDone');
                                }
                            });
                        });
                    }
                })
                .on('end', function(count) {
                    eventEmitter.on('loadStudentsDone',loadMemberships);
                    eventEmitter.on('loadStudentsDone',loadQuizClasses);
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
                    if (row[0]) {
                        db.serialize(function () {
                            if (remap.classes[row[0]] && remap.students[row[1]]) {
                                db.run("INSERT INTO memberships VALUES (?,?,?)",
                                       [remap.classes[row[0]], remap.students[row[1]].studentID, remap.students[row[1]].studentKey]);
                            }
                        });
                    }
                })
                .on('end', function(count) {
                    console.log("Done loading student and class data");
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
                    loadQuestions(classID, quizNumber);
                }
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
                           console.log("All done loading questions");;
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
                }
            });
        }
        this.getRandomKey = getRandomKey;
    };
    initClass.prototype.getInit = function () {
        return {getRandomKey:this.getRandomKey};
    };
    exports.initClass = initClass;
})();
