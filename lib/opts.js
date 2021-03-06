(function () {
    var optsClass = function (config) {
        this.config = config;
    }
    optsClass.prototype.getOpts = function () {
        var argparse = require('argparse')
        var ArgumentParser = argparse.ArgumentParser;
        var fs = require('fs');
        var optparse = new ArgumentParser({
            version: '0.0.1',
            addHelp:true,
            description: 'Quizzer, a quiz server'
        });
        optparse.addArgument(
            [ '-H', '--proxy-hostname' ],
            {
                help: 'Host name for external access'
            }
        );
        optparse.addArgument(
            [ '-Q', '--quizzer-path' ],
            {
                help: 'Server path to quizzer (default: "/quizzer/")'
            }
        );
        optparse.addArgument(
            [ '-p', '--real-port' ],
            {
                help: 'Port on which to listen for local connections'
            }
        );
        optparse.addArgument(
            [ '-e', '--email-account' ],
            {
                help: 'Full username of email account (e.g. useme@gmail.com)'
            }
        );
        optparse.addArgument(
            [ '-s', '--smtp-host' ],
            {
                help: 'SMTP host name (e.g. smtp.gmail.com)'
            }
        );
        optparse.addArgument(
            [ '-l', '--locale' ],
            {
                help: 'Language locale for admin interface ("en" or "ja")'
            }
        );
        optparse.addArgument(
            [ '-P', '--use-platex' ],
            {
                action: 'storeTrue',
                help: 'Use platex engine + dvipdfmx for PDF generation'
            }
        );
        optparse.addArgument(
            [ '-E', '--use-euc-jp' ],
            {
                action: 'storeTrue',
                help: 'Convert input text from UTF8 to legacy EUC-JP encoding before LaTeX processing'
            }
        );
        var args = optparse.parseArgs();
        if (args.real_port) {
            console.log("Reading config from quizzer-" + args.real_port + ".cfg");
            try {
                var newconfig = JSON.parse(fs.readFileSync('quizzer-' + args.real_port + '.cfg'));
                for (var key in newconfig) {
                    this.config[key] = newconfig[key];
                }
            } catch (err) {
                console.log("Warning: Error reading config file: "+err);
                //process.exit();
            }
        }
        var saveConfig = false;
        for (var key in args) {
            if (['isset','set','unset','get'].indexOf(key) > -1) continue;
            if (args[key] && this.config[key] != args[key]) {
                saveConfig = true;
                this.config[key] = args[key];
            }
        }
        // Put all opt error handling here
        var configOops = [];
        for (var key in this.config) {
            if (!this.config[key]) {
                configOops.push(key);
            }
        }
        if (configOops.length) {
            optparse.printHelp();
            for (var i=0,ilen=configOops.length;i<ilen;i+=1) {
                console.log("  ERROR: must set option "+configOops[i]);
            }
            return false;
        }
        if (saveConfig) {
            var configJson = JSON.stringify(this.config,null,2);
            fs.writeFileSync('quizzer-' + this.config.real_port + '.cfg', configJson);
            console.log("Wrote config parameters to quizzer-" + this.config.real_port + '.cfg');
            console.log("Quizzer can now be run with the single option: -p " + this.config.real_port);
        }
        // Write commenter message templates to disk if necessary
        var templates = [
            "commenter-message.txt",
            "quiz-message.txt",
            "quiz-message-past-quizzes.txt",
            "quiz-message-unanswered.txt",
            "quiz-message-answered.txt"
        ];
        for (var i=0,ilen=templates.length;i<ilen;i+=1) {
            var template = templates[i];
            try {
                fs.readFileSync(template);
            } catch (e) {
                var commenterMessage = fs.readFileSync(__dirname + "/../resource/" + template).toString();
                fs.writeFileSync(template,commenterMessage);
            }
        }
        return this.config;
    }
    exports.optsClass = optsClass;
})();
