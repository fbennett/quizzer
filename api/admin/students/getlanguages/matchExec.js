(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var sql = 'SELECT * FROM languages ORDER BY langName;'
        sys.db.all(sql,function(err,rows){
            if (err||!rows) {return oops(response,err,'students/getlanguages(1)')};
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                if (row.lang === 'en') {
                    rows = rows.slice(i,i+1).concat(rows.slice(0,i).concat(rows.slice(i+1)));
                    break;
                }
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });
    }
    exports.cogClass = cogClass;
})();
