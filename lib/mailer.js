(function () {
    var fs = require('fs');
    var mailerClass = function (config) {
        this.config = config;
    }
    mailerClass.prototype.getMailer = function () {
        var emailjs = require('emailjs')
        if (!this.config.smtp_host) {
            this.config.smtp_host = "smtp.gmail.com";
        }
        try {
            var email_password = fs.readFileSync('./mypwd.txt')
            if (!email_password) {
                console.log("ERROR: empty email password in mypwd.txt");
                return false;
            }
        } catch (e) {
            console.log("ERROR: file mypwd.txt not found: "+e);
            return false;
        }
        // Set up the mail server
        var mailserver  = emailjs.server.connect({
            user:    this.config.email_account, 
            password:email_password,
            host:    this.config.smtp_host, 
            ssl:     true
        });
        return mailserver;
    }
    exports.mailerClass = mailerClass;
})();
