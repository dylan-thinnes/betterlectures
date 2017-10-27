const S3 = require("aws-sdk").S3;
const express = require("express");
args = process.argv.slice(2);

const names = {
	"ila": "Introduction to Linear Algebra (MATH08057)",
	"cl": "Computation and Logic (INFR08012)",
	"fp": "Functional Programming (INFR08013)"
}
const buckets = new S3({
	endpoint: "https://nyc3.digitaloceanspaces.com/",
	accessKeyId: "MPTKL4HJFLNOUJYY2FAS",
	secretAccessKey: "X9J+r9hpHinzGzROuH1JYmNvQi42rPjf919DidFDuMI",
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
			console.log(data[ii].Key, match);
			if (match === null) continue;
			if (newApiData[match[1]] === undefined) newApiData[match[1]] = {name: names[match[1]], data: {}};
			var url = match[1] + "/" + match[2];
			if (newApiData[match[1]].data[url] === undefined) newApiData[match[1]].data[url] = 1;
			else newApiData[match[1]].data[url]++;
		}
		apiData = newApiData;
	});
	return prom;
}
createApiData();
setInterval(createApiData, 600000);

const app = express();
app.all("/data", (req, res) => {
	createApiData().then(() => {
		res.status(200);
		res.json(apiData);
		res.end();
	});
});
app.use(express.static(__dirname + "/static"));
if (process.argv.indexOf("-d") !== -1) app.listen(8080);
else exports = module.exports = app;
