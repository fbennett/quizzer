(function () {
    var apiClass = function (cogs) {
        this.cogs;
    };
    apiClass.prototype.getApi = function () {
        var qs = require('querystring');
        var url = require('url');
        return function (context) {
            var uriObj = url.parse(context.url);
            uriObj.parsedQuery = qs.parse(uriObj.query);
            try {
                //parse url from request object
                var myPage;
                for (var i=0,ilen=this.cogs.length;i<ilen;i+=1) {
                    if (this.cogs[i].match(uriObj.parsedQuery)) {
                        this.cogs[i].exec(request, uriObj.parsedQuery);
                        break;
                    }
                }
            } catch (e) {
                console.log('Error api.js: '+E);
            }
        };
    };
    exports.apiClass = apiClass;
})();
