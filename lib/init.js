(function () {
    var initClass = function (config,mailer,scheduler) {
        this.config = config;
        this.config.admin = {};
        this.config.membershipKeys = {};
        this.config.scheduler = scheduler;
        var fs = require('fs');
        var sqlite3 = require('sqlite3').verbose();
        var events = require("events");
        var eventEmitter = new events.EventEmitter();
        var db;

        // Getting sane about this
        // When the DB is ready, we emit an event
        // The event is picked up, and items are scheduled by scheduleAllMail
        // The schedule controllers are set on config(sys).admin
        // When an event is rescheduled, the controller is destroyed, and we reschedule with scheduleMail
        // So we need those two functions, and that's it
        // They should just be bare objects, available on scheduler
        // Nothing else is required

        try {
            var fh = fs.openSync('quizzer-' + config.real_port + '.sqlite', 'r')
            fs.close(fh);
            openDatabase(getStarted);
        } catch (e) {
            if (e.code === 'ENOENT') {
                openDatabase(initEverything);
            } else {
                throw e;
            }
        }

        function initEverything () {
            var sql = fs.readFileSync(__dirname + '/../resource/schema.sql').toString();
            sql += "INSERT INTO version VALUES ('quizzer'," + getNewSchemaVersion() + ");"
            db.exec(sql,function(err){
                if (err) throw "Error initializing database: " + err;
                setupAdmin(showUrl);
            });
        };

        function setupAdmin(callback) {
            db.run("INSERT OR IGNORE INTO admin VALUES (NULL,?,?,?,?,NULL)",['admin',getRandomKey(8,36), 1,0], function (err) {
                if (err) console.log("Error in setupAdmin(): "+err);
                callback();
            });
        };

        function openDatabase (callback) {
            eventEmitter.on('databaseIsReady',function (db) {
                scheduler.scheduleAllMail(db);
            });
            db = new sqlite3.Database('quizzer-' + config.real_port + '.sqlite');
            process.on('SIGINT', function() {
                console.log('\nGot SIGINT. So that\'s it, then.');
                try {
                    db.close();
                } catch (e) {
                    console.log("Database already closed, apparently");
                }
                process.exit();
            });
            process.on('exit', function() {
                try {
                    db.close();
                } catch (e) {}
                console.log('About to exit.');
            });
            callback();
        };
            
        // Check if we're versioning yet
        function getStarted () {
            db.get("SELECT name FROM sqlite_master WHERE type=? AND name=?",
                   ['table','version'],
                   function(err,row){
                       if (err) {
                           throw 'Error: init(1): '+err;
                       };
                       if (!row || !row.name) {
                           createVersionTable();
                       } else {
                           checkSchemaVersion();
                       }
                   });
        };
        
        function createVersionTable () {
            db.exec(
                "CREATE TABLE version (schema TEXT PRIMARY KEY, version INT NOT NULL);"
                    + "CREATE INDEX schema ON version(schema);"
                    + "INSERT INTO version VALUES ('quizzer',1);",
                function(err){
                    if (err) {throw 'Error: init(2): '+err};
                    checkSchemaVersion();
                }
            );
        };

        function getNewSchemaVersion () {
            var sql = fs.readFileSync(__dirname + '/../resource/schema.sql').toString();
            var schemaVersion =       parseInt(sql.match(/^-- ([0-9]+)/)[1],10);
            return schemaVersion;
        };

        function checkSchemaVersion () {
            var schemaVersion = getNewSchemaVersion();
            db.get('SELECT version FROM version WHERE schema=?',['quizzer'],function(err,row){
                if (err||!row) {throw 'Error: init(3)'}
                var dbVersion = parseInt(row.version,10);
                if (schemaVersion > dbVersion) {
                    var upgraderModule = require('./upgrades.js');
                    var upgrader = new upgraderModule.upgraderClass(db,dbVersion,schemaVersion);
                    upgrader.run(showUrl);
                } else {
                    showUrl();
                }
            });
        };
        
        /* Utility stuff */
        function purgeStrings () {
            var sql = "DELETE FROM strings"
                + " WHERE stringID NOT IN"
                + "   (SELECT DISTINCT rubricID AS stringID FROM questions"
                + "    UNION SELECT qOneID AS stringID FROM questions"
                + "    UNION SELECT qTwoID AS stringID FROM questions"
                + "    UNION SELECT qThreeID AS stringID FROM questions"
                + "    UNION SELECT qFourID AS stringID FROM questions"
                + "    UNION SELECT commentTextID AS stringID FROM comments);"
            db.run(sql,function(err){
                if (err) console.log("Error in purgeStrings(): "+err);
            })
        };

        function showUrl () {
            purgeStrings();
            db.all('SELECT adminID,name,adminKey,role FROM admin',[],function(err,rows){
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    
                    var port = ':' + config.real_port;
                    if (config.proxy_hostname.match(/.*\..*/)
                        && config.proxy_hostname !== '127.0.0.1') {

                        port = '';
                    }

                    if (row.name === 'admin') {
                        console.log("Admin URL: http://" + config.proxy_hostname + port + '/?admin=' + row.adminKey);
                    }
                    config.admin[row.adminKey] = {name:row.name,role:row.role,id:row.adminID,sched:null};
                    if (row.role == 1) {
                        console.log("Adding admin role");
                    } else if (row.role == 2) {
                        console.log("Adding commenter '" + row.name + "' with URL http://" + config.proxy_hostname + port + '/?commenter=' + row.adminKey);
                    }
                }
                // Emit an event to say the DB is ready and waiting
                eventEmitter.emit('databaseIsReady',db);
            });
            db.all('SELECT classID,studentID,studentKey FROM memberships',[],function(err,rows){
                for (var i=0,ilen=rows.length;i<ilen;i+=1) {
                    var row = rows[i];
                    var mk = config.membershipKeys;
                    if (!mk[row.classID]) {
                        mk[row.classID] = {};
                    }
                    if (!mk[row.classID][row.studentID]) {
                        mk[row.classID][row.studentID] = {};
                    }
                    mk[row.classID][row.studentID] = row.studentKey;
                }
                console.log("Loaded class membership keys");
            });
        };

        function getRandomKey(len, base) {
            // Modified from http://jsperf.com/random-md5-hash-implementations
            len = len ? len : 16;
            base = base ? base : 16;
            var _results;
            _results = [];
            for (var i=0;i<len;i+=1) {
                _results.push((Math.random() * base | 0).toString(base));
            }
            return _results.join("");
        };
        this.config.getRandomKey = getRandomKey;
        this.config.db = db;
    };
    initClass.prototype.getInit = function () {
        return this.config;
    };
    exports.initClass = initClass;
})();

