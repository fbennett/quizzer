(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var sys = this.sys;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var commenter = this.sys.validCommenter(params);
        this.sys.db.get('SELECT name FROM classes WHERE classID=?',[classID],function(err,row){
            if (err||!row) {return oops(response,err,'class')};
            var myPage = page.toString().replace(/@@CLASS@@/g, row.name);
            myPage = myPage.replace(/@@QUIZ_NUMBER@@/g, quizNumber);
            myPage = myPage.replace(/@@COMMENTER@@/g, commenter);
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.end(myPage);
        });
    }
    exports.cogClass = cogClass;
})();
