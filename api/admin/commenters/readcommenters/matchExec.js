(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var sql = 'SELECT name,adminKey,interval,email,'
            + 'CASE WHEN email IS NOT NULL AND NOT email="" AND interval IS NOT NULL THEN 1 ELSE 0 END AS complete,'
            + 'count(comments.adminID) AS numberOfComments,'
            + 'lang.languages '
            + 'FROM admin '
            + 'LEFT JOIN (SELECT adminID,group_concat(lang) AS languages FROM adminLanguages GROUP BY adminID) AS lang ON lang.adminID=admin.adminID '
            + 'LEFT JOIN comments USING(adminID) '
            + 'WHERE role=2 GROUP BY admin.adminID ORDER BY complete DESC,numberOfComments DESC,name'
        sys.db.all(sql,function(err,rows){
            if (err||!rows) {return oops(response,err,'commenters/readcommenters(1)')};
            console.log(JSON.stringify(rows,null,2));
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        });


    }
    exports.cogClass = cogClass;
})();
