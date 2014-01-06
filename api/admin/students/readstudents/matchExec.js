(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        this.sys.db.all('SELECT name,studentID,email,privacy,lang FROM students',function(err,rows){
            if (err||!rows) {return oops(response,err,'students/readstudents')};
            var retRows = [];
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                var retRow = [row.name, row.email, row.studentID, row.privacy, row.lang];
                retRows.push(retRow);
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(retRows));
        });
    }
    exports.cogClass = cogClass;
})();
