var Course = function (id, name, lecturers, entries, showCallback, hideCallback) {
	this.showCallback = showCallback ? showCallback : () => {};
	this.hideCallback = hideCallback ? hideCallback : () => {};
	this.entries = entries;
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
Course.prototype.toggle = function () {
	if (this.showing === false) this.show();
	else this.hide();
}
Course.prototype.show = function () {
	this.node.style.backgroundColor = "#ee9";
	this.checkbox.checked = true;
	this.showing = true;
	this.showCallback(this.entries);
}
Course.prototype.hide = function () {
	this.node.style.backgroundColor = "";
	this.checkbox.checked = false;
	this.showing = false;
	this.hideCallback(this.entries);
}

var Lecture = function (url, setInfo, indices) {
	this.setInfo = (function () { setInfo(this) }).bind(this);
	this.tempId = Math.floor(Math.random() * Math.pow(2,32)).toString(16);
	this.indices = indices;
	var match = (/^([^\/]+)\/(\d{6})(.*)/g).exec(url);
	this.course = match[1];
	this.trueName = match[3] ? match[3] : "";
	this.name = match[3] ? match[3] : "(unnamed)";
	this.date = match[2];
	this.url = "https://lectures.nyc3.digitaloceanspaces.com/" + url;
}
Lecture.prototype.addItem = function (index) {
	this.indices++;
}
Lecture.prototype.domString = function () {
	return "<div class=\"listItem\" id=\"" + this.tempId + "\">" + this.course.toUpperCase() + " - " + this.date + " - " + this.name + "</div>";
}
Lecture.prototype.initializeNodes = function () {
	document.getElementById(this.tempId).addEventListener("click", this.setInfo);
}
Lecture.prototype.open = function (e) {
	for (var ii = 0; ii < this.indices; ii++) {
		window.open("/display.html#" + JSON.stringify({"endpoint": this.course + "/" + this.date + this.trueName, "total": this.indices}));
	}
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


var UI = function (data) {
	this.lectures = {};
	this.courses = {};
	this.activeLectures = new OrderedList();
	this.coursesNode = document.getElementById("courses");
	this.lecturesNode = document.getElementById("lectures");
	this.infoNode = document.getElementById("info");
	this.setInfo = function (lecture) {
		if (lecture === undefined) {
			this.infoNode.innerHTML = "<div id=\"infoTitle\" style=\"font-size: 14pt; font-weight: bold;\">Lecture Title: <span style=\"color: #800 !important;\">(no lecture chosen)</span></div>Course: N/A<br/>Lecturer(s): N/A<br/>Date Recorded: N/A<br/>Video Sources: N/A<br/><div class=\"download\" style=\"color: #999 !important; background-color: transparent !important;\">Watch This Lecture in a New Tab</div>";
		} else {
			this.infoNode.innerHTML = "<div id=\"infoTitle\" style=\"font-size: 14pt; font-weight: bold;\">Lecture Title: " + lecture.name + "</div>Course: " + this.courses[lecture.course].name + "<br/>Lecturer(s): " + this.courses[lecture.course].lecturers + "<br/>Date Recorded: " + lecture.date + "<br/>Video Sources: " + lecture.indices + "<br/>";
			var download = document.createElement("div");
			download.innerHTML = "Watch This Lecture in a New Tab";
			download.className = "download";
			download.addEventListener("click", lecture.open.bind(lecture));
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
	for (index in data) {
		for (var url in data[index].lectures) {
			this.lectures[url] = new Lecture(url, this.setInfo.bind(this), data[index].lectures[url]);
		}
		this.courses[index] = new Course(index, data[index].name, data[index].lecturers, Object.keys(data[index].lectures), this.activateLectures.bind(this), this.deactivateLectures.bind(this));
		this.coursesNode.appendChild(this.courses[index].node);
	}
	this.setInfo();
}


var req = new XMLHttpRequest();
req.open("GET", "/data");
req.onreadystatechange = function () {
	if (req.readyState === 4 && req.status === 200) {
		var parsedJson = JSON.parse(req.response);
		window.ui = new UI(parsedJson);
	}
}
req.send();
