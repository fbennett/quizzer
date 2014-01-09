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
                form.parse(request, function(err, fields, files) {
                    // Extract data from CSV
                    var mycsv = fs.readFileSync(files.classRegistrationList[0].path);
                    var csv = require('csv');
                    var studentCount = 0;
                    csv()
                        .from.string(mycsv)
                        .on('record', function (row,index) {
                            console.log("GOT RECORD: "+row);
                            // Check for email
                            if (row && row.length) {
                                if (row[1].match(/@/)) {
                                    studentCount += 1;
                                    checkForEmail(row[0],row[1]);
                                }
                            }
                            if (!studentCount) {
                                delete params.cmd;
                                serveMe();
                            }
                        })
                        .on('end', function (count) {
                            console.log("Line count: "+count);
                        })
                        .on('error', function (err) {
                            console.log("CSV oops");
                        });
                    function checkForEmail(name,email) {
                        sys.db.get('SELECT studentID,email FROM students WHERE email=?',[email],function(err,row){
                            if (err) {return oops(response,err,'file upload/check for mail')}
                            if (!row) {
                                addToStudents(name,email);
                            } else {
                                addToShowing(row.studentID);
                            }
                        });
                    }
                    function addToStudents(name,email) {
                        sys.db.run('INSERT INTO students VALUES (NULL,?,?,?,?)',[name,email,0,'en'],function(err){
                            addToShowing(this.lastID);
                        });
                    }
                    function addToShowing(studentID) {
                        sys.db.run('INSERT OR IGNORE INTO showing VALUES (NULL,?,?,?)',[sys.admin[params.admin].id,params.classid,studentID],function(err){
                            studentCount += -1;
                            if (!studentCount) {
                                delete params.cmd;
                                console.log("DONE!");
                                response.writeHead(303, {'Location': request.headers.referer});
                                response.end();
                                request.connection.destroy();

                                //serveMe();
                            }
                        });
                    }
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
                } else {
                    api(params,request,response);
                }
            });
            }
        }).listen(this.sys.real_port);
    }
    exports.serverClass = serverClass;
})();
