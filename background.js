var ACTIVATED = false; 

var myTabId = -1;

var LIMIT = 39; 


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Monitor user activities that could make myTabId invalid

// Monitor the activity that user closes our tab
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	if (tabId == myTabId) {
		
		chrome.storage.local.set({ "activated_language_learning": false}, function() {
			myTabId = -1;
		});
	}
});

// Monitor the activity that user mannually changes the url of our tab
// This activity should be treated as if our tab is closed.
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (tabId == myTabId && "url" in changeInfo) {
		
		//alert("URL Changed");
		chrome.storage.local.get(["doc_id", "sequence_id"], function(obj) {
			if (obj == null || !('doc_id' in obj)) {
				url1 = "";
			} else {
				id = obj["doc_id"].substr(0,15); 
				url1 = 'http://www3.nhk.or.jp/news/easy/' + id + '/' + id + '.html'
			}
			url2 = chrome.extension.getURL('welcome_page.htm');
			url3 = chrome.extension.getURL('final_page.htm');	
			url4 = 'http://www3.nhk.or.jp/news/easy/'
			
			// Matching the url with "valid" urls: current document url, urls of welcome/final page and nhk easy homepage
			if (url1 != tab.url && url2 != tab.url && url3 != tab.url && url4 != tab.url) {
				chrome.storage.local.set({ "activated_language_learning": false}, function() {
					myTabId = -1;
				});				
			}
		});
	}
});

// If you found any other user activity that could make myTabId invalid, minitor it here.

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
	} else {
		// Note that here if myTabId == -1 the code will do nothing instead of update the current tab.
		// This is safer: If our extension fails to track myTabId, at least we should not modify the tab that the user is viewing.
		if (myTabId != -1) {
			chrome.tabs.update(myTabId, {url: request.url});
		}
	}
}

chrome.runtime.onMessage.addListener(navigate);

chrome.browserAction.onClicked.addListener(function(tab) {
	
    if (myTabId != -1) {  
		
		// Unselect currently selected tab and select our recommendation tab
		
		chrome.tabs.query({ active: true }, function(tabs) {
			if (tabs.length > 0) {
				chrome.tabs.update(tabs[0].id, {highlighted: false});
			}
		});
		chrome.tabs.update(myTabId, {highlighted: true});	
		
	} else {
		
		// Start a new tab
	
		chrome.storage.local.get(["doc_id", "sequence_id"], function(obj) {
		
			// Following line sets myTabId to the id of current tab, which does not make sense to me.
			//myTabId = tab.id;
			
			//if (obj == null) {
			//	navigate({"url": "http://www3.nhk.or.jp/news/easy/", "newTab":true}); 
			//}

			// As I see, when obj is null, we should init with welcome page
			// So I commented out the lines above and added a condition here.
			var needsInit = obj == null || !('doc_id' in obj) || !('sequence_id' in obj) || obj['sequence_id'] == 0 || obj['sequence_id'] >= LIMIT;

			if (needsInit) {
				
				// Start a tab with welcome page
				chrome.storage.local.set({ "activated_language_learning": true}, function() {
					var url = chrome.extension.getURL('welcome_page.htm');
					navigate({"url": url, "newTab":true});
				});
			} else { 
				// i moved the code below into "else" in order to avoid opening a welcome page and a document page at the same time.
				id = obj["doc_id"].substr(0,15); 				
				url = 'http://www3.nhk.or.jp/news/easy/' + id + '/' + id + '.html'

				chrome.storage.local.set({ "activated_language_learning": true}, function() {
					navigate({"url": url, "newTab":true});
				});
			}
		});
	}
});
