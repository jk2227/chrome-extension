document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("agree").onclick = function(e) {
		e.preventDefault(); // Prevent submission
		chrome.storage.local.set({'sequence_id': 0}, function() {
			window.location.href = 'http://www3.nhk.or.jp/news/easy/';
		});
	};   
});