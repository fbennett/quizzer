(function () {
    var apiClass = function (sys,cogs) {
        // Hmm. Cogs should be, you know, _a_ _list_ _of_ _cogs_.
        console.log("cogs1: "+cogs);
        this.cogs = cogs;
    };
    apiClass.prototype.getApi = function () {
        var cogs = this.cogs;
        console.log("cogs2: "+cogs);
        var qs = require('querystring');
        var url = require('url');
        return function (context,request,response) {
            console.log("HELLO");
            var uriObj = url.parse(context.url);
            uriObj.parsedQuery = qs.parse(uriObj.query);
            try {
                //parse url from request object
                var myPage;
                console.log("Hello! "+cogs.length);
                for (var i=0,ilen=cogs.length;i<ilen;i+=1) {
                    if (cogs[i].match(uriObj.parsedQuery)) {
                        console.log("Match");
                        cogs[i].exec(uriObj.parsedQuery,response);
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
