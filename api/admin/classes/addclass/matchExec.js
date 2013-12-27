(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        if (params.classid) {
            var name = params.name;
            var db = this.sys.db;
            db.run('INSERT OR REPLACE INTO classes VALUES (?,?)',[params.classid,params.name],function(err){
                if (err) {return oops(response,err,'classes/addclass')};
                sendClasses();
            })
        } else {
            var name = params.name;
            var db = this.sys.db;
            db.run('INSERT INTO classes VALUES (NULL,?)',[params.name],function(err){
                if (err) {return oops(response,err,'classes/addclass')};
                sendClasses();
            });
        }
        function sendClasses () {
            db.all('SELECT classID,name FROM classes',function(err,rows){
                if (err||!rows) {return oops(response,err,'classes/addclass')};
                var retRows = [];
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    retRows.push([row.name,row.classID]);
                }
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(retRows));
            });
        }
    }
    exports.cogClass = cogClass;
})();
