const S3 = require("aws-sdk").S3;
const express = require("express");
args = process.argv.slice(2);

const names = {
	"ila": "Introduction to Linear Algebra",
	"cl": "Computation and Logic",
	"fp": "Functional Programming"
}
const buckets = new S3({
	endpoint: "https://nyc3.digitaloceanspaces.com/",
	accessKeyId: "MPTKL4HJFLNOUJYY2FAS",
	secretAccessKey: "X9J+r9hpHinzGzROuH1JYmNvQi42rPjf919DidFDuMI",
	region: "US"
});
const apiData = {};
createApiData = function () {
	new Promise((resolve, reject) => {
		buckets.listObjects({
			Bucket: "lectures"
		}, (err, data) => {
			if (err) reject(err);
			else resolve(data.Contents);
		})
	}).then(function (data) {
		var newApiData = {};
		regexStr = "^(";
		for (var index in names) {
			newApiData[index] = {name: names[index], data: []};
			regexStr += index + "|";
		}
		regexStr = regexStr.slice(0,-1) + ")\/";
		var matcher = new RegExp(regexStr);
		for (var ii = 0; ii < data.length; ii++) {
			var match = matcher.exec(data[ii].Key);
			if (match === null || match[0].length === data[ii].Key.length) continue;
			else match = match[1];
			newApiData[match].data.push(data[ii].Key);
		}
		apiData = newApiData;
	});
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
