(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var ruleGroupID = params.groupid;
        console.log("ruleGroupID="+ruleGroupID);
        var sql = 'SELECT ruleID,string,adminID,name '
            + 'FROM rules '
            + 'JOIN ruleStrings USING(ruleStringID) '
            + 'JOIN admin USING(adminID) '
            + 'ORDER BY string '
            + 'WHERE ruleGroupID=?;';
        sys.db.all(sql,[ruleGroupID],function(err,rows){
            if (err||!rows) {return oops(response,err,'classes/getrules(1)')};
            var ret = {admin:[],commenters:[]};
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                if (row.adminID == 1) {
                    ret.admin.push(row);
                } else {
                    ret.commenters.push(row);
                }
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(ret));
        });
    }
    exports.cogClass = cogClass;
})();
