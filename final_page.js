// public IP for backend in EC2 
var EBURL = "http://ec2-52-23-243-230.compute-1.amazonaws.com:5000"

document.addEventListener('DOMContentLoaded', function () {
	chrome.storage.local.get('user_summary', function(b) {
		document.getElementById("summary").innerHTML = b['user_summary']
	})
	document.forms[0].onsubmit = function(e) {
		e.preventDefault(); // Prevent submission
		response = getRadio("japanese") + getRadio("difficulty") + getRadio("diversity") + getRadio("like");
		chrome.storage.local.get(['user_id', 'jrec', 'session_id'], function(d) {
			d['responses'] = response
			$.ajax({
                 type: 'POST',
                 contentType: 'application/json',
                 processData: false, 
                 traditional: true,
                 data: JSON.stringify(d),
                 url: EBURL + '/record_user/',
                 success: function (f) {
                 	chrome.storage.local.set({
                      'jrec': f['jrec'], 
                      'doc_id': f['doc_id'],
                      'text': f['text'],
                      'info': f['info'],
                      'sequence_id': 0,
                      'session_id': f['session_id'],
                      'activated_language_learning': false
                    }, function() {
                      alert("Thank you!");
                      window.close();
                    });
                },
                  error: function(error) {
                    console.log(error);
                  }
                });
		});
	};   
});

function getRadio(radio_name) {
	radios = document.getElementsByName(radio_name);
	for (i=0;i<radios.length;i++)
		if (radios[i].checked)
			return radios[i].value;
	return "0";
}