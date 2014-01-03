(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var page = this.page;
        var classID = params.classid;
        var quizNumber = params.quizno;
        var sys = this.sys;
        var examDocumentTemplate = this['exam-document'].toString();
        var examQuestionTemplate = this['exam-question'].toString();
        var examChoiceTemplate = this['exam-choice'].toString();
        var stringsToConvert = [];
        var className;
        var zipDir;
        var pdfDir;
        var latexDir;
        var graphicsDir;
        var studentsInfo;
        var studentCount = 0;
        var barCodeCount = 0;
        var stringsCount = 0;

        console.log("Beginning database operations");
        sys.db.get('SELECT name FROM classes WHERE classID=?',[classID],function(err,row){
            if (err||!row) {return oops(response,err,'class/createexam(0)')};
            className = row.name;
            getQuizzes();
        });



                        response.writeHead(200, {'Content-Type': 'text/html'});
                        response.end(myPage);

        function convertStringsToLatex (quizNumber,quizQuestions) {
            for (var i=0,ilen=quizQuestions.length;i<ilen;i+=1) {
                var question = quizQuestions[i];
                var rubricText = sys.markdown(question.rubric);
                stringsToConvert.push({
                    obj:question,
                    key:'rubric',
                    txt:rubricText,
                    quizNumber:quizNumber,
                    quizQuestions:quizQuestions
                });
                for (var k=0,klen=question.choices.length;k<klen;k+=1) {
                    var choiceText = sys.markdown(question.choices[k]);
                    stringsToConvert.push({
                        obj:question.choices,
                        key:k,
                        txt:choiceText,
                        quizNumber:quizNumber,
                        quizQuestions:quizQuestions
                    });
                }
            }
            // Now latex-ify the string content of the object
            stringsCount += stringsToConvert.length;
            sys.async.eachLimit(stringsToConvert, 1, pandocIterator, function(err){
                if (err) { console.log("ERROR: "+err) }
            });
        }
        
        function getStudents (quizNumber,quizQuestions) {
            console.log("RUN: getStudents()");
            // Get a list of students enroled in the class
            
            sys.db.all('SELECT s.studentID,s.name FROM memberships as m JOIN students AS s ON s.studentID=m.studentID WHERE m.classID=? AND (s.privacy IS NULL OR s.privacy=?)',[classID,0],function(err,rows){
                if (err||!rows) {return oops(response,err,'class/createexam(5)')};
                if (rows.length) {
                    studentsInfo = [];
                    for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                        var row = rows[i];
                        studentsInfo.push({
                            studentName:row.name,
                            studentID:row.studentID
                        });
                    }
                    generateBarCodes(quizNumber,quizQuestions,studentsInfo);
                } else {
                    // If we decide to do response in this function, respond here too
                    // (looks like it wouldn't make sense to do so, though, as
                    // generateBarCodes() runs async)
                    console.log("No output for some reason.");
                }
            })
            
        }

        function generateBarCodes (quizNumber,quizQuestions,studentsInfo) {
            console.log("RUN: generateBarCodes()");
            // Confirm presence of necessary subdirectories
            zipDir = './exams/' + classID + '/' + quizNumber + '/';
            pdfDir = './exams/' + classID + '/' + quizNumber + '/pdf/';
            latexDir = './exams/' + classID + '/' + quizNumber + '/src/';
            graphicsDir = './exams/' + classID + '/' + quizNumber + '/src/graphics/';
            try {
                sys.fs.mkdirSync('./exams');
            } catch (e) { console.log('Error creating exams dir: ' + e) }
            try {
                sys.fs.mkdirSync('./exams/' + classID);
            } catch (e) { console.log('Error creating class dir: ' + e) }
            try {
                sys.fs.mkdirSync(zipDir);
            } catch (e) { console.log('Error creating zip dir: ' + e) }
            try {
                sys.fs.mkdirSync(latexDir);
            } catch (e) { console.log('Error creating latex dir: ' + e) }
            try {
                sys.fs.mkdirSync(graphicsDir);
            } catch (e) { console.log('Error creating graphics dir: ' + e) }
            try {
                sys.fs.mkdirSync(pdfDir);
            } catch (e) { console.log('Error creating pdf dir: ' + e) }
            // For each student ...
            console.log("Generating for "+studentsInfo.length+" students");
            for (var i=0,ilen=studentsInfo.length;i<ilen;i+=1) {
                var studentID = studentsInfo[i].studentID;
                var studentName = studentsInfo[i].studentName;
                barCodeCount += (quizQuestions.length * 4);
                // ... and each question ...
                for (var j=0,jlen=quizQuestions.length;j<jlen;j+=1) {
                    var questionNumber = (j + 1);
                    // ... and each possible answer ...
                    for (var k=0,klen=4;k<klen;k+=1) {
                        //create a 200x25 px image from studentID, questionNumber, and choice
                        // console.log("Generating bar code for: "+studentName+" q="+questionNumber+" a="+k);
                        var fileName = 'barcode-' + studentID + '-' + questionNumber + '-' + k;
                        var studentIDoffset = '' + ('' + studentID).length;
                        var questionNumberoffset = '' + ('' + questionNumber).length;
                        var barCode = studentIDoffset + questionNumberoffset + ('' + studentID) + ('' + questionNumber) + ('' + k);
                        if (barCode.length % 2) {
                            barCode = '0' + barCode;
                        }
                        var buf = sys.barc.code2of5(barCode, 200, 25);
                        sys.fs.writeFileSync(graphicsDir + fileName + '.png', buf);
                        barCodeCount += -1;
                    }
                }
            }
            buildLatexData(quizNumber,quizQuestions,studentsInfo)
        };
        
        function buildLatexData(quizNumber,quizQuestions,studentsInfo) {
            console.log("RUN: buildLaTeX()");
            //   Randomize the questions
            console.log("Generating LaTeX documents");
            // Okay, so the exams need to be cast as a big fat object,
            // so that the async pandoc converter can replace
            // the strings properly
            // We can just extend studentsInfo for this
            for (var i=0,ilen=studentsInfo.length;i<ilen;i+=1) {
                var studentInfo = studentsInfo[i];
                studentInfo.questions = quizQuestions.slice();
                studentInfo.remap = randomize(studentInfo.questions);
                for (var j=0,jlen=studentInfo.questions.length;j<jlen;j+=1) {
                    var question = studentInfo.questions[j];
                    question.remap = randomize(question.choices);
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
                latexDoc = latexDoc.replace(/@@EXAM_DATE@@/g,examDate);
                latexDoc = latexDoc.replace(/@@EXAM_TITLE@@/g,examTitle);
                latexDoc = latexDoc.replace(/@@COURSE_NAME@@/g,className);
                var questionsStr = '';
                for (var j=0,jlen=studentInfo.questions.length;j<jlen;j+=1) {
                    var question = studentInfo.questions[j];
                    var origQuestionNumber = (parseInt(studentInfo.remap[j], 10) + 1);
                    var choicesStr = '';
                    for (var k=0,klen=4;k<klen;k+=1) {
                        var latexChoice = examChoiceTemplate;
                        var origChoice = question.remap[k];
                        var fileName =  'graphics/barcode-' + studentInfo.studentID + '-' + origQuestionNumber + '-' + origChoice + '.png';
                        latexChoice = latexChoice.replace(/@@BARCODE_FILENAME@@/,fileName);
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
                sys.fs.writeFileSync(latexDir + 'exam-' + studentInfo.studentID + '.ltx',latexDoc);
            }
        }

        function pandocIterator (data, callback) {
            console.log("Tried this: "+data.txt);
            sys.pandoc.convert('html',data.txt,['latex'],function(result, err){
                if (err) {
                    throw "OUCH! " + err;
                }
                data.obj[data.key] = result.latex;
                console.log("  Now shows up as this: "+data.obj[data.key]);
                callback();
                stringsCount += -1;
                if (!stringsCount) {
                    getStudents(data.quizNumber,data.quizQuestions);
                }
            });
        }

        //   Render the LaTeX to PDF and save to file
        
        // Finally, bundle PDF, LaTeX and bar codes in
        // a zip file, and notify the client
    }
    exports.cogClass = cogClass;
})();
