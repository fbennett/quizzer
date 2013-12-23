(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var payload = JSON.parse(request.POSTDATA);
        this.sys.db.get('SELECT studentID,name,email FROM students WHERE studentID=?',[payload.studentid],function(err,row){
            var obj = {classid:row.classID,name:row.name,email:row.email}
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(obj));
        });
    }
    exports.cogClass = cogClass;
})();
