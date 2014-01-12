(function () {
    var cogClass = function () {
    };
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var dow = params.dow;
        var commenterKey = params.commenterkey;
        var commenterID = sys.admin[commenterKey].id;
        sys.db.get('SELECT name,email FROM admin WHERE role=2 AND adminID=?',[commenterID],function(err,row){
            if (err) {return oops(response,err,'commenters/setcommentermailday(1)')};
            if (row) {
                updateSchedule(row.name,row.email,dow);
            } else {
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.end('fail in mail');
            }
        });
        function updateSchedule(name,email,dow) {
            var dow = parseInt(dow,10);
            if ("number" !== typeof dow) {
                dow = null;
            }
            sys.db.run('UPDATE admin SET interval=? WHERE adminID=?',[dow,commenterID],function(err){
                if (err) {return oops(response,err,'commenters/setcommentermailday(2)')};
                // Update the scheduler
                sys.scheduler.scheduleMail(sys,commenterID,name,email,commenterKey,dow);
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(['success']));
            });
        }
    }
    exports.cogClass = cogClass;
})();
