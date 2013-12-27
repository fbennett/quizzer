(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;

//        this.sys.db.get('SELECT c.name,q.quizNumber FROM classes AS c JOIN quizzes AS q ON q.classID=c.classID WHERE q.classID=? AND q.quizNumber=?',[params.classid,params.quizno],function(err,row){
//            if (err||!row) {return oops(response,err,'quiz')};
//            var myPage = page.toString().replace(/@@CLASS@@/g, row.name);
//            myPage = myPage.replace(/@@QUIZ_NUMBER@@/g, row.quizNumber);
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.end(this.page);
//        });
    }
    exports.cogClass = cogClass;
})();
