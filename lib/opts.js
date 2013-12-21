(function () {
    var optsClass = function (config) {
        this.config = config;
    }
    optsClass.prototype.getOpts = function () {
        var argparse = require('argparse')
        var ArgumentParser = argparse.ArgumentParser;
        var optparse = new ArgumentParser({
            version: '0.0.1',
            addHelp:true,
            description: 'Quizzer, a quiz server'
        });
        optparse.addArgument(
            [ '-a', '--email-account' ],
            {
                help: 'Full username of email account (e.g. useme@gmail.com)'
            }
        );
        optparse.addArgument(
            [ '-s', '--smtp-host' ],
            {
                help: 'SMTP host name'
            }
        );
        var args = optparse.parseArgs();
        for (var key in args) {
            this.config[key] = args[key];
        }
        // Put all opt error handling here
        if (!this.config.email_account) {
            optparse.printHelp();
            console.log("ERROR: must provide an email account");
            return false;
        }
        return this.config;
    }
    exports.optsClass = optsClass;
})();
