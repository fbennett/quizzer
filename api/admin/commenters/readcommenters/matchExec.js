(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        sys.db.all('SELECT name,adminKey,interval,email FROM admin WHERE role=2 ORDER BY name',function(err,rows){
            if (err||!rows) {return oops(response,err,'commenters/readcommenters(1)')};
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });


    }
    exports.cogClass = cogClass;
})();
