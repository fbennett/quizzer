(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var payload = JSON.parse(request.POSTDATA);
        this.sys.db.get('SELECT classID,name FROM classes WHERE classID=?',[payload.classid],function(err,row){
            var obj = {classid:row.classID,name:row.name}
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(obj));
        });
    }
    exports.cogClass = cogClass;
})();
