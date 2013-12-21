(function () {
    var storageClass = function (sys) {};
    storageClass.prototype.getStorage = function () {
        function writeStudents (studentsById) {
            var cfh = csv().to.path('./ids/students.csv');
            var rows = [];
            for (var key in studentsById) {
                var obj = studentsById[key];
                var row = [obj.name, obj.email, obj.id, obj.key];
                cfh.write(row);
                rows.push(row);
            }
            cfh.end();
            return rows;
        };
        function writeClasses (classes) {
            var cfh = csv().to.path('./ids/classes.csv');
            var rows = [];
            for (var key in classes) {
                var obj = classes[key];
                var row = [obj.name, obj.id];
                cfh.write(row);
                rows.push(row);
            }
            cfh.end();
            return rows;
        };
        function writeMemberships (memberships) {
            var cfh = csv().to.path('./ids/memberships.csv');
            var rows = [];
            for (var classID in memberships) {
                for (var studentID in memberships[classID]) {
                    var row = [classID, studentID];
                    cfh.write(row);
                }
            }
            cfh.end();
            return rows;
        };
        return {
            writeStudents:writeStudents,
            writeClasses:writeClasses,
            writeMemberships:writeMemberships
        }
    };
    exports.storageClass = storageClass;
})();
