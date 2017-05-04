
// when clicking on the chrome extension,
// listener helps you navigate to 
// http://www3.nhk.or.jp/news/easy/
// if it is the case that you are already in NHK,
// the you will be alerted so 
chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  if (!hasStarted()) {
    window.location.href = 'http://www3.nhk.or.jp/news/easy/'
  } else {
    alert("You have already started!");
  }
});

// public IP for backend in EC2 
var EBURL = "http://107.23.217.246:5000"

// if we are on a URL that contains http://www3.nhk.or.jp/ and... 
// (1) we have just started and on http://www3.nhk.or.jp/news/easy/ 
// then we call the backend to retrieve a docId and then
// navigate to the corresponding page or 
// (2)we are already on a document of interest
// we check the cookies to check whether the user has UUID 
// in the cookies under "elanduid2"; if not, it sets it
// then we ping the backend to retrieve the text 
// within the article that we wish to highlight to the users
// afterwards, we scroll down to the div that would gauge
// a user's understanding
if (hasStarted()) {
  if (getCurrentDocId() == "easy") {
    var response = getId(); 
    navigate(response["doc_id"])
  } else {
    checkCookie();
    var response = getText(); 
    executeScript(response);
    $('html,body').animate({
        scrollTop: $("#myPopup").offset().top - 100},
        'slow');
  }
}

// checks whether URL contains http://www3.nhk.or.jp/
function hasStarted() {
  return window.location.href.indexOf("http://www3.nhk.or.jp/") > -1; 
}

// given a docId, navigates page to article corresponding to it
function navigate(docId) {
  window.location.href = 'http://www3.nhk.or.jp/news/easy/' + docId + '/' + docId + '.html'
}

// submit user response (true or false) to the backend
// and get the next document id 
function submitAnswerAndGetNext(userResponse) {
  checkCookie();

  var xhr2 = new XMLHttpRequest();
  xhr2.open("POST", EBURL + "/response/" + getCookie("elanduid2") + "/" +getCurrentDocId() + "/" + userResponse.toString(), false);
  xhr2.send();

  var xhr = new XMLHttpRequest();
  xhr.open("GET", EBURL + "/doc_id/" + getCookie("elanduid2") + "/", false);
  xhr.send();
  var nextDocId = xhr.responseText; 
  navigate(nextDocId)
}

// gets the id of the current document of interest
// if you are not on a document but on NHK 
// then this method will return 'easy'
function getCurrentDocId() {
  var currentUrl = window.location.href.split('/')
  return currentUrl[currentUrl.length - 2]
}
// calls backend to get the id of the URL 
// ignore k10010718561000 for now? 
function getId() {
  checkCookie();
  userId = getCookie("elanduid2"); 
  var xhr = new XMLHttpRequest();
  xhr.open("GET", EBURL + "/doc_id/" + userId + "/", false);
  xhr.send();
  var nextDocId = xhr.responseText; 
  return {"doc_id": nextDocId };
}

// pings the backend to retrieve the 
// text corresponding to the current document
function getText() {
  var docId = getCurrentDocId(); 

  var xhr = new XMLHttpRequest();
  xhr.open("GET", EBURL + "/text/"+ docId +"/", false);
  xhr.send();
  var text = xhr.responseText; 
  return {"text": text};
}

// this will vary depending on the site's structure
// blacks out everything except for the text of interest
function executeScript(response) {
  $(document).ready(function() {
    document.body.style.background = "black";
    $(".contentWrap").css('background', 'unset');
    $("#enq_answer_disp").css('background', 'unset');
    $("#enq_ansbak").css('background', 'unset');
    targetText = response["text"]; 
    addTagToText(targetText);
    $("#side").append("<div class='overlay'></div>");
    $("#targetText").append("<span class='popuptext' id='myPopup'> <i> Do you understand this passage? </i> <br> <button type='button' class='yesButton' id='yesButtonId'> Yes </button> <button type='button' class='noButton' id='noButtonId'> No </button> </span>");
    
    document.getElementById("yesButtonId").addEventListener("click", function() {
      submitAnswerAndGetNext(true)
    }, false);
    document.getElementById("noButtonId").addEventListener("click", function() {
      submitAnswerAndGetNext(false)
    }, false);

    $('.overlay').fadeIn(300);
    $('html,body').animate({
        scrollTop: $("#myPopup").offset().top - 100},
        'slow');
  });
}

// given a text, adds the text in a div with 
// id set as targetText
// 
// after trying differet ways to extract the text
// from the html setup of NHK, I did the following:
//
// I have a pointer to a chacater in the html, i, and 
// a pointer to a character in the text, indexOfText
//
// Every time I see the character '<', I start accumulating
// the characters up to '>' into tagName; if tagName is 
// 'rt' then those are furiganas, so we skip to the next 
// instance of '>' which would be the tag that closes the 
// rt tag; otherwise, I adjust i and indexOfText properly 
// to find the overlap with the first and last index of
// the overlap within the html; when the overlap is found,
// we open the div targetText in the first index and 
// close the div in the last index 
function addTagToText(text) {
  text = text.trim();
  var i = 0;
  var indexOfText = 0; 
  var firstIndex = 0;
  var lastIndex = 0;
  html = $("#newsarticle").html();
  while ( i < html.length && indexOfText < text.length) {
    if (html.charAt(i) == '<') {
        j = i +1;
        tagName = "";
        while (html.charAt(j) != '>') {
            tagName += html.charAt(j);
            j += 1
        }
        if (tagName == "rt") {
            j += 1
            while (html.charAt(j) != '>') {
                j += 1
            }
        }
        i = j + 1;
    } else if (html.charAt(i) == ' ' || html.charAt(i) == '\n') { 
        i += 1 
    } else if (text.charAt(indexOfText) == ' ') {
        indexOfText += 1 
    } else {
        if (text.charAt(indexOfText) == html.charAt(i)) {
          indexOfText += 1
        } else {
          indexOfText = 0; 
        }
        i += 1 
    }
  }

  lastIndex = i;
  var newHtml = html.substring(0, firstIndex) 
  newHtml += '<div id="targetText" class="targetText">';
  newHtml += html.substring(firstIndex, lastIndex);
  newHtml +=  '</div>'
  newHtml += html.substring(lastIndex);
  $("#newsarticle").html(newHtml);
}

// given the name and value of the cookie,
// we set the document cookie where the name 
// corresponds to the value for exdays number of days
function setCookie(cname,cvalue,exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

// given a cname, get the corresponding value stored
// in the cookie
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// checks whether 'elanduid2' is a key in your cookies
// if not pings the backend to generate a UUID for the 
// user, and stores that as the value for 'elanduid2' 
// in the cookie
function checkCookie() {
    var userid = getCookie("elanduid2");
    if (userid == "") {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", EBURL + "/get_uuid/", false);
      xhr.send();
      var uuid = xhr.responseText;
      setCookie("elanduid2", uuid, 60);
    }
}