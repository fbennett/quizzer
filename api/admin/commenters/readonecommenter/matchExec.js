(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var commenterKey = params.commenterkey;
        var commenterID = sys.admin[commenterKey].id;
        sys.db.get('SELECT name FROM admin WHERE role=2 AND adminID=?',[commenterID],function(err,row){
            if (err) {return oops(response,err,'commenters/readonecommenter')}
            if (row) {
                var ret = {
                    name:row.name
                }
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(ret));
                
            } else {
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.end('fail');
            }
        });
    }
    exports.cogClass = cogClass;
})();
