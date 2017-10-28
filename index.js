const sqlite3 = require("sqlite3");
const express = require("express");
args = process.argv.slice(2);

const db = new sqlite3.Database(__dirname + "/app.db");
const app = express();
app.all("/data", (req, res) => {
	res.status(200);
	db.all("SELECT *, courses.name AS courseName FROM courses, lectures WHERE courses.id = lectures.courseId", (function (res, err, data) {
		res.json(data);
		res.end();
	}).bind(this, res))
});
app.use(express.static(__dirname + "/static"));

if (process.argv.indexOf("-d") !== -1) app.listen(8080);
else exports = module.exports = app;
