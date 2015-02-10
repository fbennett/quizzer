(function () {
    var cogClass = function () {};
    // Loose security on this, good enough.
    cogClass.prototype.match = function (params) {
        return (params.studentid
                && params.studentkey
                && !params.cmd
                && !params.commenter
                && params.page === 'i18n');
    };
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var strings = params.strings;
        var i18n = this.sys.i18n;
        for (var str in strings) {
            strings[str] = i18n.__(str);
        }
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(strings));
    }
    exports.cogClass = cogClass;
})();
