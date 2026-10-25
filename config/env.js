// Author: Kondwani Phiri
var fs = require('fs');
var path = require('path');
var file = path.join(__dirname, '../.env');
if (fs.existsSync(file)) {
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach(function(line) {
    var match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || typeof process.env[match[1]] != 'undefined') return;
    var value = match[2];
    if ((value[0] == '"' && value[value.length - 1] == '"') ||
        (value[0] == "'" && value[value.length - 1] == "'")) value = value.slice(1, -1);
    process.env[match[1]] = value;
  });
}
