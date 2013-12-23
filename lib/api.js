(function () {
    var apiClass = function (sys,cogs) {
        this.cogs = cogs;
        this.sys = sys;
    };
    apiClass.prototype.getApi = function () {
        var cogs = this.cogs;
        return function (params,request,response) {
            try {
                //parse url from request object
                var myPage;
                for (var i=0,ilen=cogs.length;i<ilen;i+=1) {
                    if (cogs[i].match(params)) {
                        cogs[i].exec(params,request,response);
                        break;
                    } else {
                        console.log("No match (should send back an error page instead of this string)");
                    }
                }
            } catch (e) {
                console.log('Error api.js: '+e);
            }
        };
    };
    exports.apiClass = apiClass;
})();
