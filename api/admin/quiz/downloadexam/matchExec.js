(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var sys = this.sys;

        var usePlatex = this.sys.use_platex;
        var useEucJp = this.sys.use_euc_jp;

        var examDocumentTemplate = this['exam-document'].toString();
        if (useEucJp) {
            examDocumentTemplate.replace('@@ENCODING-DECLARATION@@', '');
        } else {
            examDocumentTemplate.replace('@@ENCODING-DECLARATION@@', '\\usepackage[utf8]{inputenc}');
        }
        var examQuestionTemplate = this['exam-question'].toString();
        var examChoiceTemplate = this['exam-choice'].toString();
        var stringsToConvert = [];
        var quizObject = {questions:[]};
        var studentsInfo = [];
        var examsDir = './exams/';
        var classDir = examsDir + classID + '/';
        var zipDir = classDir + quizNumber + '/';
        var pdfDir = zipDir + 'pdf/';
        var latexDir = zipDir + 'src/';
        var documentQueue = [];
        var studentCount = 0;
        var stringsCount = 0;
        var documentCount = 0;
        var utf8 = this.sys.utf8;

        var archiver = require('archiver');

        makeDirectories();

        sys.db.get('SELECT c.name,q.examName,q.examDate,q.quizNumber FROM quizzes AS q JOIN classes AS c ON c.classID=q.classID WHERE q.classID=? AND q.quizNumber=?',[classID,quizNumber],function(err,row){
            if (err||!row) {return oops(response,err,'class/createexam(0)')};
            quizObject.className = row.name;
            quizObject.examTitle = row.examName;
            quizObject.examDate = row.examDate;
            quizObject.quizNumber = row.quizNumber;
            quizObject.zipName = quizObject.className + ': ' + quizObject.examTitle + ' (Quiz ' + quizObject.quizNumber + ')';
            quizObject.zipDirName = './exams/' + quizObject.zipName;
            sys.fs.readFile(quizObject.zipDirName + '.zip',function(err, data){
                if (err) {
                    getQuizQuestions();
                } else {
                    response.writeHead(200, {
                        'Content-Type': 'application/octet-stream',
                        'Content-Disposition': 'attachment; filename="' + utf8.encode(quizObject.zipName) + '.zip"'
                    });
                    response.end(data);
                }
            });
        });

        function getQuizQuestions () {
            var sql = 'SELECT questionNumber,'
                +   'r.string AS rubric,'
                +   'one.string AS one,'
                +   'two.string AS two,'
                +   'three.string AS three,'
                +   'four.string AS four '
                + 'FROM quizzes '
                + 'JOIN questions AS q USING(quizID) '
                + 'JOIN strings AS r ON r.stringID=q.stringID '
                + 'JOIN ('
                +     'SELECT questionID,string '
                +     'FROM choices '
                +     'JOIN strings USING(stringID) '
                +     'WHERE choices.choice=0'
                + ') AS one USING(questionID) '
                + 'JOIN ('
                +     'SELECT questionID,string '
                +     'FROM choices '
                +     'JOIN strings USING(stringID) '
                +     'WHERE choices.choice=1'
                + ') AS two USING(questionID) '
                + 'JOIN ('
                +     'SELECT questionID,string '
                +     'FROM choices '
                +     'JOIN strings USING(stringID) '
                +     'WHERE choices.choice=2'
                + ') AS three USING(questionID) '
                + 'JOIN ('
                +     'SELECT questionID,string '
                +     'FROM choices '
                +     'JOIN strings USING(stringID) '
                +     'WHERE choices.choice=3'
                + ') AS four USING(questionID) '
                + 'WHERE quizzes.classID=? AND quizzes.quizNumber=? '
                + 'ORDER BY q.questionNumber';
            sys.db.all(sql,[classID,quizNumber],function(err,rows){
                if (err||!rows) {return oops(response,err,'quiz/downloadexam(1)')}
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    var obj = {
                        questionNumber:row.questionNumber,
                        rubric:row.rubric,
                        choices: [
                            row.one,
                            row.two,
                            row.three,
                            row.four
                        ]
                    }
                    quizObject.questions.push(obj);
                }
                convertStringsToLatex();
            });
        };

        function convertStringsToLatex () {
            for (var i=0,ilen=quizObject.questions.length;i<ilen;i+=1) {
                var question = quizObject.questions[i];
                question.rubric = sys.markdown(question.rubric,true);
                stringsToConvert.push({
                    obj:question,
                    key:'rubric'
                });
                for (var k=0,klen=question.choices.length;k<klen;k+=1) {
                    question.choices[k] = sys.markdown(question.choices[k],true);
                    stringsToConvert.push({
                        obj:question.choices,
                        key:k
                    });
                }
            }
            // Now latex-ify the string content of the object
            stringsCount += stringsToConvert.length;
            sys.async.eachLimit(stringsToConvert, 1, pandocOnce, function(err){
                if (err) { console.log("ERROR: "+err) }
            });
        }
        
        function getStudents () {
            // Get a list of students enroled in the class
            
            var sql = 'SELECT students.studentID,students.name '
                + 'FROM memberships '
                + 'NATURAL JOIN students '
                + 'WHERE memberships.classID=? AND (privacy IS NULL OR privacy=?)';
            sys.db.all(sql,[classID,0],function(err,rows){
                if (err||!rows) {return oops(response,err,'class/createexam(5)')};
                if (rows.length) {
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        studentsInfo.push({
                            studentName:row.name,
                            studentID:row.studentID
                        });
                    }
                    buildLatexData();
                } else {
                    // If we decide to do response in this function, respond here too
                    // (looks like it wouldn't make sense to do so, though, as
                    // generateBarCodes() runs async)
                    console.log("No output for some reason.");
                }
            })
            
        };

        function buildLatexData() {
            console.log("RUN: buildLaTeX()");
            //   Randomize the questions
            // Okay, so the exams need to be cast as a big fat object,
            // so that the async pandoc converter can replace
            // the strings properly
            // We can just extend studentsInfo for this
            for (var i=0,ilen=studentsInfo.length;i<ilen;i+=1) {
                var studentInfo = studentsInfo[i];
                studentInfo.questions = JSON.parse(JSON.stringify(quizObject.questions));
                studentInfo.remap = sys.randomize(studentInfo.questions);
                for (var j=0,jlen=studentInfo.questions.length;j<jlen;j+=1) {
                    var question = studentInfo.questions[j];
                    question.remap = sys.randomize(question.choices);
                }
            }
            buildLatexSource();
        }

        function buildLatexSource() {
            console.log("Okay, build the LaTeX already");
            for (var i=0,ilen=studentsInfo.length;i<ilen;i+=1) {
                var studentInfo = studentsInfo[i];
                // Get the LaTeX document template and perform substitutions
                var latexDoc = examDocumentTemplate;
                latexDoc = latexDoc.replace(/@@STUDENT_NAME@@/g,studentInfo.studentName);
                latexDoc = latexDoc.replace(/@@EXAM_DATE@@/g,quizObject.examDate);
                latexDoc = latexDoc.replace(/@@EXAM_TITLE@@/g,quizObject.examTitle);
                latexDoc = latexDoc.replace(/@@COURSE_NAME@@/g,quizObject.className);
                var questionsStr = '';
                for (var j=0,jlen=studentInfo.questions.length;j<jlen;j+=1) {
                    var question = studentInfo.questions[j];
                    var origQuestionNumber = question.questionNumber;
                    var choicesStr = '';
                    for (var k=0,klen=4;k<klen;k+=1) {
                        var latexChoice = examChoiceTemplate;
                        var origChoice = question.remap[k];
                        var studentIDoffset = '' + ('' + studentInfo.studentID).length;
                        var questionNumberoffset = '' + ('' + origQuestionNumber).length;
                        var barCode = studentIDoffset + questionNumberoffset + ('' + studentInfo.studentID) + ('' + origQuestionNumber) + ('' + origChoice);
                        while (barCode.length < 10) {
                            barCode = '0' + barCode;
                        }
                        latexChoice = latexChoice.replace(/@@BARCODE@@/,barCode);
                        latexChoice = latexChoice.replace(/@@CHOICE_TEXT@@/,question.choices[k]);
                        choicesStr += latexChoice;
                    }
                    // Get the LaTeX question template and perform substitutions
                    var latexQuestion = examQuestionTemplate;
                    latexQuestion = latexQuestion.replace(/@@RUBRIC@@/,question.rubric);
                    latexQuestion = latexQuestion.replace(/@@CHOICES@@/,choicesStr);
                    questionsStr += latexQuestion;
                }
                latexDoc = latexDoc.replace(/@@QUESTIONS@@/,questionsStr);
                // The final touch
                latexDoc = latexDoc.replace(/\(\(([a-zA-Z1-9])\)\)/g,'\\mycirc{$1}');

                // Write to file
                sys.fs.writeFileSync(latexDir + studentInfo.studentName + '.ltx',latexDoc);
            }
            renderPDF();
        }

        function renderPDF () {
            sys.fs.readdir(latexDir,function(err, files){
                if (err) {
                    throw 'Error in renderPDF: ' + err;
                }
                for (var i=0,ilen=files.length;i<ilen;i+=1) {
                    var fileName = files[i];
                    if (!fileName.match(/\.ltx$/)) continue;
                    documentQueue.push(fileName);
                    documentQueue.push(fileName);
                }
                documentCount += documentQueue.length;
                var doOnce;
                if (useEucJp) {
                    doOnce = iconvOnce;
                } else {
                    doOnce = getPdfFunction();
                }
                sys.async.eachLimit(documentQueue, 1, doOnce, function(err){
                    if (err) { console.log("ERROR: "+err) }
                });
            });
        };

        function getPdfFunction () {
            if (usePlatex) {
                return pLatexOnce;
            } else {
                return latexOnce;
            }
        };

        function zipFiles () {
            // Set up archiver
            var archiver = require('archiver');
            var output = sys.fs.createWriteStream(quizObject.zipDirName + '.zip');
            var archive = archiver('zip');
            output.on('close', function() {
                console.log(archive.pointer() + ' total bytes');
                console.log('archiver has been finalized and the output file descriptor has closed.');

                console.log('Done!\nSend the bundle back to the client.');
                sys.fs.readFile(quizObject.zipDirName + '.zip',function(err, data){
                    if (err) {
                        console.log("Oh, darn. "+err);
                    } else {
                        response.writeHead(200, {
                            'Content-Type': 'application/octet-stream',
                            'Content-Disposition': 'attachment; filename="' + utf8.encode(quizObject.zipName) + '.zip"'
                        });
                        response.end(data);
                        sys.db.run('UPDATE quizzes SET sent=? WHERE classID=? AND quizNumber=?',[1,classID,quizNumber],function(err){
                            if (err) console.log("Warning: attempt to rest quiz sent status failed");
                        });

                    }
                });

            });
            archive.on('error', function(err) {
                throw err;
            });
            archive.pipe(output);

            // Process files to completion
            sys.fs.readdir(latexDir,function(err,files){
                for (var i=0,ilen=files.length;i<ilen;i+=1) {
                    var fileName = files[i];
                    if (!fileName.match(/\.pdf$/)) continue;
                    archive.append(sys.fs.createReadStream(latexDir + fileName), { name: quizObject.zipName + '/' + fileName })
                }
                archive.finalize();
            });

        };

        function iconvOnce(data, callback) {
            var newFileName = data.replace(/^(.*)(\.ltx)$/,"$1-euc$2");
            var ltx = sys.spawn("iconv",['-f','UTF8','-t','EUC-JP','-o',newFileName,data],{cwd:latexDir})
            ltx.stdout.on('data',function(data) {
                //console.log(data.toString());
            });
            ltx.stderr.on('data',function(data) {
                console.log(data.toString());
            });
            ltx.on('close', function (code) {
                var doOnce = getPdfFunction();
                doOnce(newFileName, callback);
            });
        };

        function latexOnce (data, callback) {
            var ltx = sys.spawn("pdflatex",[data],{cwd:latexDir})
            ltx.stdout.on('data',function(data) {
                //console.log(data.toString());
            });
            ltx.stderr.on('data',function(data) {
                //console.log(data.toString());
            });
            ltx.on('close', function (code) {
                callback();
                documentCount += -1;
                if (!documentCount) {
                    zipFiles();
                }
            });
        };

        function pLatexOnce (data, callback) {
            var ltx = sys.spawn("platex",[data],{cwd:latexDir})
            ltx.stdout.on('data',function(data) {
                //console.log(data.toString());
            });
            ltx.stderr.on('data',function(data) {
                //console.log(data.toString());
            });
            ltx.on('close', function (code) {
                var dvifilename = data.replace(/\.ltx/,".dvi");
                dvipdfOnce(dvifilename, callback);
            });
        };

        function dvipdfOnce (data, callback) {
            var dvi = sys.spawn("dvipdfmx",[data],{cwd:latexDir})
            dvi.stdout.on('data',function(data) {
                //console.log(data.toString());
            });
            dvi.stderr.on('data',function(data) {
                console.log(data.toString());
            });
            dvi.on('close', function (code) {
                callback();
                documentCount += -1;
                if (!documentCount) {
                    zipFiles();
                }
            });
        };

        function pandocLatexTableFix(str) {
            str = str.replace(/\\{newline\\}/g,'\\newline ','g');
            lst = str.split(/(ctable)(.*?{)(.*)(})/);
            for (var i=3,ilen=lst.length;i<ilen;i+=5) {
                var colspec = lst[i];
                for (var j=colspec.length-1;j>-1;j+=-1) {
                    colspec = colspec.slice(0,j) + 'p{2cm}' + colspec.slice(j+1);
                }
                
                lst[i] = colspec;
            }
            return lst.join('');
        };

        function pandocOnce (data, callback) {
            sys.pandoc.convert('html+tex_math_dollars',data.obj[data.key],['latex'],function(result, err){
                if (err) {
                    throw "Error in pandocOnce(): " + err;
                }
                data.obj[data.key] = pandocLatexTableFix(result.latex);
                callback();
                stringsCount += -1;
                if (!stringsCount) {
                    getStudents();
                }
            });
        }

        function makeDirectories () {
            var examsDir = './exams/';
            var classDir = examsDir + classID + '/';
            var zipDir = classDir + quizNumber + '/';
            var pdfDir = zipDir + 'pdf/';
            var latexDir = zipDir + 'src/';
            try {
                sys.fs.mkdirSync(examsDir);
            } catch (e) { console.log('Attempting to create exams dir: ' + e) }
            try {
                sys.fs.mkdirSync(classDir);
            } catch (e) { console.log('Attempting to create class dir: ' + e) }
            try {
                sys.fs.mkdirSync(zipDir);
            } catch (e) { console.log('Attempting to create zip dir: ' + e) }
            try {
                sys.fs.mkdirSync(latexDir);
            } catch (e) { console.log('Attempting to create latex dir: ' + e) }
            try {
                sys.fs.mkdirSync(pdfDir);
            } catch (e) { console.log('Attempting to create pdf dir: ' + e) }
        }

        //   Render the LaTeX to PDF and save to file
        
        // Finally, bundle PDF, LaTeX and bar codes in
        // a zip file, and notify the client
    }
    exports.cogClass = cogClass;
})();
