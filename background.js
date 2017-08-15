var ACTIVATED = false; 

var myTabId = -1;

var LIMIT = 39; 

function navigate(request, sender, callback) {
	if (request.newTab) {
			chrome.tabs.create(
				{
					url:request.url, 
					active:true
				}, 
				function(tab){
					myTabId = tab.id;
				}
			);
			chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
				myTabId = -1;
			});
	} else {
		if (myTabId == -1) {
			myTabId = null;
		}
		chrome.tabs.update(myTabId, {url: request.url}, function(t) {
			myTabId = t.id;
		});
	}
}

chrome.runtime.onMessage.addListener(navigate);

chrome.browserAction.onClicked.addListener(function(tab) {
	
	// In case our extension failed to track the event that our tab is closed,
	// this will check if our recommendation page exists.
	if (myTabId != -1) {
		chrome.tabs.get(myTabId, function(t) {
			if (chrome.runtime.lastError) {
				// tab does not exist
				myTabId = -1;
				chrome.tabs.sendMessage(tab.id, {"activated": false});
			}

			chrome.storage.local.get("doc_id", function(obj) {
				if (obj == null) {
					return; 
				}
				id = obj["doc_id"].substr(0,15); 
				url = 'http://www3.nhk.or.jp/news/easy/' + id + '/' + id + '.html'

				if (url != t.url) {
					myTabId = -1; 
					navigate({"url": url, "newTab":true});
				}

			});
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
		chrome.storage.local.get(["doc_id", "sequence_id"], function(obj) {
				myTabId = tab.id;
				if (obj == null) {
					navigate({"url": "http://www3.nhk.or.jp/news/easy/", "newTab":true}); 
				}

				var needsInit = !('doc_id' in obj) || !('sequence_id' in obj) || obj['sequence_id'] == 0 || obj['sequence_id'] >= LIMIT;

				if (needsInit) {
					var url = chrome.extension.getURL('welcome_page.htm');
					navigate({"url": url, "newTab":true});
				}
				id = obj["doc_id"].substr(0,15); 
				url = 'http://www3.nhk.or.jp/news/easy/' + id + '/' + id + '.html'

				if (url != tab.url) {
					navigate({"url": url, "newTab":true});
				} 
			});
	}
	
  
});
