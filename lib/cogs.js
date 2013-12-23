(function () {
    var cogsClass = function (sys) {
        this.sys = sys;
        this.cogs = [];
    };
    cogsClass.prototype.loadCog = function (cogModule,callName) {
        cogModule.cogClass.prototype.sys = this.sys;
        cogModule.cogClass.prototype.call = callName;
        var cogClass = new cogModule.cogClass();
        this.cogs.push(cogClass);
    };
    cogsClass.prototype.getCogs = function () {
        var groups = this.sys.fs.readdirSync('./api');
        for (var k=0,klen=groups.length;k<klen;k+=1) {
            var groupName = groups[k];
            var pages = this.sys.fs.readdirSync('./api/' + groupName);
            for (var i=0,ilen=pages.length;i<ilen;i+=1) {
                var pageName = pages[i];
                if (pageName === 'validate.js') continue; 
                var cogModule = require('../api/' + groupName + '/' + pageName + '/matchExec.js');
                cogModule.cogClass.prototype.type = 'page';
                cogModule.cogClass.prototype.identifier = pageName;
                cogModule.cogClass.prototype.page = this.sys.fs.readFileSync('./api/' + groupName + '/' + pageName + '/page.html');
                this.loadCog(cogModule);
                
                var calls = this.sys.fs.readdirSync('./api/' + groupName + '/' + pageName);
                for (var j=0,jlen=calls.length;j<jlen;j+=1) {
                    var callName = calls[j];
                    if (['matchExec.js','page.html'].indexOf(callName) > -1) continue;
                    cogModule = require('../api/' + groupName + '/' + pageName + '/' + callName + '/matchExec.js');
                    cogModule.cogClass.prototype.type = 'cmd';
                    cogModule.cogClass.prototype.identifier = callName;
                    this.loadCog(cogModule,callName);
                }
            }
        }
        return this.cogs.slice();
    };
    exports.cogsClass = cogsClass;
})();
