(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var ruleGroupID = params.groupid;
        var lang = params.lang;
        var langName = params.langname;
        var sql = "SELECT RS.string AS heading,CASE WHEN RT.string IS NOT NULL THEN RT.string ELSE EN.string END AS text "
            + "FROM rules "
            + "JOIN ruleStrings RS USING(ruleStringID) "
            + "JOIN (SELECT ruleID,string FROM ruleTranslations WHERE lang='en') EN USING(ruleID) "
            + "LEFT JOIN (SELECT ruleID,string FROM ruleTranslations WHERE lang=?) RT USING(ruleID) "
            + "WHERE ruleGroupID=? "
            + "ORDER BY heading;";
        sys.db.all(sql,[lang,ruleGroupID],function(err,rows){
            if (err||!rows) {return oops(response,err,'classes/gettranslations(1)')};
            composeDocument(rows);
        });

        function composeDocument(rows) {
            var obj = [];
            var misc = {
                category:'Miscellaneous',
                entries:[]
            };
            var category = false;
            var catnum = 0;
            var entrynum = 0;
            for (var i=0,ilen=rows.length;i<ilen;i++) {
                var row = rows[i];
                var m = row.heading.match(/^(?:\*\*)?([^\*]+):(?:\*\*)?\s*(.*)/);
                if (m) {
                    if (m[1] !== category) {
                        catnum += 1;
                        entrynum = 0;
                        var section = {
                            category:catnum + ". " + m[1],
                            entries:[]
                        };
                        obj.push(section);
                        category = m[1];
                    }
                    entrynum += 1;
                    var entry = {
                        heading: catnum + "." + entrynum + ". " + m[2],
                        text: row.text
                    }
                    section.entries.push(entry);
                } else {
                    misc.entries.push(row);
                }
            }
            if (misc.entries.length) {
                obj.push(misc);
            }
            // Good. So now we have the content, in sections, in Markdown, ready for catenating.
            var txt = '# Style and Grammar Notes for ' + langName + '\n\n';
            for (var i=0,ilen=obj.length;i<ilen;i++) {
                var section = obj[i];
                txt += '## ' + section.category + '\n\n';
                for (var j=0,jlen=section.entries.length;j<jlen;j++) {
                    var entry = section.entries[j];
                    txt += '### ' + entry.heading + '\n\n';
                    txt += entry.text + '\n\n';
                }
            }
            // Convert to HTML
            var html = sys.markdown(txt,true,true);
            // Some RTF formatting templates
            var rtfHeader = "{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 \\fswiss Helvetica;}{\\f1 \\fmodern Courier;}}\n"
                + "{\\colortbl;\\red0\\green0\\blue0;\\red255\\green0\\blue0;\\red100\\green160\\blue100;\\red0\\green0\\blue255;}\n"
                + "{\\stylesheet "
                +   "{\\s0 \\ql \\f0 \\fs24 \\sa180 \\li0 \\fi0;}"
                +   "{\\s1 \\sbasedon0 \\b\\fs36 \\sa180 \\outlinelevel1 Heading1;}"
                +   "{\\s2 \\sbasedon0 \\b\\fs32 \\sa180 \\outlinelevel2 Heading2;}"
                +   "{\\s3 \\sbasedon0 \\b\\fs28 \\sa180 \\outlinelevel3 Heading3;}"
                +   "{\\s4 \\sbasedon0 \\b\\fs24 \\sa180 \\outlinelevel4 Heading4;}"
                +   "{\\s5 \\sbasedon0 \\b\\fs20 \\sa180 \\outlinelevel5 Heading5;}"
                +   "{\\s10 \\sbasedon0 \\f1 \\fs24 \\sa180 Code;}"
                + "}\n"
                + "\\widowctrl\\hyphauto\n";
            var rtfColorTable = "{\\colortbl;\\red0\\green0\\blue0;\\red255\\green0\\blue0;\\red100\\green160\\blue100;\\red0\\green0\\blue255;}";
            var rtfBoxedIncorrect = "\\li720\\ri720\\box\\brdrdot\\brdrw10\\brsp20\\brdrcf2";
            var rtfBoxedIncorrectList = "\\li1080\\ri720\\box\\brdrdot\\brdrw10\\brsp20\\brdrcf2";
            var rtfBoxedCorrect = "\\li720\\ri720\\box\\brdrdb\\brdrw10\\brsp20\\brdrcf3";
            var rtfBoxedCorrectList = "\\li1080\\ri720\\box\\brdrdb\\brdrw10\\brsp20\\brdrcf3";
            var rtfBoxedRule = "\\li720\\ri720\\box\\brdrs\\brdrw10\\brsp20\\brdrcf1";
            var rtfTrailer = "}"

            // And now convert it to RTF
            sys.pandoc.convert('html',html,['rtf'],function(result, err){
                if (err) {
                    // should probably respond before throwing
                    throw "Error in pandoc conversion: " + err;
                }
                // Fix up formatting ...
                var rtf = result.rtf;
                rtf = rtf.replace(/\\li720/g,rtfBoxedIncorrect);
                rtf = rtf.replace(/\\li1440/g,rtfBoxedCorrect);
                rtf = rtf.replace(/\\li2160/g,rtfBoxedRule);
                rtf = rtf.replace(/\\li1080/g,rtfBoxedIncorrectList);
                rtf = rtf.replace(/\\li1800/g,rtfBoxedCorrectList);
                rtf = rtf.replace(/\\ql \\f0 \\sa180 \\li0 \\fi0 \\b \\fs32/g,"\\s2");
                rtf = rtf.replace(/\\ql \\f0 \\sa180 \\li0 \\fi0 \\b \\fs28/g,"\\s3");
                rtf = rtf.replace(/\\ql \\f0 \\sa180 \\li0 \\fi0 \\b \\fs24/g,"\\s4");
                rtf = rtf.replace(/\\ql \\f0 \\sa180 \\li0 \\fi0 \\b \\fs20/g,"\\s5");
                // Header and footer
                rtf = rtfHeader + rtfColorTable + rtf + rtfTrailer;
                // And ship it for downloading
                response.writeHead(200, {
                    'Content-Type': 'application/rtf',
                    'Content-Disposition': 'attachment; filename="QuizzerGuide_' + lang + '.rtf"',
                    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                    'Expires': '-1',
                    'Pragma': 'no-cache'
                });
                response.end(rtf);
            });
        }
    }
    exports.cogClass = cogClass;
})();
