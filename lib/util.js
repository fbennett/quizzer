(function () {
    var utilClass = function (sys) {
        this.sys = sys;
    };
    utilClass.prototype.getUtils = function () {
        var sys = this.sys;
        return {
            getClassMemberships: function (params,request,response,classID) {
                var sql = "SELECT s.name,s.studentID AS studentID,m.studentID AS enroled "
                    + "FROM students AS s "
                    + "LEFT JOIN ("
                    +   "SELECT classID,studentID "
                    +   "FROM memberships "
                    +     "WHERE classID=?"
                    + ") AS m ON m.studentID=s.studentID;"
                sys.db.all(sql,[classID],function(err,rows) {
                    var rowsets = [[],[]];
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        var dataitem = {name:row.name,studentid:row.studentID};
                        if (row.enroled) {
                            rowsets[0].push(dataitem);
                        } else {
                            rowsets[1].push(dataitem);
                        }
                    }
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(rowsets));
                });
            }
        }
    }
    exports.utilClass = utilClass;
})();
