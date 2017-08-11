var ACTIVATED = false; 

chrome.browserAction.onClicked.addListener(function(tab) {
    ACTIVATED = !ACTIVATED; 
    if (ACTIVATED) {
    	chrome.browserAction.setBadgeBackgroundColor({"color":[255,0,0,255]});
    	chrome.browserAction.setBadgeText({"text":"On"});
    } else {
    	chrome.browserAction.setBadgeBackgroundColor({"color":[0,0,0,0]});
    	chrome.browserAction.setBadgeText({"text":""});
    }
   
   chrome.tabs.sendMessage(tab.id, {"activated": ACTIVATED});
});
