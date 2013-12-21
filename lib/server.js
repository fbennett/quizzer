(function () {
    var http = require('http');
    var serverClass = function (config, api) {
        this.config = config;
        this.api = api;
    };
    serverClass.prototype.runServer = function () {
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
                api.exec(this);
            });
        }).listen(this.config.quizPort);
        console.log("Listening on port "+this.config.quizPort);
    }
    exports.serverClass = serverClass;
})();
