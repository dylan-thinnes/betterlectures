var Course = function (id, name, entries, showCallback, hideCallback) {
	this.showCallback = showCallback ? showCallback : () => {};
	this.hideCallback = hideCallback ? hideCallback : () => {};
	this.entries = entries;
	this.node = document.createElement("a");
	this.node.addEventListener("click", this.toggle.bind(this));
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
	this.showing = true;
	this.showCallback(this.entries);
}
Course.prototype.hide = function () {
	this.node.style.backgroundColor = "";
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
		window.open("https://lectures.nyc3.digitaloceanspaces.com/" + this.course + "/" + this.date + this.trueName + "/" + ii);
	}
}


var OrderedList = function () {
	this.value = [];

}
OrderedList.prototype.toggleKey = function (key) {
	if (this.value.indexOf(key) !== -1) this.removeKey(key);
	else this.addKey(key);
}
OrderedList.prototype.addKey = function (key) {
	var index = this.findOrderedIndex(key);
	if (index !== -1) this.value.splice(index, 0, key);
}
OrderedList.prototype.removeKey = function (key) {
	var index = this.value.indexOf(key);
	if (index !== -1) this.value.splice(index, 1);
}
OrderedList.prototype.findOrderedIndex = function (key) {
	if (this.value.indexOf(key) !== -1) return -1;
	subsetLeft = 0;
	subsetRight = this.value.length;
	while (subsetLeft !== subsetRight) {
		var checkKey = this.value[subsetLeft + Math.floor((subsetRight - subsetLeft) / 2)];
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
		this.infoNode.innerHTML = "<span style=\"font-size: 14pt; font-weight: bold;\">Lecture Title: " + lecture.name + "</span><br/>Course: " + lecture.course.toUpperCase() + "<br/>Date Recorded: " + lecture.date + "<br/><div class=\"download\">Download This Lecture</div>";
		this.infoNode.children[4].addEventListener("click", lecture.open.bind(lecture));
	}
	this.deactivateLectures = function (lectures) {
		for (var ii = 0; ii < lectures.length; ii++) this.activeLectures.removeKey(lectures[ii]);
		this.renderLectures();
	}
	this.activateLectures = function (lectures) {
		for (var ii = 0; ii < lectures.length; ii++) this.activeLectures.addKey(lectures[ii]);
		this.renderLectures();
	}
	this.renderLectures = function () {
		var domStrings = [];
		for (var ii = 0; ii < this.activeLectures.value.length; ii++) {
			domStrings.push(this.lectures[this.activeLectures.value[ii]].domString());
		}
		this.lecturesNode.innerHTML = domStrings.join("");
		for (var ii = 0; ii < this.activeLectures.value.length; ii++) {
			this.lectures[this.activeLectures.value[ii]].initializeNodes();
		}
	}
	for (index in data) {
		this.courses[index] = new Course(index, data[index].name, Object.keys(data[index].data), this.activateLectures.bind(this), this.deactivateLectures.bind(this));
		this.coursesNode.appendChild(this.courses[index].node);
		for (var url in data[index].data) {
			this.lectures[url] = new Lecture(url, this.setInfo.bind(this), data[index].data[url]);
		}
	}
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

