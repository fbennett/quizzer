(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var payload = JSON.parse(request.POSTDATA);
        if (payload.classid) {
            var name = payload.name;
            var db = this.sys.db;
            db.run('INSERT OR REPLACE INTO classes VALUES (?,?)',[payload.classid,payload.name],function(err){
                if (err) console.log("Error in addclass (1): "+err);
                sendClasses();
            })
        } else {
            var name = payload.name;
            var db = this.sys.db;
            db.run('INSERT INTO classes VALUES (NULL,?)',[payload.name],function(err){
                if (err) console.log("Error in addclass (3): "+err);
                sendClasses();
            });
        }
        function sendClasses () {
            db.all('SELECT classID,name FROM classes',function(err,rows){
                if (err) console.log("Error in addclass (4): "+err);
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
