(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var pathName = params.pathname;
        var sys = this.sys;
        // var hostname 
        var hostname = this.sys.proxy_hostname;
        // var port
        var port = ':' + this.sys.real_port;

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
        // Okay. We need to refresh the student keys before running the code below.
        sys.db.all('SELECT m.studentID,s.name FROM memberships AS m JOIN students AS s ON s.studentID=m.studentID JOIN quizzes AS q ON q.classID=m.classID WHERE m.classID=? AND q.quizNumber=? AND (NOT q.sent OR m.studentID NOT IN (SELECT studentID FROM answers AS a WHERE a.classID=? AND a.quizNumber=?));',[classID,quizNumber,classID,quizNumber],function(err,rows){
            if (err||!rows) {return oops(response,err,'quiz/sendquiz(1)')};
            var datalst = [];
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                var studentKey = sys.getRandomKey(8,36);
                // This is a list of students to receive mail in this class.
                // Keys need to be updated for all keys of these students, in this class.
                sys.db.run('UPDATE memberships SET studentKey=? WHERE classID=? AND studentID=?',[studentKey,classID,row.studentID],function(err){
                    if (err) {return oops(response,err,'quiz/sendquiz(2)')};
                    // Good, so this does that. Send the mail message.
                    sys.membershipKeys[row.studentID] = studentKey;
                    sendMail(quizNumber,row.studentID,studentKey,row.name);
                });
                
            }
        });
        
        function sendMail (quizNumber,studentID,studentKey,name) {
            var link = template_link
                .replace(/@@STUDENT_ID@@/g,studentID)
                .replace(/@@STUDENT_KEY@@/g,studentKey)
                .replace(/@@QUIZ_NUMBER@@/g,quizNumber);
            var front = front_template.replace(/@@NAME@@/,name)
            var pastLinks = 0;
            sys.db.all('SELECT q.quizNumber FROM questions AS q JOIN quizzes AS qz ON qz.classID=q.classID AND qz.quizNumber=q.quizNumber WHERE q.classID=? AND NOT q.quizNumber=? AND qz.sent GROUP BY q.quizNumber',[classID,quizNumber],function(err,rows){
                if (err) {return oops(response,err,'quiz/sendquiz(3)')};
                var middle = '';
                var msg;
                if (!rows || !rows.length) {
                    // plain message
                    msg = front + link + back;
                } else {
                    // add note of past quiz links
                    var links = '';
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        quizNumber = row.quizNumber;
                        links += template_link
                            .replace(/@@STUDENT_ID@@/g,studentID)
                            .replace(/@@STUDENT_KEY@@/g,studentKey)
                            .replace(/@@QUIZ_NUMBER@@/g,quizNumber);
                    }
                    var middle = template_middle
                        .replace(/@@LINKS@@/g,links);
                    msg = front + link + middle + back;
                }
                console.log(msg);
            });
        }
        //
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.end("Testing ...");
    };
    exports.cogClass = cogClass;
})();

