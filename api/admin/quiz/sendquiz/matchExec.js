(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var pathName = params.pathname;
        var forcemail = params.forcemail;
        var sys = this.sys;
        // var hostname 
        var hostname = this.sys.proxy_hostname;
        // var port
        var port = ':' + this.sys.real_port;
        var email_account = this.sys.email_account;
        var studentCount = 0;
        var mailData = {};

        // Hack for reverse proxy support
        var stub = '/';
        if (pathName && pathName !== '/') {
            port = '';
            stub = pathName.replace(/(.*\/).*/, '$1/quiz.html');
        } 
        var templateMail = sys.fs.readFileSync('quiz-message.txt').toString();
        var templatePastQuizzes = sys.fs.readFileSync('quiz-message-past-quizzes.txt').toString();
        var templateAnswered = sys.fs.readFileSync('quiz-message-answered.txt').toString();
        var templateUnanswered = sys.fs.readFileSync('quiz-message-unanswered.txt').toString();
        var templateLink = '  http://@@HOSTNAME@@@@PORT@@@@STUB@@?studentid=@@STUDENT_ID@@&studentkey=@@STUDENT_KEY@@&classid=@@CLASS_ID@@&quizno=@@QUIZ_NUMBER@@\n';
        // Okay.
        // Get the class name
        // Get a list of recipient students
        // update recipient keys
        // For each student, get a list of quizzes completed
        // For each student, get a list of quizzes not yet completed
        // Fire off the mailing
        beginTransaction();

        function beginTransaction(){
            sys.db.run('BEGIN TRANSACTION',function(err){
                if (err){return oops(response,err,'quiz/sendquiz(1)')}
                getClassName();
            });
        };

        function getClassName(){
            var sql = 'SELECT name FROM classes WHERE classID=?;';
            sys.db.get(sql,[classID],function(err,row){
                if (err||!row){return oops(response,err,'quiz/sendquiz(2)')}
                mailData.className = row.name;
                getStudents();
            });
        };

        function getStudents(){
            mailData.students = [];
            var sql = 'SELECT memberships.studentID,students.name,email,classes.name AS className '
                + 'FROM memberships '
                + 'JOIN students USING(studentID) '
                + 'JOIN classes ON classes.classID=memberships.classID '
                + 'JOIN quizzes ON quizzes.classID=memberships.classID '
                + 'WHERE memberships.classID=? AND quizzes.quizNumber=? '
                +   'AND ('
                +     'sent=0 '
                +     'OR ('
                +       'sent=1 AND ('
                +         'last_mail_date IS NULL '
                +         "OR JULIANDAY('now')-JULIANDAY(last_mail_date)>6"
                +       ') '
                +       'AND memberships.studentID NOT IN ('
                +         'SELECT studentID '
                +           'FROM quizzes '
                +           'NATURAL JOIN questions '
                +           'NATURAL JOIN answers '
                +           'WHERE quizzes.classID=? '
                +           'AND quizNumber=? '
                +           'GROUP BY studentID'
                +       ')'
                +     ')'
                +   ');';
            sys.db.all(sql,[classID,quizNumber,classID,quizNumber],function(err,rows){
                if (err||!rows){return oops(response,err,'quiz/sendquiz(3)')}
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    mailData.students.push(row);
                }
                updateStudentKeys(0,rows.length);
            });
        };
        
        function updateStudentKeys (pos,limit) {
            if (pos === limit) {
                getQuizLinks(0,limit);
                return;
            }
            var student = mailData.students[pos];
            var studentID = student.studentID;
            var studentKey = sys.getRandomKey(8,36);
            sys.db.run('UPDATE memberships SET studentKey=? WHERE classID=? AND studentID=?',[studentKey,classID,studentID],function(err){
                if (err) {return oops(response,err,'quiz/sendquiz(4)')};
                // Good, so this does that. Flag as sent, and send the mail message.
                sys.membershipKeys[classID][studentID] = studentKey;
                mailData.students[pos].studentKey = studentKey;
                updateStudentKeys(pos+1,limit);
            });
        };

        function getQuizLinks(pos,limit) {
            if (pos === limit) {
                response.writeHead(500, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(['success']));
                sendMail(0,limit);
                return;
            }
            // Get quizzes that have been answered by a given student
            // and quizzes that have not been.
            var sql = 'SELECT quizNumber,'
                + 'CASE WHEN COUNT(answers.answerID)>0 THEN 1 ELSE 0 END AS answered '
                + 'FROM students '
                + 'JOIN quizzes '
                + 'JOIN questions USING(quizID) '
                + 'LEFT JOIN answers ON answers.studentID=students.studentID AND answers.questionID=questions.questionID '
                + 'WHERE classID=? AND students.studentID=? AND NOT quizNumber=? AND sent=1 '
                + 'GROUP BY quizzes.quizID;'
            var studentID = mailData.students[pos].studentID;
            var studentID = mailData.students[pos].studentID;
            mailData.students[pos].answered = [];
            mailData.students[pos].unanswered = [];
            sys.db.all(sql,[classID,studentID,quizNumber],function(err,rows){
                if (err||!rows) {return oops(response,err,'quiz/sendquiz(5)')};
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    if (row.answered == 1) {
                        mailData.students[pos].answered.push(row.quizNumber);
                    } else {
                        mailData.students[pos].unanswered.push(row.quizNumber);
                    }
                }
                getQuizLinks(pos+1,limit);
            });
        };

        function sendMail (pos,limit) {
            if (pos === limit) {
                refreshDateStamps(0,limit);
                return;
            }
            var student = mailData.students[pos];
            var mailText = templateMail
                .replace(/@@NAME@@/,student.name)
                .replace(/@@STUDENT_ID@@/g,student.studentID)
                .replace(/@@STUDENT_KEY@@/g,student.studentKey)
                .replace(/@@QUIZ_NUMBER@@/g,quizNumber)
                .replace(/@@HOSTNAME@@/g,hostname)
                .replace(/@@PORT@@/g,port)
                .replace(/@@STUB@@/g,stub)
                .replace(/@@CLASS_ID@@/g,classID)
            if (student.answered.length || student.unanswered.length) {
                mailText = mailText.replace(/@@PAST_QUIZZES@@/g,templatePastQuizzes);
                var unansweredQuizText = '';
                if (student.unanswered.length) {
                    var unansweredQuizLinks = '';
                    for (var i=0,ilen=student.unanswered.length;i<ilen;i+=1) {
                        var oldQuizNumber = student.unanswered[i];
                        var link = templateLink
                            .replace(/@@NAME@@/,student.name)
                            .replace(/@@STUDENT_ID@@/g,student.studentID)
                            .replace(/@@STUDENT_KEY@@/g,student.studentKey)
                            .replace(/@@QUIZ_NUMBER@@/g,oldQuizNumber)
                            .replace(/@@HOSTNAME@@/g,hostname)
                            .replace(/@@PORT@@/g,port)
                            .replace(/@@STUB@@/g,stub)
                            .replace(/@@CLASS_ID@@/g,classID)
                        unansweredQuizLinks += link;
                    }
                    unansweredQuizText = templateUnanswered.replace(/@@UNANSWERED_QUIZZES@@/,unansweredQuizLinks);
                }
                mailText = mailText.replace(/@@UNANSWERED@@/,unansweredQuizText);

                var answeredQuizText = '';
                if (student.answered.length) {
                    var answeredQuizLinks = '';
                    for (var i=0,ilen=student.answered.length;i<ilen;i+=1) {
                        var oldQuizNumber = student.answered[i];
                        var link = templateLink
                            .replace(/@@NAME@@/,student.name)
                            .replace(/@@STUDENT_ID@@/g,student.studentID)
                            .replace(/@@STUDENT_KEY@@/g,student.studentKey)
                            .replace(/@@QUIZ_NUMBER@@/g,oldQuizNumber)
                            .replace(/@@HOSTNAME@@/g,hostname)
                            .replace(/@@PORT@@/g,port)
                            .replace(/@@STUB@@/g,stub)
                            .replace(/@@CLASS_ID@@/g,classID)
                        answeredQuizLinks += link;
                    }
                    answeredQuizText = templateAnswered.replace(/@@ANSWERED_QUIZZES@@/,answeredQuizLinks);
                }
                mailText = mailText.replace(/@@ANSWERED@@/,answeredQuizText);

            } else {
                mailText = mailText.replace(/@@PAST_QUIZZES@@/g,'');
            }
            sys.mailer.sendMail({
                text:    mailText, 
                from:    "Instructor <" + email_account + ">", 
                to:      student.email,
                subject: mailData.className + ': Quiz ' + quizNumber
            }, function(err, message) {
                if (err) {console.log(err)};
                sendMail(pos+1,limit);
            });
        };

        function refreshDateStamps (pos,limit) {
            if (pos === limit) {
                updateSentFlag();
                return;
            }
            var studentID = mailData.students[pos].studentID;
            sys.db.run('UPDATE memberships SET last_mail_date=DATE("now") WHERE classID=? AND studentID=?',[classID,studentID],function(err){
                if (err) {return oops(response,err,'quiz/sendquiz(6)')};
                refreshDateStamps(pos+1,limit);
            });
        }

        function updateSentFlag () {
            sys.db.run('UPDATE quizzes SET sent=1 WHERE classID=? AND quizNumber=?',[classID,quizNumber],function(err){
                if (err) {return oops(response,err,'quiz/sendquiz(7)')};
                //console.log("Updated SENT flag");
                endTransaction();
            });
        };

        function endTransaction () {
            sys.db.run('END TRANSACTION',function(err){
                if (err) {return oops(response,err,'quiz/sendquiz(8)')};
                console.log("Sent quiz mail");
            });
        };
    };
    exports.cogClass = cogClass;
})();

