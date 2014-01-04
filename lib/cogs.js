(function () {
    var cogsClass = function (sys,utils) {
        this.sys = sys;
        this.cogs = [];
        this.utils = utils;
    };
    cogsClass.prototype.loadCog = function (cogModule,groupName,pageName,callName) {
        var cogClass = new cogModule.cogClass();
        cogClass.sys = this.sys;
        cogClass.utils = this.utils;
        cogClass.pageName = pageName;
        cogClass.callName = callName;
        if (!cogClass.match) {
            cogClass.match = require('../api/' + groupName + '/validator.js').getValidator(pageName,callName);
        }
        this.cogs.push(cogClass);
    };
    cogsClass.prototype.getCogs = function () {
        var pth = require('path');
        var groups = this.sys.fs.readdirSync(__dirname +'/../api');
        for (var k=0,klen=groups.length;k<klen;k+=1) {
            var groupName = groups[k];
            var pages = this.sys.fs.readdirSync(__dirname + '/../api/' + groupName);
            for (var i=0,ilen=pages.length;i<ilen;i+=1) {
                var pageName = pages[i];
                // If it is not a directory, ignore it
                if (!this.sys.fs.statSync(__dirname + '/../api/' + groupName+'/'+pageName).isDirectory()) continue;
                // matchExec.js must always be there
                var parentCogModule = require('../api/' + groupName + '/' + pageName + '/matchExec.js');

                var cogPartnerNames = this.sys.fs.readdirSync(__dirname + '/../api/' + groupName + '/' + pageName);
                for (var j=0,jlen=cogPartnerNames.length;j<jlen;j+=1) {
                    var partnerName = cogPartnerNames[j];
                    // Everything not matchExec.js in pageName that is a file gets loaded to parent cog as a content object, under its root filename
                    if (partnerName.match(/~$/) || partnerName === 'matchExec.js') continue;
                    var partnerPath = __dirname + '/../api/' + groupName + '/' + pageName + '/' + partnerName;
                    if (this.sys.fs.statSync(partnerPath).isFile()) {
                        var partnerRootName = partnerName.replace(/^(.*)\..*$/,'$1');
                        parentCogModule.cogClass.prototype[partnerRootName] = this.sys.fs.readFileSync(partnerPath);
                    } else if (this.sys.fs.statSync(partnerPath).isDirectory()) {
                        var cogModule = require(partnerPath + '/matchExec.js');
                        this.loadCog(cogModule,groupName,pageName,partnerName);
                        var cogPartnerDataFiles = this.sys.fs.readdirSync(__dirname + '/../api/' + groupName + '/' + pageName + '/' + partnerName);
                        for (var m=0,mlen=cogPartnerDataFiles.length;m<mlen;m+=1) {
                            var dataFile = cogPartnerDataFiles[m];
                            if (dataFile.match(/.*~$/) || dataFile === 'matchExec.js') {
                                continue;
                            }
                            var dataFileRootName = dataFile.replace(/^(.*)\..*$/,'$1');
                            cogModule.cogClass.prototype[dataFileRootName] = this.sys.fs.readFileSync(partnerPath + '/' + dataFile);
                        }
                    }
                }
                this.loadCog(parentCogModule,groupName,pageName);
            }
        }
        return this.cogs.slice();
    };
    exports.cogsClass = cogsClass;
})();
