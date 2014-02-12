(function () {
    var fs = require('fs');
    var mailerClass = function (config) {
        this.config = config;
    }
    mailerClass.prototype.getMailer = function () {
        var nodemailer = require('nodemailer')
        var config = this.config;
        var hasPassword = true;
        try {
            var email_password = fs.readFileSync('./mypwd.txt')
            if (!email_password) {
                throw "ERROR: empty email password in mypwd.txt";
            }
        } catch (e) {
            hasPassword = false;
        }
        if (!hasPassword) {
            console.log('Message: no mypwd.txt file found, will use local Sendmail transport');
        }
        var mailserver;
        if (!hasPassword) {
            console.log('Using local Sendmail transport');
            mailserver  = nodemailer.createTransport('Sendmail',{});
        } else {
            console.log('Using external account ' + config.email_account + ' for mail transport');
            mailserver = nodemailer.createTransport("SMTP",{
                auth: {
                    user: config.email_account,
                    pass: email_password
                }
            });
        }
        // Set up the mail server
        return mailserver;
    };
    exports.mailerClass = mailerClass;
})();
