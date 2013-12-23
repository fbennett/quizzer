(function () {
    var http = require('http');
    var serverClass = function (sys, api) {
        this.sys = sys;
        this.api = api;
    };
    serverClass.prototype.runServer = function () {
        var api = this.api;
        http.createServer(function (request, response) {
            if(request.method == "OPTIONS"){
                var nowdate = new Date();
                response.writeHead(200, {
                    'Date': nowdate.toUTCString(),
                    'Allow': 'GET,POST,OPTIONS',
                    'Content-Length': 0,
                    'Content-Type': 'text/plain',
                });
                response.end('');
                return;
            }
            request.on('data', function(data){
                if(typeof this.POSTDATA === "undefined"){
                    this.POSTDATA = data;
                }
                else{
                    this.POSTDATA += data;
                }
            });
            request.on('end', function(){
                console.log("GOT REQUEST!");
                console.log("this.url="+this.url);

                var fs = require('fs');
                var qs = require('querystring');
                var url = require('url');
                var uriObj = url.parse(request.url);
                var params = qs.parse(uriObj.query);

                if ('.js' === uriObj.href.slice(-3)) {
                    var myxml = fs.readFileSync(uriObj.href.replace(/^.*?\/(js|node_modules)\/(.*)/, '$1/$2'));
                    response.writeHead(200, {'Content-Type': 'text/javascript'});
                    response.end(myxml);
                    return;
                } else if ('.css' === uriObj.href.slice(-4)) {
                    var myxml = fs.readFileSync(uriObj.href.replace(/^.*?\/(css\/.*)/, '$1'));
                    response.writeHead(200, {'Content-Type': 'text/css'});
                    response.end(myxml);
                    return;
                } else {
                    api(request,response);
                }
            });
        }).listen(this.sys.port);
        var port = this.sys.port;
    }
    exports.serverClass = serverClass;
})();
