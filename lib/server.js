(function () {
    var http = require('http');
    var serverClass = function (sys, api, utils) {
        this.sys = sys;
        this.api = api;
        this.utils = utils;
    };

    serverClass.prototype.runServer = function () {
        var api = this.api;
        var sys = this.sys;
        var utils = this.utils;
        var oops = this.utils.apiError;
        http.createServer(function (request, response) {
            if(request.method == "OPTIONS"){
                var nowdate = new Date();
                response.writeHead(200, {
                    'Date': nowdate.toUTCString(),
                    'Allow': 'GET,POST,OPTIONS',
                    'Content-Length': 0,
                    'Content-Type': 'text/plain',
                });
                response.end('');
                return;
            }

            var fs = require('fs');
            var qs = require('querystring');
            var url = require('url');
            var uriObj = url.parse(request.url);
            var params = qs.parse(uriObj.query);
            params.pathname = uriObj.pathname;

            if (sys.validAdmin(params)
                && params.page === 'class'
                && params.classid
                && params.cmd === 'uploadstudentlist') {
                
                console.log("HEADERS: "+JSON.stringify(request.headers,null,2));
                
                var form = new sys.multiparty.Form();
                var nameIdx = null;
                var emailIdx = null;
                var addToStudentsList = [];
                var addToShowingList = [];
                form.parse(request, function(err, fields, files) {
                    // Extract data from CSV
                    var mycsv = fs.readFileSync(files.classRegistrationList[0].path);
                    var csv = require('csv');
                    var studentCount = 0;
                    var studentLst = [];
                    csv()
                        .from.string(mycsv)
                        .on('record', function (row,index) {
                            if (index === 0) {
                                for (var i=0,ilen=row.length;i<ilen;i+=1) {
                                    if (row[i].toLowerCase().indexOf('name') > -1) {
                                        nameIdx = i;
                                    } else if (row[i].toLowerCase().indexOf('email') > -1) {
                                        emailIdx = i;
                                    }
                                }
                                if (nameIdx === null || emailIdx === null) {
                                    nameIdx = 0;
                                    emailIdx = 1;
                                    processRowData();
                                }
                            } else {
                                processRowData();
                            }
                            function processRowData () {
                                // Check for email
                                if (row && row.length > 1) {
                                    if (row[nameIdx] && row[emailIdx].match(/.@./)) {
                                        if (!row[nameIdx].match(/"/)) {
                                            studentLst.push({name:row[nameIdx],email:row[emailIdx]});
                                        }
                                    }
                                }
                            }
                        })
                        .on('end', function (count) {
                            console.log("Line count: "+count);
                            studentCount += studentLst.length;
                            beginTransaction();
                            if (!studentCount) {
                                response.writeHead(303, {'Location': request.headers.referer});
                                response.end();
                                request.connection.destroy();
                            }
                        })
                        .on('error', function (err) {
                            console.log("CSV oops: "+err);
                            // Discard everything
                            for (var i=0,ilen=studentLst.length;i<ilen;i+=1) {
                                studentLst.pop();
                            }
                        });
                    
                    function beginTransaction () {
                        sys.db.run('BEGIN TRANSACTION',function(err){
                            checkForEmail(0,studentLst.length);
                        });
                    };

                    function checkForEmail(pos,limit) {
                        var sql = 'SELECT studentID,email FROM students WHERE email=?';
                        var email = studentLst[pos].email;
                        sys.db.get(sql,[email],function(err,row){
                            if (err) {return oops(response,err,'file-upload/checkForMail()')}
                            var student = studentLst[pos];
                            if (!row) {
                                addToStudentsList.push(student);
                            } else {
                                student.studentID = row.studentID;
                                addToShowingList.push(student);
                            }
                            pos += 1;
                            if (pos < limit) {
                                checkForEmail(pos,limit);
                            } else {
                                addToStudents(0,addToStudentsList.length);
                            }
                        });
                    };

                    function addToStudents(pos,limit) {
                        var sql = 'INSERT INTO students VALUES (NULL,?,?,?,?)';
                        var student = addToStudentsList[pos];
                        sys.db.run(sql,[student.name,student.email,0,'en'],function(err){
                            if (err) {return oops(response,err,'file-upload/addToStudents()')}
                            student.studentID = this.lastID;
                            addToShowingList.push(student);
                            pos += 1;
                            if (pos < limit) {
                                addToStudents(pos,limit);
                            } else {
                                addToShowing(0,addToShowingList.length);
                            }
                        });
                    };

                    function addToShowing(pos,limit) {
                        var sql = 'INSERT OR IGNORE INTO showing VALUES (NULL,?,?,?)'
                        var studentID = addToShowingList[pos].studentID;
                        sys.db.run(sql,[sys.admin[params.admin].id,params.classid,studentID],function(err){
                            if (err) {return oops(response,err,'file-upload/addToShowing()')}
                            pos += 1;
                            if (pos < limit) {
                                addToShowing(pos,limit);
                            } else {
                                endTransaction();
                            }
                        });
                    };

                    function endTransaction () {
                        delete params.cmd;
                        response.writeHead(303, {'Location': request.headers.referer});
                        response.end();
                        request.connection.destroy();
                    };
                });
            } else {
                serveMe();
            }
            function serveMe() {
            request.on('data', function(data){
                if(typeof this.POSTDATA === "undefined"){
                    this.POSTDATA = "";
                }
                this.POSTDATA += data;
                if(this.POSTDATA.length > 1e6) {
                    this.POSTDATA = "";
                    response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                    request.connection.destroy();
                }
            });
            request.on('end', function(){
                console.log("this.url="+this.url);

                if (this.POSTDATA) {
                    var payload;
                    if (!request.headers['content-type'].match(/multipart\/form-data/)) {
                        payload = JSON.parse(this.POSTDATA);
                        for (var key in payload) {
                            params[key] = payload[key];
                        }
                    }
                }

                if ('.js' === uriObj.href.slice(-3)) {
                    var myxml = fs.readFileSync(__dirname + '/../' + uriObj.href.replace(/^.*?\/(js|node_modules)\/(.*)/, '$1/$2'));
                    response.writeHead(200, {'Content-Type': 'text/javascript'});
                    response.end(myxml);
                    return;
                } else if ('.css' === uriObj.href.slice(-4)) {
                    console.log(__dirname + '/' + uriObj.href.replace(/^.*?\/(css\/.*)/, '$1'));
                    var myxml = fs.readFileSync(__dirname + '/../' + uriObj.href.replace(/^.*?\/(css\/.*)/, '$1'));
                    response.writeHead(200, {'Content-Type': 'text/css'});
                    response.end(myxml);
                    return;
                } else if ('commenter-manual.html' === uriObj.href.slice(-21)) {
                    console.log(__dirname + '/commenter-manual.html');
                    var myxml = fs.readFileSync(__dirname + '/../docs/commenter-manual.html');
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    response.end(myxml);
                    return;
                } else {
                    api(params,request,response);
                }
            });
            }
        }).listen(this.sys.real_port);
    }
    exports.serverClass = serverClass;
})();
