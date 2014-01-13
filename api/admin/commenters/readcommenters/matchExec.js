(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        sys.db.all('SELECT name,adminKey,interval,email,CASE WHEN email IS NOT NULL AND NOT email="" AND interval IS NOT NULL THEN 1 ELSE 0 END AS complete FROM admin WHERE role=2 ORDER BY complete DESC,name',function(err,rows){
            if (err||!rows) {return oops(response,err,'commenters/readcommenters(1)')};
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });


    }
    exports.cogClass = cogClass;
})();
