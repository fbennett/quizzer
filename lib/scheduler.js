(function () {
    var scheduleClass = function (sys) {
        this.sys = sys;
    }
    scheduleClass.prototype.run = function () {
        var schedule = require('node-schedule');
        var sys = this.sys;
        sys.db.all('SELECT adminID,name,email,interval FROM admin WHERE email IS NOT NULL AND interval IS NOT NULL AND role=2',[],function(err,rows){
            if (err) {return 'Error in scheduler(1)'};
            if (rows) {
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    var adminID = row.adminID;
                    var name = row.name;
                    var email = row.email;
                    var adminKey = sys.getRandomKey(8,36);
                    var oldAdminKey = row.adminKey;
                    var dow = row.interval;
                    updateCommenterKeys(oldAdminKey,adminID,name,email,adminKey,dow);
                }
            }

            function updateCommenterKeys (oldAdminKey,adminID,name,email,adminKey,dow) {
                sys.db.run('UPDATE admin SET adminKey=? WHERE adminID=?',[adminKey,adminID],function(err){
                    if (err) {return 'Error in scheduler(2)'};
                
                    sys.admin[adminKey] = {name:name,role:2,id:adminID};
                    delete sys.admin[oldAdminKey];

                    scheduleMail(adminID,name,email,adminKey,dow);
                });
            };
                
            function scheduleMail(adminID,name,email,adminKey,dow) {
                // var hostname 
                var hostname = sys.proxy_hostname;
                // var port
                var port = ':' + sys.real_port;
                var email_account = sys.email_account;
                
                var rule = new schedule.RecurrenceRule();
                rule.dayOfWeek = [dow];
                rule.hour = 22;
                rule.minute = 35;

                var msg = name + ':\n\n'
                    + 'Thank you for offering to comment on student work in our\n'
                    + 'writing program. We appreciate the value of your time, and\n'
                    + 'our students will benefit greatly from any constructive\n'
                    + 'feedback you can offer.\n\n'
                    + 'Your personal link to the commenting system is updated regularly\n'
                    + 'as a security measure. The link below is valid for the coming\n'
                    + 'week:\n\n'
                    + '    http://our.law.nagoya-u.ac.jp/quizzer/staff.html?commenter=@@COMMENTER_ID@@\n\n'
                    + 'After navigating to the quizzes for a class, you will find a\n'
                    + 'list of mistaken responses students have made to questions on\n'
                    + 'grammatical and style issues. Many responses are tagged with the\n'
                    + 'native language of students who missed that particular question.\n'
                    + "Comments in the students' own language can be particularly helpful,\n"
                    + 'as this is often beyond our own capacity.\n\n'
                    + 'A few shorthand forms are available to make preparing clear, targeted\n'
                    + 'guidance as simple as possible. To set up the "wrong" answer as an\n'
                    + 'example, paste it into the text box, and put a single ">" character\n'
                    + 'at the beginning of the line:\n\n'
                    + '    > This article is of the laws of Utopia nowadays.\n\n'
                    + 'Mark a specific portion of the example by enclosing it in double\\n'
                    + 'parens, and adding a single letter or number after the opening parens:\n\n'
                    + '    > This article is ((1 of)) the laws of Utopia ((2 nowadays)).\n\n'
                    + 'To state a pattern, begin the line with two ">" characters (the example)\n'
                    + 'below also illustrates how to add italics):\n\n'
                    + '    >> The story is *about* soccer.\n\n'
                    + 'To state a rule, use three ">" characters:\n\n'
                    + '    >>> Never use the word "nowadays" in formal writing.\n\n'
                    + 'Circled markers can also be written by enclosing a single letter\n'
                    + 'or number in double parens:\n\n'
                    + '    This is ((1)) pen.\n\n'
                    + "That's about all there is to it. Again, we are grateful for your\n"
                    + 'contribution. If you can spend a few minutes this week reviewing\n'
                    + 'quiz errors, our students will be motivated to put in their very\n'
                    + 'effort during their period of study.\\n'
                    + 'Sincerely yours,\n'
                    + 'Frank Bennett\n'
                    + 'Faculty of Law\n'
                    + 'Nagoya University\n'
                    + 'Japan';

                var j = schedule.scheduleJob(rule, function(){
                    sys.mailer.send({
                        text:    msg.replace(/@@COMMENTER_ID@@/,adminKey), 
                        from:    "Academic Writing Central <" + email_account + ">", 
                        to:      email,
                        subject: 'Quizzer calling'
                    }, function(err, message) { console.log(err || message); });
                });
            };
        });
    }
    exports.scheduleClass = scheduleClass;
})();
