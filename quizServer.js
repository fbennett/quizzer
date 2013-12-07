fs = require('fs');
csv = require('csv');

var dirs = ['answer', 'ids', 'quiz'];

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

function loadStudents() {
    for (var key in admin) {
        console.log("Whatcha got? "+key+" "+admin[key]);
    }
    console.log("XXX Next, load students, if any ...");
}

function loadClasses() {
    console.log("XXX And next, load classes, if any ...");
}

function runServer() {
    console.log("XXX And finally, spin up the server in all its glory ...");
}

var admin = {};
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

// Functions needed ...


// To instantiate admin authentication data
//   * just bundle the object to JS


// To instantiate student authentication data
// To instantiate course membership rosters
// To call a requested admin page (default is top)
// To perform various admin operations after key validation
// To call the quiz page on a student and course
// To perform the final save and marking of a quiz after key validation


