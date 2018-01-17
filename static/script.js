var Course = function (id, name, lecturers, showCallback, hideCallback) {
	this.showCallback = showCallback ? showCallback : () => {};
	this.hideCallback = hideCallback ? hideCallback : () => {};
	this.lectureIds = [];
	this.name = name;
	this.lecturers = lecturers;
	this.node = document.createElement("a");
	this.checkbox = document.createElement("input");
	this.checkbox.type = "checkbox";
	this.node.addEventListener("click", this.toggle.bind(this));
	this.node.appendChild(this.checkbox);
	this.node.appendChild(document.createTextNode(name));
	this.node.className = "listItem";
	this.toggle();
}
Course.prototype.addLectureId = function (lectureId) {
	this.lectureIds.push(lectureId);
	this.toggle();
	this.toggle();
}
Course.prototype.toggle = function () {
	if (this.showing === false) this.show();
	else this.hide();
}
Course.prototype.show = function () {
	this.node.style.backgroundColor = "#ee7";
	this.checkbox.checked = true;
	this.showing = true;
	this.showCallback(this.lectureIds);
}
Course.prototype.hide = function () {
	this.node.style.backgroundColor = "";
	this.checkbox.checked = false;
	this.showing = false;
	this.hideCallback(this.lectureIds);
}

var Lecture = function (id, data, setInfo) {
	this.setInfo = setInfo;
	this.id = id;
	this.endpoints = JSON.parse(data.endpoints);
	this.courseId = data.courseId;
	this.courseName = data.courseName;
	this.name = data.name ? data.name : "(unnamed)";
	this.date = data.date;
	this.lecturers = data.lecturers;
}
Lecture.prototype.show = function () {
	this.setInfo(this);
}
Lecture.prototype.domString = function () {
	return "<tr class=\"listItem\" id=\"" + this.id + "\"><td>" + this.courseId.toUpperCase() + "</td><td>" + this.date + "</td><td>" + this.name + "</td></tr>";
}
Lecture.prototype.initializeNodes = function () {
	document.getElementById(this.id).addEventListener("click", this.show.bind(this));
}
Lecture.prototype.sortString = function (sortBy) {
	//this.sortString = this.date + this.course + this.name;
	if (sortBy === "date") return this.date + this.course + this.name;
	else if (sortBy === "name") return this.name + this.date + this.course;
	else return this.course + this.date + this.name;
}


var OrderedList = function () {
	this.keys = [];
	this.values = [];
}
OrderedList.prototype.addKeyValue = function (key, value) {
	var index = this.findOrderedIndex(key);
	if (index !== -1) {
		this.keys.splice(index, 0, key);
		this.values.splice(index, 0, value);
	}
}
OrderedList.prototype.removeKey = function (key) {
	var index = this.keys.indexOf(key);
	if (index !== -1) {
		this.keys.splice(index, 1);
		this.values.splice(index, 1);
	}
}
OrderedList.prototype.findOrderedIndex = function (key) {
	if (this.keys.indexOf(key) !== -1) return -1;
	subsetLeft = 0;
	subsetRight = this.keys.length;
	while (subsetLeft !== subsetRight) {
		var checkKey = this.keys[subsetLeft + Math.floor((subsetRight - subsetLeft) / 2)];
		if (checkKey > key) subsetRight = subsetLeft + Math.floor((subsetRight - subsetLeft) / 2);
		else subsetLeft = subsetRight - Math.floor((subsetRight - subsetLeft) / 2);
	}
	return subsetLeft;
}


var Table = function (data) {
	this.lectures = {};
	this.courses = {};
	this.activeLectures = new OrderedList();
	this.coursesNode = document.getElementById("courses");
	this.lecturesNode = document.getElementById("lectures");
	this.infoNode = document.getElementById("info");
	this.setInfo = function (lecture) {
		if (lecture === undefined) {
			this.infoNode.innerHTML = "<div id=\"infoTitle\" style=\"font-size: 14pt; font-weight: bold;\">Lecture Title: <span style=\"color: #800 !important;\">(no lecture chosen)</span></div>Course: N/A<br/>Lecturer(s): N/A<br/>Date Recorded: N/A<br/>Video Sources: N/A<br/><a class=\"download\" style=\"color: #999 !important; background-color: transparent !important; cursor: not-allowed;\">Watch This Lecture</a>";
		} else {
			this.infoNode.innerHTML = "<div id=\"infoTitle\" style=\"font-size: 14pt; font-weight: bold;\">Lecture Title: " + lecture.name + "</div>Course: " + lecture.courseName + "<br/>Lecturer(s): " + lecture.lecturers + "<br/>Date Recorded: " + lecture.date + "<br/>Video Sources: " + lecture.endpoints.length + "<br/>";
			var download = document.createElement("a");
			download.innerHTML = "Watch This Lecture";
			download.href = "/display.html#" + JSON.stringify({"name": lecture.name, "endpoints": lecture.endpoints});
			download.className = "download";
			this.infoNode.appendChild(download);
		}
	}
	this.deactivateLectures = function (lecturesNames) {
		for (var ii = 0; ii < lecturesNames.length; ii++) this.activeLectures.removeKey(this.lectures[lecturesNames[ii]].sortString(this.sortBy));
		this.renderLectures();
	}
	this.activateLectures = function (lecturesNames) {
		for (var ii = 0; ii < lecturesNames.length; ii++) this.activeLectures.addKeyValue(this.lectures[lecturesNames[ii]].sortString(this.sortBy), this.lectures[lecturesNames[ii]]);
		this.renderLectures();
	}
	this.reorderLectures = function (sortBy) {
		this.sortBy = sortBy;
		for (var ii = 0; ii < this.activeLectures.keys.length; ii++) {
			var currLect = this.activeLectures.values[ii];
			this.activeLectures.removeKey(this.activeLectures.keys[ii]);
			this.activeLectures.addKeyValue(currLect.sortString(this.sortBy), currLect);
		}
		this.renderLectures();
	}
	this.renderLectures = function () {
		var domStrings = [];
		for (var ii = 0; ii < this.activeLectures.keys.length; ii++) {
			domStrings.push(this.activeLectures.values[ii].domString());
		}
		this.lecturesNode.innerHTML = domStrings.join("");
		for (var ii = 0; ii < this.activeLectures.keys.length; ii++) {
			this.activeLectures.values[ii].initializeNodes();
		}
	}
	for (var ii = 0; ii < data.length; ii++) {
		var lectureId = data[ii].id;
		var courseId = data[ii].courseId;
		this.lectures[lectureId] = new Lecture(lectureId, data[ii], this.setInfo.bind(this));
		if (this.courses[courseId] === undefined) {
			this.courses[courseId] = new Course(courseId, data[ii].courseName, data[ii].lecturers, this.activateLectures.bind(this), this.deactivateLectures.bind(this));
			this.coursesNode.appendChild(this.courses[courseId].node);
		}
		this.courses[courseId].addLectureId(lectureId);
	}
	this.setInfo();
}

var checkPassword = function (e) {
	var pass = document.getElementById("password").value;
	localStorage.setItem("password", pass);
	var passwordStatus = document.getElementById("passwordStatus");
	passwordStatus.innerHTML = "Checking password...";
	passwordStatus.style.color = "blue";
	var req = new XMLHttpRequest();
	req.open("GET", "/data?ts=" + Date.now().toString(36) + "&password=" + pass);
	req.onreadystatechange = function () {
		if (req.readyState === 4) {
			if (req.status === 200) {
				var parsedJson = JSON.parse(req.response);
				document.getElementById("passwordPage").style.display = "none";
				window.ui = new Table(parsedJson);
			} else {
				passwordStatus.innerHTML = "Password failed.";
				passwordStatus.style.color = "red";
			}
		}
	}
	req.send();
}
document.getElementById("submitPassword").addEventListener("click", checkPassword);
var password = localStorage.getItem("password");
if (password !== null && password !== "") {
	document.getElementById("password").value = password;
}
