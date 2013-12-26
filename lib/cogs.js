(function () {
    var cogsClass = function (sys,utils) {
        this.sys = sys;
        this.cogs = [];
        this.utils = utils;
    };
    cogsClass.prototype.loadCog = function (cogModule,pageName,callName) {
        var cogClass = new cogModule.cogClass();
        cogClass.sys = this.sys;
        cogClass.utils = this.utils;
        cogClass.pageName = pageName;
        cogClass.callName = callName;
        if (!cogClass.match) {
            cogClass.match = this.sys.validator(pageName,callName);
        }
        this.cogs.push(cogClass);
    };
    cogsClass.prototype.getCogs = function () {
        var groups = this.sys.fs.readdirSync('./api');
        for (var k=0,klen=groups.length;k<klen;k+=1) {
            var groupName = groups[k];
            var pages = this.sys.fs.readdirSync('./api/' + groupName);
            for (var i=0,ilen=pages.length;i<ilen;i+=1) {
                var pageName = pages[i];
                var cogModule = require('../api/' + groupName + '/' + pageName + '/matchExec.js');
                cogModule.cogClass.prototype.page = this.sys.fs.readFileSync('./api/' + groupName + '/' + pageName + '/page.html');
                this.loadCog(cogModule,pageName);
                
                var calls = this.sys.fs.readdirSync('./api/' + groupName + '/' + pageName);
                for (var j=0,jlen=calls.length;j<jlen;j+=1) {
                    var callName = calls[j];
                    if (['matchExec.js','page.html','matchExec.js~','page.html~'].indexOf(callName) > -1) continue;
                    cogModule = require('../api/' + groupName + '/' + pageName + '/' + callName + '/matchExec.js');
                    this.loadCog(cogModule,pageName,callName);
                }
            }
        }
        return this.cogs.slice();
    };
    exports.cogsClass = cogsClass;
})();
