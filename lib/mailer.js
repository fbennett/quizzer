(function () {
    var fs = require('fs');
    var mailerClass = function (config) {
        this.config = config;
    }
    mailerClass.prototype.getMailer = function () {
        var nodemailer = require('nodemailer')
        try {
            var email_password = fs.readFileSync('./mypwd.txt')
            if (!email_password) {
                throw "ERROR: empty email password in mypwd.txt";
            }
        } catch (e) {
            throw "ERROR: file mypwd.txt not found: "+e;
        }
        // Set up the mail server
        var mailserver  = nodemailer.createTransport('Sendmail',{});
        return mailserver;
    };
    exports.mailerClass = mailerClass;
})();
