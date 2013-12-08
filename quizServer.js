fs = require('fs');
csv = require('csv');
http = require('http');
url = require('url');
emailjs = require('emailjs')
argparse = require('argparse')
quizPort = 3498;

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
var dirs = ['answer', 'ids', 'question'];

// Files to be created if necessary
var files = ['students', 'classes', 'membership']

// Pages
var pageAdminTop = fs.readFileSync('./pages/admin/top.html');
var pageStudents = fs.readFileSync('./pages/admin/students.html');
//var pageStudentEdit = fs.readFileSync('./pages/admin/studentedit.html');
var pageClasses = fs.readFileSync('./pages/admin/classes.html');
//var pageClassEdit = fs.readFileSync('./pages/admin/classedit.html');
//var pageMembership = fs.readFileSync('./pages/admin/membership.html');
//var pageQuizEdit = fs.readFileSync('./pages/admin/quizedit.html');
//var pageQuestionEdit = fs.readFileSync('./pages/admin/questionedit.html');
var pageQuiz = fs.readFileSync('./pages/user/quizpage.html');

//var pageQuizResult = fs.readFileSync('./pages/user/quizresult.html');

// Internal access maps
var admin = {};
var studentsById = {};
var studentsByEmail = {};
var classes = {};
var membership = {};

// make data dirs as required
for (var i=0,ilen=dirs.length;i<ilen;i+=1) {
    var dir = dirs[i];
    try {
        fs.mkdirSync(dir);
    } catch (e) {} 
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

// Initialise students.csv and classes.csv if necessary
try {
    fs.openSync('./ids/admin.csv', 'r')
} catch (e) {
    if (e.code === 'ENOENT') {
        var lst = ['Admin', getRandomKey()];
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
                    id: row[2] ? row[2] : getRandomKey(10, 10),
                    key: row[3] ? row[3] : getRandomKey(16, 16)
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
    // To instantiate course membership rosters
    csv()
        .from.stream(fs.createReadStream('./ids/classes.csv'))
        .on('record', function (row, index) {
            if (row[1]) {
                obj = {
                    name: row[0],
                    id: row[1] ? row[1] : getRandomKey(10, 10)
                };
                classes[obj.id] = obj;
            }
        })
        .on('end', function(count) {
            // Rewrite to disk, in case ids/keys have been added
            writeClasses(classes);
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
            console.log("Admin URL for "+row[0]+": http://localhost:" + quizPort + "/?admin="+row[1]);
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
                var quizKey = uriObj.parsedQuery.quiz;
                var studentID = uriObj.parsedQuery.id;
                var studentKey = uriObj.parsedQuery.key;
                var pageKey = uriObj.parsedQuery.page;
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
                    } else {
                        response.writeHead(500, {'Content-Type': 'text/plain'});
                        response.end("Sorry, can't help you. I don't know about that page.");
                        return;
                    }
                } else if (!cmd && quizKey && studentID && studentKey) {
                        response.writeHead(200, {'Content-Type': 'text/html'});
                        response.end(pageQuiz);
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
                                    payload.id = getRandomKey(10, 10);
                                }
                                if (!payload.key) {
                                    payload.key = getRandomKey(16, 16);
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
                        } else if (cmd === 'readstudents') {
                            var rows = readStudents(studentsById);
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify(rows));
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
                                    payload.id = getRandomKey(10, 10);
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
                console.log(err.message);
                if(typeof err == "string"){
                    response.writeHead(500, {'Content-Type': 'text/plain'});
                    response.end(err);
                    return;
                }
                else{
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

