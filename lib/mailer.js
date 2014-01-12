(function () {
    var fs = require('fs');
    var mailerClass = function (config) {
        this.config = config;
    }
    mailerClass.prototype.getMailer = function () {
        var emailjs = require('emailjs')
        try {
            var email_password = fs.readFileSync('./mypwd.txt')
            if (!email_password) {
                throw "ERROR: empty email password in mypwd.txt";
            }
        } catch (e) {
            throw "ERROR: file mypwd.txt not found: "+e;
        }
        // Set up the mail server
        var mailserver  = emailjs.server.connect({
            user:    this.config.email_account, 
            password:email_password,
            host:    this.config.smtp_host, 
            ssl:     true
        });
        return mailserver;
    };
    exports.mailerClass = mailerClass;
})();
