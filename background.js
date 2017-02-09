chrome.browserAction.onClicked.addListener(function(tab) {
	// ping backend here
	//window.location = 'www3.nhk.or.jp/news/easy/k10010787761000/k10010787761000.html';
    chrome.tabs.sendMessage(tab.id, {"message": "help"});
});