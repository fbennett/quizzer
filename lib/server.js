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
                api(this,request,response);
            });
        }).listen(this.sys.port);
        var port = this.sys.port;
        this.sys.db.get('SELECT adminID FROM admin WHERE name=?',['admin'],function(err,row){
            console.log("Admin URL: http://localhost:" + port + '/?admin=' + row.adminID);
        });
    }
    exports.serverClass = serverClass;
})();
