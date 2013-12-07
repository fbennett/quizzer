fs = require('fs');
csv = require('csv');
http = require('http');

// Subdirs to be created if necessary
var dirs = ['answer', 'ids', 'quiz'];

// Files to be created if necessary
var files = ['students', 'classes']

// Internal access maps
var admin = {};
var students = {};
var classes = {};

// make data dirs as required
for (var i=0,ilen=dirs.length;i<ilen;i+=1) {
    var dir = dirs[i];
    try {
        fs.mkdirSync(dir);
    } catch (e) {} 
}

// To get a random key or random student ID, when needed in initializing data files
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
}

// Also initialise students.csv and classes.csv here
try {
    fs.openSync('./ids/admin.csv', 'r')
} catch (e) {
    if (e.code === 'ENOENT') {
        if (process.argv.length === 3) {
            var lst = [process.argv[2], getRandomKey()];
            csv().to('./ids/admin.csv').write(lst);
        } else {
            throw "ERROR: Must provide admin name as a single argument at first startup";
        }
    } else {
        throw e;
    }
}
for (var i=0,ilen=2;i<ilen;i+=1) {
    try {
        fs.openSync('./ids/' + files[i] + '.csv', 'r')
    } catch (e) {
        if (e.code === 'ENOENT') {
            csv().to('./ids/' + files[i] + '.csv').write([]);
        } else {
            throw e;
        }
    }
}

function runServer() {
    console.log("XXX And finally, spin up the server in all its glory ...");
    http.createServer(function (request, response) {

        // Stuff that will be needed

        // To call a requested admin page (default is top)
        // To perform the various admin operations after key validation
        // To call the quiz page on a student and course
        // To save the final data from a quiz after key validation

        console.log("request received", 5);
    }).listen(3498);
    console.log("Listening on port 3498");
}

function loadClasses() {
    // To instantiate course membership rosters
    console.log("XXX And next, load classes, if any ...");
    runServer();
}

function loadStudents() {
    // To instantiate student authentication data
    for (var key in admin) {
        console.log("Whatcha got? "+key+" "+admin[key]);
    }
    console.log("XXX Next, load students, if any ...");
    loadClasses();
}

function loadAdmin() {
    csv()
        .from.stream(fs.createReadStream('./ids/admin.csv'))
        .on ('record', function (row,index) {
            admin[row[1]] = row[0];
            console.log("Admin URL for "+row[0]+": http://localhost:7943?admin="+row[1]);
        })
        .on('end', function(count){
            loadStudents();
        })
        .on('error', function (e) {
            throw e;
        });
}

// Setup
loadAdmin();

