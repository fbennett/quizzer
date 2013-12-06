fs = require('fs');

// Functions needed ...
// To instantiate admin authentication data
// To instantiate student authentication data
// To instantiate course membership rosters
// To call a requested admin page (default is top)
// To perform various admin operations after key validation
// To call the quiz page on a student and course
// To perform the final save and marking of a quiz after key validation

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
