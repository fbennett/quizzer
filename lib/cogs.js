(function () {
    var cogsClass = function (sys) {
        this.sys = sys;
        this.cogs = [];
    };
    cogsClass.prototype.loadCog = function (cogModule,validator,pageName,callName) {
        var cogClass = new cogModule.cogClass();
        cogClass.sys = this.sys;
        cogClass.pageName = pageName;
        cogClass.callName = callName;
        if (!cogClass.match) {
            cogClass.match = validator(pageName,callName);
        }
        this.cogs.push(cogClass);
    };
    cogsClass.prototype.getCogs = function () {
        var groups = this.sys.fs.readdirSync('./api');
        for (var k=0,klen=groups.length;k<klen;k+=1) {
            var groupName = groups[k];
            var pages = this.sys.fs.readdirSync('./api/' + groupName);
            var validator = require('../api/' + groupName + '/validator.js').validator;
            for (var i=0,ilen=pages.length;i<ilen;i+=1) {
                var pageName = pages[i];
                if (pageName === 'validator.js') continue; 
                var cogModule = require('../api/' + groupName + '/' + pageName + '/matchExec.js');
                cogModule.cogClass.prototype.page = this.sys.fs.readFileSync('./api/' + groupName + '/' + pageName + '/page.html');
                this.loadCog(cogModule,validator,pageName);
                
                var calls = this.sys.fs.readdirSync('./api/' + groupName + '/' + pageName);
                for (var j=0,jlen=calls.length;j<jlen;j+=1) {
                    var callName = calls[j];
                    if (['matchExec.js','page.html'].indexOf(callName) > -1) continue;
                    cogModule = require('../api/' + groupName + '/' + pageName + '/' + callName + '/matchExec.js');
                    this.loadCog(cogModule,validator,pageName,callName);
                }
            }
        }
        return this.cogs.slice();
    };
    exports.cogsClass = cogsClass;
})();
