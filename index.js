const fs = require("fs");
const S3 = require("aws-sdk").S3;
const express = require("express");
args = process.argv.slice(2);

const metadata = {
	"ila": {
		name: "Introduction to Linear Algebra (MATH08057)",
		lecturers: "Chris Sangwin, Pamela Docherty"
	},
	"cl": {
		name: "Computation and Logic (INFR08012)",
		lecturers: "Michael Fourman"
	},
	"fp": {
		name: "Functional Programming (INFR08013)",
		lecturers: "Don Sanella"
	}
}
const buckets = new S3({
	endpoint: "https://nyc3.digitaloceanspaces.com/",
	accessKeyId: fs.readFileSync(__dirname + "/key.txt").toString().slice(0, -1),
	secretAccessKey: fs.readFileSync(__dirname + "/secret.txt").toString().slice(0, -1),
	region: "US"
});
var apiData = {};
createApiData = function () {
	var prom = new Promise((resolve, reject) => {
		buckets.listObjects({
			Bucket: "lectures"
		}, (err, data) => {
			if (err) reject(err);
			else resolve(data.Contents);
		})
	}).then(function (data) {
		var newApiData = {};
		for (var ii = 0; ii < data.length; ii++) {
			var pattern = RegExp(/^([^\/]+)\/([^\/]+)\/(.+)$/g);
			var match = pattern.exec(data[ii].Key);
			if (match === null) continue;
			if (newApiData[match[1]] === undefined) {
				newApiData[match[1]] = metadata[match[1]];
				newApiData[match[1]].lectures = {};
			}
			var url = match[1] + "/" + match[2];
			if (newApiData[match[1]].lectures[url] === undefined) newApiData[match[1]].lectures[url] = 1;
			else newApiData[match[1]].lectures[url]++;
		}
		apiData = newApiData;
	});
	return prom;
}
createApiData();
setInterval(createApiData, 600000);

const app = express();
app.all("/data", (req, res) => {
	res.status(200);
	res.json(apiData);
	res.end();
});
app.use(express.static(__dirname + "/static"));
if (process.argv.indexOf("-d") !== -1) app.listen(8080);
else exports = module.exports = app;
