(function () {
    var cogsClass = function (sys) {
        this.sys = sys;
        this.cogs = [];
    };
    cogsClass.prototype.getCogs = function () {
        var pages = this.sys.fs.readdirSync('./api');
        for (var i=0,ilen=pages.length;i<ilen;i+=1) {
            var pageName = pages[i];
            var calls = this.sys.fs.readdirSync('./api/' + pageName);
            for (var j=0,jlen=calls.length;j<jlen;j+=1) {
                var callName = calls[i];
                var cogModule = require('../api/' + pageName + '/' + callName + '/matchExec.js');
                cogModule.cogClass.prototype.sys = this.sys;
                cogModule.cogClass.prototype.call = callName;
                cogModule.cogClass.prototype.page = this.sys.fs.readFileSync('./api/' + pageName + '/' + callName + '/page.html');
                var cogClass = new cogModule.cogClass();
                this.cogs.push(cogClass);
             }
        }
        return this.cogs.slice();
    };
    exports.cogsClass = cogsClass;
})();
