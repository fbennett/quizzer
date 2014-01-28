(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var ruleID = params.ruleid;
        var commenterID = params.commenterid;
        var sql = 'UPDATE rules SET adminID=? WHERE ruleID=?;';
        sys.db.run(sql,[commenterID,ruleID],function(err){
            if (err) {return oops(response,err,'classes/promoteonerule(1)')};
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(['success']));
        });
    }
    exports.cogClass = cogClass;
})();
