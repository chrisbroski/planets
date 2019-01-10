/*jshint esversion: 6 */
var cp = require("child_process");
var fs = require("fs");

var http = require('http'),
    port = 3880;

http.createServer(function (req, rsp) {
    var seed = parseInt(req.url.slice(1));
    if (seed && seed < 2000000000) {
        starGen(rsp, seed);
    } else {
        rsp.writeHead(400, {'Content-Type': 'text/plain'});
        rsp.end('URL must look like: "/1234567890" (an integer between 0 and 2,000,000,000)');
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

        rsp.writeHead(200, {'Content-Type': 'application/json'});
        rsp.end(JSON.stringify(data, null, "    "));
    });
}

function starGen(rsp, seed) {
    var cmd = `stargen -s${seed} -g -M -e `;
    console.log(cmd);
    cp.exec(
        cmd,
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
