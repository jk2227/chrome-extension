var ACTIVATED = false; 

var myTabId = -1;
var first_loaded = true

function navigate(request, sender, callback) {
	//alert(request.url);
	if (myTabId == -1) {
		if (request.newTab) {
			chrome.tabs.create({url:request.url, active:true}, function(tab){myTabId = tab.id;});
			chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
				if (tabId == myTabId) {
					myTabId = -1;
					first_loaded = true
					//alert("closed!");
					chrome.tabs.sendMessage(tab.id, {"activated": false});
				}
			});
		} 
	} else {
		chrome.tabs.update(myTabId, {url: request.url});
	}
}

chrome.runtime.onMessage.addListener(navigate);

chrome.browserAction.onClicked.addListener(function(tab) {
	
	//alert(myTabId);
	
	// In case our extension failed to track the event that our tab is closed,
	// this will check if our recommendation page exists.
	if (myTabId != -1) {
		chrome.tabs.get(myTabId, function(t) {
			if (chrome.runtime.lastError) {
				// tab does not exist
				myTabId = -1;
				first_loaded = true
				chrome.tabs.sendMessage(tab.id, {"activated": false});
			}
		});
	}
	
    if (myTabId != -1) {
		// Unselect currently selected tab
		chrome.tabs.query({ active: true }, function(tabs) {
			if (tabs.length > 0) {
				chrome.tabs.update(tabs[0].id, {highlighted: false});
			}
		});
		// select the recommendation tab
		chrome.tabs.update(myTabId, {highlighted: true});
	} else {
		alert("about to open new tab");
		navigate({url:"http://www3.nhk.or.jp/news/easy/", "newTab":true});
		chrome.tabs.onUpdated.addListener(function(tabId, changeinfo, tab) {
			if (tabId == myTabId && changeinfo.status == "complete" && first_loaded) {
				alert("loaded");
				first_loaded = false;
				chrome.tabs.sendMessage(tab.id, {"activated": true});
			}
		});
		//chrome.tabs.sendMessage(tab.id, {"activated": true});
	}
	
  
});
