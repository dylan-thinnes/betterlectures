const fs = require("fs");
const sqlite3 = require("sqlite3");
var db = new sqlite3.Database("../app.db");
args = process.argv.slice(2);
const courseId = args[0];
if (args[1].slice(-1) === "/") var directory = args[1];
else var directory = args[1] + "/";
const delimit = args[2] ? args[2] : "|";
const files = fs.readdirSync(directory);
const s3key = fs.readFileSync("../key.txt").toString().slice(0,-1);
const s3sec = fs.readFileSync("../secret.txt").toString().slice(0,-1);
var data = {};
var uploadCommands = [];

db.get("SELECT id FROM courses WHERE id=$id", {$id: courseId}, function (err, res) {
	if (err) throw err;
	if (res === undefined || res.length === 0) db.run("INSERT INTO courses (id) VALUES ($id)", {$id: courseId});
	for (var ii = 0; ii < files.length; ii++) {
		var regex = RegExp("(\\d{6})\\" + delimit + "([^\\" + delimit + "]+)\\" + delimit + "([^\\" + delimit + "]+)");
		var match = regex.exec(files[ii]);
		if (match === null) continue;
		var date = match[1];
		var name = match[2];
		var fileRandId = Math.floor(Math.random() * Math.pow(2,32)).toString(16) + Math.floor(Math.random() * Math.pow(2,32)).toString(16) + Math.floor(Math.random() * Math.pow(2,32)).toString(16);
		if (data[date + name] === undefined) {
			var lectureRandId = Math.floor(Math.random() * Math.pow(2,32)).toString(16) + Math.floor(Math.random() * Math.pow(2,32)).toString(16) + Math.floor(Math.random() * Math.pow(2,32)).toString(16);
			data[date + name] = {
				$id: lectureRandId,
				$date: date,
				$name: name,
				endpoints: [fileRandId],
				$courseId: courseId
			}
			data[date + name].$endpoints = JSON.stringify(data[date + name].endpoints);
		} else {
			data[date + name].endpoints.push(fileRandId); 
			data[date + name].$endpoints = JSON.stringify(data[date + name].endpoints);
		}
		uploadCommands.push("s3cmd --access_key=" + s3key + " --secret_key=" + s3sec + " put \"" + directory + files[ii] + "\" s3://lectures/" + fileRandId);
	}
	for (var index in data) {
		delete data[index].endpoints;
		db.run("DELETE FROM lectures WHERE name=$name AND date=$date AND courseId=$courseId", {$name: data[index].$name, $date: data[index].$date, $courseId: data[index].$courseId});
		db.run("INSERT INTO lectures (id, name, date, endpoints, courseId) VALUES ($id, $name, $date, $endpoints, $courseId)", data[index]);
	}
	uploadCommands.push("s3cmd --access_key=" + s3key + " --secret_key=" + s3sec + " setacl s3://lectures/ --acl-public --recursive");
	fs.writeFileSync("commands.sh", uploadCommands.join("\n"));
});


