(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var sql = 'SELECT adminID,name FROM admin WHERE role=2;';
        sys.db.all(sql,function(err,rows){
            if (err||!rows) {return oops(response,err,'classes/getcommenters(1)')}
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
