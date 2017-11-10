//This is a sample command to enter into the browser command line to generate wget commands for the shell.
var videos = Array.from(document.getElementsByTagName("video"));
var res = "";
for (var ii in videos) res += "wget -O \"yymmdd|name|" + ii + "\" \"" + videos[ii].src + "\"\n\n";
console.log(res);
