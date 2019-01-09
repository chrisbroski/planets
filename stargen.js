var cp = require("child_process");
var fs = require("fs");
// var mass = "1.5";
// var seed = "AB123456";

var http = require('http'),
    port = 3880;

function isValid(url) {
    // console.log(url.indexOf("-"));
    if (url.indexOf("-") !== 3) {
        return false;
    }
    return true;
}

http.createServer(function (req, rsp) {
    var disk;
    if (isValid(req.url)) {//NU-4496/0.588
        disk = req.url.split("/");
        console.log(disk);
        starGen(rsp, parseFloat(disk[2]), disk[1]);
    } else {
        rsp.writeHead(200, {'Content-Type': 'text/plain'});
        rsp.end('URL must look like: "AA-1234/1.234" (2 letters, a dash, 1-4 digits, a slash and floating-point number from 0.500 to 1.500)');
    }
}).listen(port, function () {
    console.log('Server started on port :' + port);
});

function scrubQuotes(val) {
    if (!val) {
        return '';
    }
    if (val.slice(0, 1) === "'" && val.slice(-1) === "'") {
        val = val.slice(1, val.length - 1);
    } else {
        if (val.indexOf(".") >= 0) {
            val = parseFloat(val);
        } else {
            val = parseInt(val, 10);
        }
    }
    return val;
}

function planetRow(header, values) {
    var row = {};
    header.forEach(function (h, ii) {
        row[h] = scrubQuotes(values[ii]);
    });
    return row;
}

function readPlanetCsv(rsp) {
    fs.readFile('StarGenSource/html/StarGen.csv', 'utf8', function(err, contents) {
        var rows = contents.split("\n");
        var data = {"planets": []};
        var header1 = rows[0].split(", ");
        var values1 = rows[1].split(", ");
        header1.forEach(function (h, ii) {
            data[scrubQuotes(h)] = scrubQuotes(values1[ii]);
        });
        var ii, len = rows.length - 1;
        var header2 = rows[2].split(", ");
        var planetHeader = header2.map(function (h) {
            return scrubQuotes(h);
        });
        for (ii = 3; ii < len; ii += 1) {
            data.planets.push(planetRow(planetHeader, rows[ii].split(", ")));
        }
        // console.log(data);

        rsp.writeHead(200, {'Content-Type': 'application/json'});
        rsp.end(JSON.stringify(data, null, "    "));
    });
}

function starGen(rsp, mass, seed) {
    cp.exec(
        './stargen -m' + mass + ' -s' + seed + ' -g -M -e "' + seed + '/' + mass.toPrecision(3) + '"',
        {cwd: 'StarGenSource'},
        function (error, stdout, stderr) {
            if (!error) {
                readPlanetCsv(rsp);
            } else {
                console.log(error);
            }
        }
    );
}
