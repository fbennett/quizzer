fs = require('fs');
csv = require('csv');
http = require('http');
url = require('url');
emailjs = require('emailjs')
argparse = require('argparse')
markdown = require('marked')
var Barc= require ('barc')


quizPort = 3498;
var hostname = require('os').hostname();

var ArgumentParser = argparse.ArgumentParser;
var optparse = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'Quizzer quiz server'
});
optparse.addArgument(
  [ '-a', '--email-account' ],
  {
    help: 'Full username of email account (e.g. useme@gmail.com)'
  }
);
optparse.addArgument(
  [ '-s', '--smtp-host' ],
  {
    help: 'SMTP host name (default: smtp.gmail.com)'
  }
);
var args = optparse.parseArgs();

if (!args.smtp_host) {
    args.smtp_host = "smtp.gmail.com";
}

if (!args.email_account) {
    optparse.printHelp();
    console.log("ERROR: must provide an email account");
    return;
}

// Get mail password file
try {
    var email_password = fs.readFileSync('./mypwd.txt')
    if (!email_password) {
        console.log("ERROR: empty email password in mypwd.txt");
        return;
    }
} catch (e) {
    console.log("ERROR: file mypwd.txt not found");
    return;
}
// Set up the mail server
var mailserver  = emailjs.server.connect({
   user:    args.email_account, 
   password:email_password,
   host:    args.smtp_host, 
   ssl:     true
});

//mailserver.send({
//   text:    "Let's hope it works, really.", 
//   from:    "Our Mail Account <biercenator@gmail.com>", 
//   to:      "Their Mail Account <bennett@law.nagoya-u.ac.jp>",
//   cc:      "Other Mail Account <bennett@nagoya-u.jp>",
//   subject: "Test mail message wowie zowie!"
//}, function(err, message) { console.log(err || message); });


// Subdirs to be created if necessary
var dirs = ['answer', 'ids', 'question', 'barcodes'];

// Files to be created if necessary
var files = ['students', 'classes', 'memberships']

// Pages
var pageAdminTop = fs.readFileSync('./pages/admin/top.html');
var pageStudents = fs.readFileSync('./pages/admin/students.html');
var pageClasses = fs.readFileSync('./pages/admin/classes.html');
var pageClass = fs.readFileSync('./pages/admin/class.html');
var pageQuizAdmin = fs.readFileSync('./pages/admin/quiz.html');
//var pageQuizEdit = fs.readFileSync('./pages/admin/quizedit.html');
//var pageQuestionEdit = fs.readFileSync('./pages/admin/questionedit.html');
var pageQuiz = fs.readFileSync('./pages/user/quiz.html');

//var pageQuizResult = fs.readFileSync('./pages/user/quizresult.html');

// Internal access maps
var admin = {};
var studentsById = {};
var studentsByEmail = {};
var classes = {};
var memberships = {};

// make data dirs as required
for (var i=0,ilen=dirs.length;i<ilen;i+=1) {
    var dir = dirs[i];
    try {
        fs.mkdirSync(dir);
    } catch (e) {} 
}

// Create a barcode
function makeBarcode(title, text, barc, angle){
        var buf = barc.code128(text, 300, 30, angle);
        var filename = 'code128-' + title + '.png';
        fs.writeFile('./barcodes/' + filename, buf, function(){
                console.log('Created code128 and saved it as ', filename);
        })
}

// To get a random key or random student ID, when needed in initializing data files
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

function sendQuiz (response, classID, quizNumber) {
    // Get email addresses
    var className = classes[classID].name;
    for (var studentID in memberships[classID]) {
        var email = studentsById[studentID].email;
        var studentKey = studentsById[studentID].key;
        // Send mail messages
        var text = "We have prepared a quiz to help you check and improve your English writing ability.\n\nClick on the link below to take the quiz:\n\n"
            + "    http://" + hostname + ":3498/?id=" + studentID + "&key=" + studentKey + "&classid=" + classID + "&quizno=" + quizNumber + "&hostname=" + hostname + "\n\n"
            + "Sincerely yours,\n"
            + "The Academic Writing team"
        mailserver.send({
            text:    text, 
            from:    "Your instructors <biercenator@gmail.com>", 
            to:      email,
            subject: className + ": Quiz " + quizNumber
        }, function(err, message) { console.log(err || message); });

    }
    fs.mkdir('./answer/' + classID + "/" + quizNumber, 0700, function(err) {
        // Return to client
        if (err) {
            console.log("Error creating dir: answer/" + classID + '/' + quizNumber);
            response.writeHead(500, {'Content-Type': 'text/plain'});
            response.end("Error creating dir: answer/" + classID + '/' + quizNumber);
        } else {
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.end("");
        }
    });
}

function quizPage (response, classID, studentID, studentKey, quizNumber) {
    // Validate a little
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(pageQuiz);
}

function quizData (response, classID, studentID, studentKey, quizNumber) {
    // Validate a little
    var quizData = {classID:classID,studentID:studentID,studentKey:studentKey,quizNumber:quizNumber};
    quizData.questions = [];
    var path = './question/' + classID + '/' + quizNumber
    fs.readdir(path, function (err, questions) {
        if (err) {
            console.log("ERROR: no data found for: " + path);
            response.writeHead(500, {'Content-Type': 'text/plain'});
            response.end("No questions found for this URL");
        } else {
            questions.sort(function (a,b) {
                a = parseInt(a, 10);
                b = parseInt(b, 10);
                if (a>b) {
                    return 1;
                } else if (a < b) {
                    return -1;
                } else {
                    return 0;
                }
            });
            for (var i=0,ilen=questions.length;i<ilen;i+=1) {
                var obj = fs.readFileSync('./question/' + classID + '/' + quizNumber + '/' + questions[i]);
                obj = JSON.parse(obj);
                //delete obj.correct;
                quizData.questions.push(obj);
            }
            var quizObject = JSON.stringify(quizData);
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(quizObject);
        }
    });
}

function writeStudents(studentsById) {
    var cfh = csv().to.path('./ids/students.csv');
    var rows = [];
    for (var key in studentsById) {
        var obj = studentsById[key];
        var row = [obj.name, obj.email, obj.id, obj.key];
        cfh.write(row);
        rows.push(row);
    }
    cfh.end();
    return rows;
}

function readStudents(studentsById) {
    var rows = [];
    for (var key in studentsById) {
        var obj = studentsById[key];
        var row = [obj.name, obj.email, obj.id, obj.key];
        rows.push(row);
    }
    return rows;
}

function writeClasses(classes) {
    var cfh = csv().to.path('./ids/classes.csv');
    var rows = [];
    for (var key in classes) {
        var obj = classes[key];
        var row = [obj.name, obj.id];
        cfh.write(row);
        rows.push(row);
    }
    cfh.end();
    return rows;
}

function readClasses(classes) {
    var rows = [];
    for (var key in classes) {
        var obj = classes[key];
        var row = [obj.name, obj.id];
        rows.push(row);
    }
    return rows;
}

// XXX fixme
function writeMemberships(memberships) {
    var cfh = csv().to.path('./ids/memberships.csv');
    var rows = [];
    for (var classID in memberships) {
        for (var studentID in memberships[classID]) {
            var row = [classID, studentID];
            cfh.write(row);
        }
    }
    cfh.end();
    return rows;
}

// XXX fixme
function readMemberships(memberships, classID) {
    var rowsets = [[],[]];
    for (var key in studentsById) {
        if (memberships[classID] && memberships[classID][key]) {
            rowsets[0].push(studentsById[key]);
        } else {
            rowsets[1].push(studentsById[key]);
        }
    }
    return rowsets;
}

function addMemberships(memberships, classID, addmembers) {
    for (var i=0,ilen=addmembers.length;i<ilen;i+=1) {
        var member = studentsById[addmembers[i]];
        if (member) {
            if (!memberships[classID]) {
                memberships[classID] = {};
            }
            memberships[classID][member.id] = member;
        }
    }
    writeMemberships(memberships);
    return readMemberships(memberships, classID);
}

function removeMemberships(memberships, classID, removemembers) {
    for (var i=0,ilen=removemembers.length;i<ilen;i+=1) {
        if (memberships[classID] && memberships[classID][removemembers[i]]) {
            delete memberships[classID][removemembers[i]];
        }
    }
    writeMemberships(memberships);
    return readMemberships(memberships, classID);
}

function readQuizzes(response, classID) {
    // This is driven by directory content under "question" and "answer".
    // Class is created for both if necessary.
    try {
        fs.readdirSync('./question/' + classID);
    } catch (e) {
        fs.mkdirSync('./question/' + classID);
    }
    try {
        fs.readdirSync('./answer/' + classID);
    } catch (e) {
        fs.mkdirSync('./answer/' + classID);
    }
    // Quizzes are numbered in sequence from 1 in principle,
    // but holes are permitted.
    // At least one quiz dir under question must not have 
    // a corresponding quiz dir under answer.
    // If needed, the highest-numbered quiz under question
    // is incremented by 1 and a new quiz dir is created.
    fs.readdir('./question/' + classID, function (err, questions) {
        fs.readdir('./answer/' + classID, function (err, answers) {
            var rows = [];
            var max = 0;
            var hasNew = false;
            for (var i=0,ilen=questions.length;i<ilen;i+=1) {
                if (!questions[i].match(/[0-9]+/)) {
                    continue;
                } else if (parseInt(questions[i],10) > max) {
                    max = parseInt(questions[i],10);
                }
                if (answers.indexOf(questions[i]) === -1) {
                    rows.push({number:questions[i],isnew:true});
                    hasNew = true;
                } else {
                    rows.push({number:questions[i],isnew:false});
                }
            }
            if (!hasNew) {
                fs.mkdir('./question/' + classID + "/" + (max + 1));
                rows.push({number: (max + 1), isnew: true});
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    });
}


function readQuestions(response, classID, quizNumber) {
    fs.readdir('./question/' + classID + '/' + quizNumber, function (err, questions) {
        var quizobj = {};
        for (var i=0,ilen=questions.length;i<ilen;i+=1) {
            quizobj[questions[i]] = JSON.parse(fs.readFileSync('./question/' + classID + '/' + quizNumber + '/' + questions[i]));
        }
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(quizobj));
    });
}


function readQuestion(response, classID, quizNumber, questionNumber) {
    fs.readFile('./question/' + classID + '/' + quizNumber + '/' + questionNumber, function (err, data) {
        var quizobj = data;
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(quizobj);
    });
}


function writeQuestion(response, classID, quizNumber, questionNumber, data) {
    fs.readdir('./question/' + classID + '/' + quizNumber, function (err, questions) {
        // Sort question filenames numerically
        if (questions.length === 0) {
            questionNumber = 1;
        } else if (questionNumber == 0) {
            questionNumber = Math.max.apply(Math, questions);
            questionNumber = (questionNumber + 1);
        }
        fs.writeFileSync('./question/' + classID + '/' + quizNumber + '/' + questionNumber, JSON.stringify(data, null, 4));
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(questionNumber));
    });
}

// This works. Needs studentID for field test printouts.
//        for (var i=0,ilen=data.questions.length;i<ilen;i+=1) {
//            var code = classID + quizNumber + i + questionNumber
//            makeBarcode(code, code, new Barc({hri:false}));
//        }


function writeChoice(response, classID, quizNumber, questionNumber, choice) {
    fs.readFile('./question/' + classID + '/' + quizNumber + '/' + questionNumber, function (err, quizobj) {
        quizobj = JSON.parse(quizobj);
        quizobj.correct = choice;
        fs.writeFile('./question/' + classID + '/' + quizNumber + '/' + questionNumber, JSON.stringify(quizobj), function (err){});
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end("");
    });
}



// Initialise students.csv and classes.csv if necessary
try {
    fs.openSync('./ids/admin.csv', 'r')
} catch (e) {
    if (e.code === 'ENOENT') {
        var lst = ['Admin', getRandomKey(8, 36)];
        csv().to('./ids/admin.csv').write(lst);
    } else {
        throw e;
    }
}
for (var i=0,ilen=files.length;i<ilen;i+=1) {
    try {
        var fh = fs.openSync('./ids/' + files[i] + '.csv', 'r');
        fs.close(fh);
    } catch (e) {
        if (e.code === 'ENOENT') {
            csv().to('./ids/' + files[i] + '.csv').write([]);
        } else {
            throw e;
        }
    }
}


function loadStudents() {
    // To instantiate student auth1entication data
    csv()
        .from.stream(fs.createReadStream('./ids/students.csv'))
        .on('record', function (row, index) {
            if (row[1]) {
                obj = {
                    name: row[0],
                    email: row[1],
                    id: row[2] ? row[2] : getRandomKey(8, 36),
                    key: row[3] ? row[3] : getRandomKey(8, 36)
                };
                studentsById[obj.id] = obj;
                studentsByEmail[obj.email] = obj;
            }
        })
        .on('end', function(count) {
            // Rewrite to disk, in case ids/keys have been added
            writeStudents(studentsById);
            loadClasses();
        })
        .on('error', function (e) {
            throw e;
        });
}

function loadClasses() {
    // To instantiate course list
    csv()
        .from.stream(fs.createReadStream('./ids/classes.csv'))
        .on('record', function (row, index) {
            if (row[1]) {
                obj = {
                    name: row[0],
                    id: row[1] ? row[1] : getRandomKey(8, 36)
                };
                classes[obj.id] = obj;
            }
        })
        .on('end', function(count) {
            // Rewrite to disk, in case ids/keys have been added
            writeClasses(classes);
            loadMemberships();
        })
        .on('error', function (e) {
            throw e;
        });
}

function loadMemberships() {
    // To instantiate course list
    csv()
        .from.stream(fs.createReadStream('./ids/memberships.csv'))
        .on('record', function (row, index) {
            if (row[0]) {
                if (!memberships[row[0]]) {
                    memberships[row[0]] = {};
                }
                memberships[row[0]][row[1]] = true;
            }
        })
        .on('end', function(count) {
            runServer();
        })
        .on('error', function (e) {
            throw e;
        });
}

function loadAdmin() {
    csv()
        .from.stream(fs.createReadStream('./ids/admin.csv'))
        .on ('record', function (row,index) {
            admin[row[1]] = row[0];
            console.log("Admin URL for "+row[0]+": http://" + hostname + ":" + quizPort + "/?admin="+row[1]);
        })
        .on('end', function(count){
            loadStudents();
        })
        .on('error', function (e) {
            throw e;
        });
}

function runServer() {
    http.createServer(function (request, response) {

        // Stuff that will be needed

        // To call a requested admin page (default is top)
        // To perform the various admin operations after key validation
        // To call the quiz page on a student and course
        // To save the final data from a quiz after key validation

        if(request.method == "OPTIONS"){
            var nowdate = new Date();
            response.writeHead(200, {
                'Date': nowdate.toUTCString(),
                'Allow': 'GET,POST,OPTIONS',
                'Content-Length': 0,
                'Content-Type': 'text/plain',
            });
            response.end('');
            return;
        }
        request.on('data', function(data){
            if(typeof this.POSTDATA === "undefined"){
                this.POSTDATA = data;
            }
            else{
                this.POSTDATA += data;
            }
        });
        request.on('end', function(){
            try {
                //parse url from request object
                var uriObj = url.parse(this.url);
                uriObj.parsedQuery = require('querystring').parse(uriObj.query);
                var adminKey = uriObj.parsedQuery.admin;
                var studentID = uriObj.parsedQuery.id;
                var studentKey = uriObj.parsedQuery.key;
                var classID = uriObj.parsedQuery.classid;
                var pageKey = uriObj.parsedQuery.page;
                var quizNumber = uriObj.parsedQuery.quizno;
                var cmd = uriObj.parsedQuery.cmd;
                if (!cmd && adminKey && admin[adminKey]) {
                    if (!pageKey || pageKey === 'top') {
                        response.writeHead(200, {'Content-Type': 'text/html'});
                        response.end(pageAdminTop);
                    } else if (!pageKey || pageKey === 'students') {
                        response.writeHead(200, {'Content-Type': 'text/html'});
                        response.end(pageStudents);
                    } else if (!pageKey || pageKey === 'classes') {
                        response.writeHead(200, {'Content-Type': 'text/html'});
                        response.end(pageClasses);
                    } else if (!pageKey || pageKey === 'class') {
                        myPage = pageClass.toString().replace(/@@CLASS@@/g, classes[classID].name);
                        response.writeHead(200, {'Content-Type': 'text/html'});
                        response.end(myPage);
                    } else if (!pageKey || pageKey === 'quiz') {
                        myPage = pageQuizAdmin.toString().replace(/@@CLASS@@/g, classes[classID].name);
                        myPage = myPage.replace(/@@QUIZ_NUMBER@@/g, "Quiz " + quizNumber);
                        response.writeHead(200, {'Content-Type': 'text/html'});
                        response.end(myPage);
                    } else {
                        response.writeHead(500, {'Content-Type': 'text/plain'});
                        response.end("Sorry, can't help you. I don't know about that page.");
                        return;
                    }
                } else if (!cmd && quizNumber && studentID && studentKey && classID) {
                    quizPage(response, classID,studentID,studentKey,quizNumber);
                    return;
                } else if (cmd === 'quizdata' && quizNumber && studentID && studentKey && classID) {
                    quizData(response, classID, studentID, studentKey, quizNumber);
                    return;
                } else {
                    // All API calls and page dependencies will be handled here when we get to it
                    if ('.xml' === uriObj.href.slice(-4)) {
                        // This needs to be a bit smarter, obviously. Admin pages first, then
                        // fix this up to chase out the correct data file.
                        var myxml = fs.readFileSync(uriObj.href.slice(1)); 
                        response.writeHead(200, {'Content-Type': 'text/xml'});
                        response.end(myxml);
                        return;
                    } else if ('.js' === uriObj.href.slice(-3)) {
                        var myxml = fs.readFileSync(uriObj.href.slice(1));
                        response.writeHead(200, {'Content-Type': 'text/javascript'});
                        response.end(myxml);
                        return;
                    } else if ('.css' === uriObj.href.slice(-4)) {
                        var myxml = fs.readFileSync(uriObj.href.slice(1));
                        response.writeHead(200, {'Content-Type': 'text/css'});
                        response.end(myxml);
                        return;
                    } else if (cmd) {
                        if (cmd === 'addstudent') {
                            var payload = JSON.parse(this.POSTDATA);
                            // NOTE: Req of name and email are handled in pages
                            if (payload.id && studentsById[payload.id]) {
                                // If id matches a record, update email and name
                                studentsById[payload.id].name = payload.name;
                                studentsById[payload.id].email = payload.email;
                            } else if (studentsByEmail[payload.email]) {
                                // If email matches a record, update name only
                                studentsByEmail[payload.email].name = payload.name;
                            } else {
                                // New record, add it
                                if (!payload.id) {
                                    payload.id = getRandomKey(8, 36);
                                }
                                if (!payload.key) {
                                    payload.key = getRandomKey(8, 36);
                                }
                                studentsById[payload.id] = payload;
                                studentsByEmail[payload.email] = payload;
                            }
                            // Recast as lst
                            var rows = writeStudents(studentsById);
                            // Send the object back to the client page as JSON
                            // so the display list can be rebuilt
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify(rows));
                            return;
                        } else if (cmd === 'readmembers') {
                            // XXX fixme
                            var payload = JSON.parse(this.POSTDATA);
                            var rowsets = readMemberships(memberships, payload.classID);
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify(rowsets));
                            return;
                        } else if (cmd === 'writtenquiz') {
                            // XXX fixme
                            var payload = JSON.parse(this.POSTDATA);
                            var selectedMembers = payload.selectedmembers;
                            // XXX Return essentials only, page will generate the text of individual quizzes.
                            // 
                            return;
                        } else if (cmd === 'sendquiz') {
                            var payload = JSON.parse(this.POSTDATA);
                            sendQuiz(response, payload.classid,payload.quizno);
                            return;
                        } else if (cmd === 'addmembers') {
                            // XXX fixme
                            var payload = JSON.parse(this.POSTDATA);
                            var rowsets = addMemberships(memberships, payload.classID, payload.addmembers);
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify(rowsets));
                            return;
                        } else if (cmd === 'removemembers') {
                            // XXX fixme
                            var payload = JSON.parse(this.POSTDATA);
                            var rowsets = removeMemberships(memberships, payload.classID, payload.removemembers);
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify(rowsets));
                        } else if (cmd === 'readstudents') {
                            var rows = readStudents(studentsById);
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify(rows));
                            return;
                        } else if (cmd === 'readquizzes') {
                            // XXX Should always keep at least one unassigned quiz open.
                            // XXX Returns a list of all quizes for a course.
                            var payload = JSON.parse(this.POSTDATA);
                            // Runs async, returns direct to API
                            readQuizzes(response, payload.classid);
                            return;
                        } else if (cmd === 'readquestions') {
                            // XXX Should always keep at least one unassigned quiz open.
                            // XXX Returns a list of all quizes for a course.
                            var payload = JSON.parse(this.POSTDATA);
                            // Runs async, returns direct to API
                            readQuestions(response, payload.classid, payload.quizno);
                            return;
                        } else if (cmd === 'readonequestion') {
                            var payload = JSON.parse(this.POSTDATA);
                            // Runs async, returns direct to API
                            // XXX NEED THIS FUNCTION
                            readQuestion(response, payload.classid, payload.quizno, payload.questionno);
                        } else if (cmd === 'writeonequestion') {
                            var payload = JSON.parse(this.POSTDATA);
                            // Runs async, returns direct to API
                            writeQuestion(response, payload.classid, payload.quizno, payload.questionno, payload.data);
                        } else if (cmd === 'writeonechoice') {
                            var payload = JSON.parse(this.POSTDATA);
                            // Runs async, return ignored
                            writeChoice(response, payload.classid, payload.quizno, payload.questionno, payload.choice);
                        } else if (cmd === 'readonestudent') {
                            var payload = JSON.parse(this.POSTDATA);
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify(studentsById[payload.id]));
                            return;
                        } else if (cmd === 'addclass') {
                            var payload = JSON.parse(this.POSTDATA);
                            // NOTE: Req of name and email are handled in pages
                            if (payload.id && classes[payload.id]) {
                                // If id matches a record, update name
                                classes[payload.id].name = payload.name;
                            } else {
                                // New record, add it
                                if (!payload.id) {
                                    payload.id = getRandomKey(8, 36);
                                }
                                classes[payload.id] = payload;
                            }
                            // Recast as lst
                            var rows = writeClasses(classes);
                            // Send the object back to the client page as JSON
                            // so the display list can be rebuilt
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify(rows));
                            return;
                        } else if (cmd === 'readclasses') {
                            var rows = readClasses(classes);
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify(rows));
                        } else if (cmd === 'readoneclass') {
                            var payload = JSON.parse(this.POSTDATA);
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify(classes[payload.id]));
                            return;
                        } else {
                            response.writeHead(500, {'Content-Type': 'text/plain'});
                            response.end("An error occurred");
                            return;
                        }
                    } else {
                        response.writeHead(500, {'Content-Type': 'text/plain'});
                        response.end("An error occurred");
                        return;
                    }
                }
            } catch (e) {
                console.log("ERROR: "+e);
                if(typeof e == "string"){
                    response.writeHead(500, {'Content-Type': 'text/plain'});
                    response.end(e);
                    return;
                }
                else{
                    //console.log("OOPS: cmd="+cmd+", classID="+classID+", studentID="+studentID,', studentKey='+studentKey+", quizNumber="+quizNumber)
                    response.writeHead(500, {'Content-Type': 'text/plain'});
                    response.end("An error occurred");
                    return;
                }
            }
        });
    }).listen(quizPort);
    console.log("Listening on port "+quizPort);
}

// Setup
loadAdmin();

