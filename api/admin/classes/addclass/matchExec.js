(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var retRows = [];
        this.sys.db.all('SELECT name,classID FROM classes',function(err,rows){
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                retRows.push([row.name,row.classID]);
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(retRows));
        });
    }
    exports.cogClass = cogClass;
})();
