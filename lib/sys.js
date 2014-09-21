(function () {
    var sysClass = function (opts,mailer,storage) {
        this.sys = opts;
        this.sys.mailer = mailer;
        this.sys.fs = require('fs');
        this.sys.marked = require('marked');
        this.sys.async = require('async');
        this.sys.pandoc = require('pandoc');
        this.sys.multiparty = require('multiparty')
        this.sys.i18n = require('i18n');
        this.sys.i18n.configure({
            locales:['en', 'ja'],
            directory: __dirname + '/../locales'
        });
        this.sys.i18n.setLocale(this.sys.locale);
    };
    sysClass.prototype.getSys = function () {
        function validAdmin (params) {
            return params.admin
                && this.admin[params.admin]
                && this.admin[params.admin].role
                && this.admin[params.admin].role == 1
                ? this.admin[params.admin].name : false
        };
        function validCommenter (params) {
            return params.commenter
                && this.admin[params.commenter]
                && this.admin[params.commenter].role
                && this.admin[params.commenter].role === 2
                ? this.admin[params.commenter] : false
        };
        function markdown (txt,pandocPrep,rtfOutput) {
            if (!txt) return '<p>&nbsp;</p>';
            txt = txt.replace(/(:-?\))/g,'(\u0298\u203f\u0298)');
            txt = txt.replace(/(:-\/)/g,'_(\u0361\u0e4f\u032f\u0361\u0e4f)_');
            txt = txt.replace(/^>>>\s+(.*)/,'__Rule\u21b4__\n\n>>> $1');
            txt = txt.replace(/^>>\s+(.*)/,'__Pattern\u21b4__\n\n>> $1');
            txt = txt.replace(/^>\s+(.*)/,'__Explanation\u21b4__\n\n> $1');
            txt = txt.replace(/\(\(([a-zA-Z1-9])\s+(.*?)\)\)/g, '<span class="quizzer-highlight">(($1)) $2</span>');
            txt = txt.replace(/([\uff01-\uff5a])/g, function (aChar) {
                val = (aChar.charCodeAt(0) - 65248);
                return String.fromCharCode(val);
            });
            if (rtfOutput) {
                txt = txt.replace(/\(\(([a-zA-Z1-9])\)\)/g, function (aChar) {
                    var c, val, offset;
                    if (aChar[2].match(/[a-z]/)) {
                        val = (aChar.charCodeAt(2) - 97)
                        offset = 9424;
                    } else if (aChar[2].match(/[A-Z]/)) {
                        val = (aChar.charCodeAt(2) - 65)
                        offset = 9398;
                    } else {
                        val = (aChar.charCodeAt(2) - 49)
                        offset = 9312;
                    }
                    return String.fromCharCode(val + offset);
                });
            }
            if (pandocPrep) {
                txt = txt.replace(/<br\/?>/g,'{newline}');
                txt = txt.replace(/\\\\\(/g,'$');
                txt = txt.replace(/\\\\\)/g,'$');
            }
            txt = txt.replace(/([\u0456\u0405\u0455\u0408\u0410\u0430\u0412\u041e\u043e\u0420\u0421\u0441\u0422\u0423\u0443\u042c\u0435])/g, function (aChar) {
                switch (aChar) {
                case '\u0456':
                    aChar = 'i';
                    break;
                case '\u0405':
                    aChar = 'S';
                    break;
                case '\u0455':
                    aChar = 's';
                    break;
                case '\u0408':
                    aChar = 'J';
                    break;
                case '\u0458':
                    aChar = 'j';
                    break;
                case '\u0410':
                    aChar = 'A';
                    break;
                case '\u0430':
                    aChar = 'a';
                    break;
                case '\u0412':
                    aChar = 'B';
                    break;
                case '\u041e':
                    aChar = 'O';
                    break;
                case '\u043e':
                    aChar = 'o';
                    break;
                case '\u0420':
                    aChar = 'P';
                    break;
                case '\u0421':
                    aChar = 'C';
                    break;
                case '\u0441':
                    aChar = 'c';
                    break;
                case '\u0422':
                    aChar = 'T';
                    break;
                case '\u0423':
                    aChar = 'y';
                    break;
                case '\u0443':
                    aChar = 'y';
                    break;
                case '\u042c':
                    aChar = 'b';
                    break;
                case '\u0435':
                    aChar = 'e';
                    break;
                }
                return aChar;
            });
            ret= this.marked(txt);
            return ret;
        };
        function getDateString(nowDate) {
            var month = "" + (1 + nowDate.getMonth());
            while (month.length < 2) {
                month = "0" + month;
            }
            var day = "" + nowDate.getDate();
            while (day.length < 2) {
                day = "0" + day;
            }
            return nowDate.getFullYear() + "-" + month + "-" + day;
        };
        function randomize(array) {
            console.log("RUN: randomize()");
            var new_order = [];
            var currentIndex = array.length;
            var temporaryValue;
            var randomIndex;
            var temporaryPos;

            for (var i=0,ilen=array.length;i<ilen;i+=1) {
                new_order.push(i);
            }

            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;
                // Swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
                // Same treatment for the sequence map
                temporaryPos = new_order[currentIndex];
                new_order[currentIndex] = new_order[randomIndex];
                new_order[randomIndex] = temporaryPos;
            }
            var remap = {};
            for (var i=0,ilen=array.length;i<ilen;i+=1) {
                remap[i] = new_order[i];
            }
            return remap;
        }
        this.sys.spawn = require('child_process').spawn;
        this.sys.markdown = markdown;
        this.sys.validAdmin = validAdmin;
        this.sys.validCommenter = validCommenter;
        this.sys.randomize = randomize;
        this.sys.getDateString = getDateString;
        return this.sys;
    };
    exports.sysClass = sysClass;
})();
