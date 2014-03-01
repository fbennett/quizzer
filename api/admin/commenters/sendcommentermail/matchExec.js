(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        // Send commenter mail
        var keys = params.keys;
        var subj = params.subj;
        var msg = params.msg;
        var addresses = [];
        var sqlLst = [];
        var params = [];
        for (var i=0,ilen=keys.length;i<ilen;i+=1) {
            sqlLst.push('?');
            params.push(keys[i]);
        }
        var sql = 'SELECT email FROM admin WHERE adminKey in (' + sqlLst.join(',') + ');';
        sys.db.all(sql,params,function(err,rows){
            if (err||!rows) {return oops(response,err,'commenters/sendcommentermail(1)')};
            for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                var row = rows[i];
                addresses.push(row.email);
            }
            sendCommenterMail(0,rows.length);
        });

        function sendCommenterMail(pos,limit) {
            if (pos === limit) {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(['success']));
                return;
            }
            var email = addresses[pos];

            // XXX if sendmail ain't there, the server will crash
            // try/catch won't trap the error
            sys.mailer.sendMail({
                text:    msg,  
                from:    "Quizzer Central <" + sys.email_account + ">", 
                to:      email,
                subject: '[Quizzer admin] ' + subj
            }, function(err) {
                if (err) {
                    console.log(err);
                }
            });
            sendCommenterMail(pos+1,limit);
        }
    }
    exports.cogClass = cogClass;
})();
