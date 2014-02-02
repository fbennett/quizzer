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

        // Hack for reverse proxy support
        var stub = '/';
        if (pathName && pathName !== '/') {
            port = '';
            stub = pathName.replace(/(.*\/).*/, '$1/quiz.html');
        } 
        var front_template = "@@NAME@@,\n\nWe have prepared a fresh quiz to help you check and improve your English writing ability.\n\n"
            + "Click on the link below to take the quiz:\n\n"
        var template_link = "    http://" + hostname + port + stub
            + "?studentid=@@STUDENT_ID@@&studentkey=@@STUDENT_KEY@@"
            + "&classid=" + classID 
            + "&quizno=@@QUIZ_NUMBER@@\n\n"
        var template_middle = "The links to your past quizzes for this class have changed. Here are the new links:\n\n"
            + "@@LINKS@@"
        var back = "Sincerely yours,\n"
            + "The Academic Writing team"

        // Okay.
        // Get list of recipients
        // update recipient keys
        // 
        var sql = 'SELECT memberships.studentID,students.name,email,classes.name AS className '
            + 'FROM memberships '
            + 'NATURAL JOIN students '
            + 'JOIN classes USING(classID) '
            + 'JOIN quizzes USING(classID) '
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
        // Get students for processing
        sys.db.all(sql,[classID,quizNumber,classID,quizNumber],function(err,rows){
            if (err||!rows) {return oops(response,err,'quiz/sendquiz(1)')};
            var datalst = [];
            studentCount += rows.length;
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                var studentID = row.studentID;
                var name = row.name;
                var email = row.email;
                var className = row.className;
                // This is a list of students to receive mail in this class.
                // Keys need to be updated for all keys of these students, in this class.
                updateStudentKey(classID,studentID,email,name,className);
            }
        });

        function updateStudentKey (classID,studentID,email,name,className) {
            var studentKey = sys.getRandomKey(8,36);
            sys.db.run('UPDATE memberships SET studentKey=? WHERE classID=? AND studentID=?',[studentKey,classID,studentID],function(err){
                if (err) {return oops(response,err,'quiz/sendquiz(2)')};
                // Good, so this does that. Flag as sent, and send the mail message.
                sys.membershipKeys[classID][studentID] = studentKey;
                sendMail(quizNumber,studentID,studentKey,name,email,className);
            });
        };

        function sendMail (quizNumber,studentID,studentKey,name,email,className) {
            var link = template_link
                .replace(/@@STUDENT_ID@@/g,studentID)
                .replace(/@@STUDENT_KEY@@/g,studentKey)
                .replace(/@@QUIZ_NUMBER@@/g,quizNumber);
            var front = front_template.replace(/@@NAME@@/,name)
            var pastLinks = 0;
            var sql = 'SELECT quizNumber '
                + 'FROM quizzes '
                + 'NATURAL JOIN questions '
                + 'WHERE classID=? AND NOT quizNumber=? AND sent=1 GROUP BY quizNumber'
            sys.db.all(sql,[classID,quizNumber],function(err,rows){
                if (err) {return oops(response,err,'quiz/sendquiz(3)')};
                var middle = '';
                var msg;
                if (!rows || !rows.length) {
                    // plain message
                    msg = front + link + back;
                } else {
                    // add note of past quiz links
                    var links = '';
                    var otherQuizNumber;
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        otherQuizNumber = row.quizNumber;
                        links += template_link
                            .replace(/@@STUDENT_ID@@/g,studentID)
                            .replace(/@@STUDENT_KEY@@/g,studentKey)
                            .replace(/@@QUIZ_NUMBER@@/g,otherQuizNumber);
                    }
                    var middle = template_middle
                        .replace(/@@LINKS@@/g,links);
                    msg = front + link + middle + back;
                }
                //console.log(msg);
                sys.mailer.send({
                    text:    msg, 
                    from:    "Instructor <" + email_account + ">", 
                    to:      email,
                     subject: className + ': Quiz ' + quizNumber
                }, function(err, message) { console.log(err || message); });

                refreshDateStamp(classID,studentID);
            });
        }

        function refreshDateStamp(classID,studentID) {
            sys.db.run('UPDATE memberships SET last_mail_date=DATE("now") WHERE classID=? AND studentID=?',[classID,studentID],function(err){
                if (err) {return oops(response,err,'quiz/sendquiz(4)')};
                studentCount += -1;
                if (!studentCount) {
                    updateSentFlag(classID,quizNumber);
                }
            });
        }

        function updateSentFlag (classID,quizNumber) {
            sys.db.run('UPDATE quizzes SET sent=1 WHERE classID=? AND quizNumber=?',[classID,quizNumber],function(err){
                if (err) {return oops(response,err,'quiz/sendquiz(5)')};
                //console.log("Updated SENT flag");
            });
        };


        //
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.end("Testing ...");
    };
    exports.cogClass = cogClass;
})();

