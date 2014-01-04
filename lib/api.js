(function () {
    var apiClass = function (sys,cogs) {
        this.cogs = cogs;
        this.sys = sys;
        this.errpage = this.sys.fs.readFileSync(__dirname + '/../lib/errpage.html');
    };
    apiClass.prototype.getApi = function () {
        var cogs = this.cogs;
        var errpage = this.errpage;
        return function (params,request,response) {
            try {
                var success = false;
                for (var i=0,ilen=cogs.length;i<ilen;i+=1) {
                    if (cogs[i].match(params)) {
                        cogs[i].exec(params,request,response);
                        success = true;
                        break;
                    }
                }
                if (!success) {
                    response.writeHead(404, {'Content-Type': 'text/html'});
                    response.end(errpage)
                }
            } catch (e) {
                console.log('Unhandled error in api.js: '+e);
            }
        };
    };
    exports.apiClass = apiClass;
})();
