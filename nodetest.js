fs = require('fs');
o = {};
o.one = 1;
o.two = "2";
o.three = "THREE";
myo = JSON.stringify(o);
fs.writeFile("/tmp/test", myo, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved! "+ myo);
    }
});
