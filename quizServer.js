fs = require('fs');
csv = require('csv');

// Functions needed ...

// To instantiate admin authentication data
//   * just bundle the object to JS


// To instantiate student authentication data
// To instantiate course membership rosters
// To call a requested admin page (default is top)
// To perform various admin operations after key validation
// To call the quiz page on a student and course
// To perform the final save and marking of a quiz after key validation

// To get a random key, when needed in initializing student data
function getRandomKey() {
  // Borrowed from http://jsperf.com/random-md5-hash-implementations
  var _results;
  _results = [];
  for (var i=0;i<16;i+=1) {
    _results.push((Math.random() * 16 | 0).toString(16));
  }
  return _results.join("");
}



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
