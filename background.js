var ACTIVATED = false; 

var myTabId = -1;


chrome.runtime.onMessage.addListener(function(request, sender, callback) {
	//alert(request.url);
	if (myTabId == -1) {
		if (request.newTab) {
			chrome.tabs.create({url:request.url, active:true}, function(tab){myTabId = tab.id;});
			chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
				if (tabId == myTabId) {
					myTabId = -1;
					//alert("closed!");
					chrome.tabs.sendMessage(tab.id, {"activated": false});
				}
			});
		} 
	} else {
		chrome.tabs.update(myTabId, {url: request.url});
	}
});

chrome.browserAction.onClicked.addListener(function(tab) {
	
	//alert(myTabId);
	
	// In case our extension failed to track the event that our tab is closed,
	// this will check if our recommendation page exists.
	if (myTabId != -1) {
		chrome.tabs.get(myTabId, function(t) {
			if (chrome.runtime.lastError) {
				// tab does not exist
				myTabId = -1;
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
		//alert("about to send to content");
		chrome.tabs.sendMessage(tab.id, {"activated": true});
	}
	
  
});
