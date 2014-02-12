(function () {
    var scheduleClass = function (config,mailer) {
        this.config = config;
        this.config.mailer = mailer;
        this.config.schedule = require('node-schedule');
        var fs = require('fs');
        this.config.msgTemplate = fs.readFileSync('commenter-message.txt').toString();
    };
    scheduleClass.prototype.scheduleAllMail = function (db) {
        this.config.db = db;
        var config = this.config;
        var scheduleMail = this.scheduleMail;
        db.all('SELECT adminID,adminKey,name,email,interval FROM admin WHERE email IS NOT NULL AND interval IS NOT NULL AND role=2',[],function(err,rows){
            if (err) {return 'Error in scheduler(1)'};
            if (rows) {
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    var adminID = row.adminID;
                    var name = row.name;
                    var email = row.email;
                    var adminKey = row.adminKey;
                    var dow = row.interval;
                    scheduleMail(config,adminID,name,email,adminKey,dow);
                }
            }
            console.log("Woke up the mail schedulers");
            console.log("Done. Ready to shake, rattle and roll!");
        });
    };
    scheduleClass.prototype.scheduleMail = function(config,adminID,name,email,adminKey,dow) {
        if (dow && "string" === typeof dow) {
            if (dow.match(/^[0-9]+$/)) {
                dow = parseInt(dow,10);
            } else {
                dow = null;
            }
        }

        if (config.admin[adminKey] && config.admin[adminKey].sched) {
            var success = config.schedule.cancelJob(config.admin[adminKey].sched);
        };

        if (!dow) {
            return;
        }
            
        // var hostname 
        var hostname = config.proxy_hostname;
        // var port
        var port = ':' + config.real_port;
        var email_account = config.email_account;
        
        var rule = new config.schedule.RecurrenceRule();
        rule.dayOfWeek = [dow];
        rule.hour = 8;
        rule.minute = 5;
        rule.dayOfWeek = dow;
        
        var msg = config.msgTemplate;
        msg = msg.replace(/@@NAME@@/,name);
        msg = msg.replace(/@@HOST_NAME@@/,config.proxy_hostname);
        msg = msg.replace(/@@QUIZZER_PATH@@/,config.quizzer_path);
        
        var j = config.schedule.scheduleJob(rule, function(err){
            if (err) {console.log("Error in scheduler "+err)}
            var newAdminKey = config.getRandomKey(8,36);
            config.db.run('UPDATE admin SET adminKey=? WHERE adminID=?',[newAdminKey,adminID],function(err){
                if (err) {return 'Error in scheduler(2)'};
                config.admin[newAdminKey] = {name:name,role:2,id:adminID};
                delete config.admin[adminKey];
                config.mailer.sendMail({
                    text:    msg.replace(/@@COMMENTER_KEY@@/,newAdminKey),  
                    from:    "Academic Writing Central <" + email_account + ">", 
                    to:      email,
                    subject: 'Quizzer calling'
                }, function(err) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
            config.admin[adminKey].sched = j;
        });
    }
    exports.scheduleClass = scheduleClass;
})();
