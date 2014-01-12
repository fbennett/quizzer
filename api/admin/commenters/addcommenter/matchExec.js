(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var name = params.name;
        var adminKey = params.commenterkey;
        if (!adminKey) {
            adminKey = sys.getRandomKey(8,36);
        }
        var adminID = null;
        if (sys.admin[adminKey]) {
            adminID = sys.admin[adminKey].id;
        }
        var interval = params.dow;
        var email = params.email;
        if (adminID) {
            sys.db.run('UPDATE admin SET name=?,interval=?,email=? WHERE adminID=?',[name,interval,email,adminID],function(err){
                if (err) {return oops(response,err,'commenters/addcommenter(2)')};
                sys.scheduler.scheduleMail(sys,adminID,name,email,adminKey,interval);
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(['success']));
            });
        } else {
            sys.db.run('INSERT OR IGNORE INTO admin VALUES (NULL,?,?,2,?,?)',[name,adminKey,interval,email],function(err){
                if (err) {return oops(response,err,'commenters/addcommenter(3)')};
                console.log("LAST ID: "+this.lastID+", adminKey="+adminKey);
                sys.admin[adminKey] = {name:name,role:2,id:this.lastID,sched:null};
                sys.scheduler.scheduleMail(sys,this.lastID,name,email,adminKey,interval);
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(['success']));
            });
        }
    }
    exports.cogClass = cogClass;
})();
