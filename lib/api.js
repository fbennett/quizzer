(function () {
    var apiClass = function (sys,cogs) {
        this.cogs = cogs;
        this.sys = sys;
    };
    apiClass.prototype.getApi = function () {
        var cogs = this.cogs;
        var sys = this.sys;
        return function (params,response) {
            try {
                //parse url from request object
                var myPage;
                for (var i=0,ilen=cogs.length;i<ilen;i+=1) {
                    if (cogs[i].match.call(sys,params)) {
                        cogs[i].exec(params,response);
                        break;
                    } else {
                        console.log("No match");
                    }
                }
            } catch (e) {
                console.log('Error api.js: '+e);
            }
        };
    };
    exports.apiClass = apiClass;
})();
