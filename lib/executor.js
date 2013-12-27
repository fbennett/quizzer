// Do something like this:
//   http://stackoverflow.com/questions/6366029/how-should-i-pass-options-to-a-node-module
// That is, cast the module as a class with methods, and after loading,
// instantiate it with whatever externally-supplied parameters it's going
// to need at runtime.

var cogs = require('./cogs.js').cogs;

// loop removed to api.js

// Okay, so to clean this up, calls should be one of:
//
//  - page + validAdmin()
//  - cmd + validAdmin()
//  - quiz + validStudent()
//  - cmd + validStudent()
//
// Each should be validated, and all invalid commands
// should throw an error page back at the client. The
// client should always render the page.


        } else if (pageKey === 'quiz') {
            myPage = pageQuizAdmin.toString().replace(/@@CLASS@@/g, classes[classID].name);
            myPage = myPage.replace(/@@QUIZ_NUMBER@@/g, "Quiz " + quizNumber);
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.end(myPage);
        } else if (pageKey === 'quizstats') {
            myPage = pageQuizStats.toString().replace(/@@CLASS@@/g, classes[classID].name);
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
    } else if (cmd === 'writequizresult' && quizNumber && studentID && studentKey && classID) {
        var payload = JSON.parse(this.POSTDATA);
        writeQuizResult(response, classID, studentID, studentKey, quizNumber, payload.quizres, uriObj.pathname);
        return;
    } else if (cmd === 'showmyquiz' && quizNumber && studentID && studentKey && classID) {
        showQuizResultPage(response, classID, studentID, studentKey, quizNumber);
        return;
    } else if (cmd === 'myquizresult' && quizNumber && studentID && studentKey && classID) {
        getQuizResult(response, classID, studentID, studentKey, quizNumber);
        return;
    } else {

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

            } else if (cmd === 'removemembers') {
                // XXX fixme
                var payload = JSON.parse(this.POSTDATA);
                var rowsets = removeMemberships(memberships, payload.classID, payload.removemembers);
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(rowsets));

            } else if (cmd === 'readquestions') {
                // XXX Should always keep at least one unassigned quiz open.
                // XXX Returns a list of all quizes for a course.
                var payload = JSON.parse(this.POSTDATA);
                // Runs async, returns direct to API
                readQuestions(response, payload.classid, payload.quizno);
                return;

            } else if (cmd === 'readonestudent') {
                var payload = JSON.parse(this.POSTDATA);
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(studentsById[payload.id]));
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

exports.executor = executor;
