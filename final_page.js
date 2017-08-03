document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("summary").innerHTML = "55"; // To Ji Hun: pass in user summary here！
	document.forms[0].onsubmit = function(e) {
		e.preventDefault(); // Prevent submission
		response = getRadio("japanese") + getRadio("difficulty") + getRadio("diversity") + getRadio("like");
		alert(response);   // To Ji Hun:  Save user response to DB here!
	};   
});

function getRadio(radio_name) {
	radios = document.getElementsByName(radio_name);
	for (i=0;i<radios.length;i++)
		if (radios[i].checked)
			return radios[i].value;
}