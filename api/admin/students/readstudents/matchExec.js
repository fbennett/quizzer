(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        this.sys.db.all('SELECT name,studentID,email FROM students',function(err,rows){
            if (err) console.log("Error in students/readstudents: "+err);
            var retRows = [];
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                var retRow = [row.name, row.email, row.studentID, 'somekey'];
                retRows.push(retRow);
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(retRows));
        });
    }
    exports.cogClass = cogClass;
})();
