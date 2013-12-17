// Subdirs to be created if necessary
var dirs = ['answer', 'ids', 'question', 'barcodes'];
for (var i=0,ilen=dirs.length;i<ilen;i+=1) {
    var dir = dirs[i];
    try {
        fs.mkdirSync(dir);
    } catch (e) {} 
}

// Initialise students.csv and classes.csv if necessary
try {
    fs.openSync('./ids/admin.csv', 'r')
} catch (e) {
    if (e.code === 'ENOENT') {
        var lst = ['Admin', getRandomKey(8, 36)];
        csv().to('./ids/admin.csv').write(lst);
    } else {
        throw e;
    }
}

// Files to be created if necessary
var files = ['students', 'classes', 'memberships']
for (var i=0,ilen=files.length;i<ilen;i+=1) {
    try {
        var fh = fs.openSync('./ids/' + files[i] + '.csv', 'r');
        fs.close(fh);
    } catch (e) {
        if (e.code === 'ENOENT') {
            csv().to('./ids/' + files[i] + '.csv').write([]);
        } else {
            throw e;
        }
    }
}
