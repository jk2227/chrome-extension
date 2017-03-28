chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  console.log(request);
  if (!hasStarted()) {
    // ping backend to start
    //var response = getId(); 
    window.location.href = 'http://www3.nhk.or.jp/news/easy/'
    // window.location.href = 'http://www3.nhk.or.jp/news/easy/' + response["doc_id"] + '/' + response["doc_id"] + '.html' 
  } else {
    alert("You have already started!");
  }
});

var EBURL = "http://107.23.217.246:5000"

if (hasStarted()) {
  if (getCurrentDocId() == "easy") {
    var response = getId(); 
    navigate(response["doc_id"])
  } else {
    checkCookie();
    var response = getText(); 
    executeScript(response);
  }
}

function hasStarted() {
  return window.location.href.indexOf("http://www3.nhk.or.jp/") > -1; 
}

function navigate(docId) {
  window.location.href = 'http://www3.nhk.or.jp/news/easy/' + docId + '/' + docId + '.html'
}

function f(userResponse) {
  checkCookie();

  // to do: make current id globally accessible
  var xhr2 = new XMLHttpRequest();
  xhr2.open("POST", EBURL + "/response/" + getCookie("elanduid2") + "/" +getCurrentDocId() + "/" + userResponse.toString(), false);
  xhr2.send();
  //console.log(nextDocId)

  var xhr = new XMLHttpRequest();
  xhr.open("GET", EBURL + "/doc_id/" + getCookie("elanduid2") + "/", false);
  xhr.send();
  var nextDocId = xhr.responseText; 
  navigate(nextDocId)
}

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

function getText() {
  var docId = getCurrentDocId(); 

  var xhr = new XMLHttpRequest();
  xhr.open("GET", EBURL + "/text/"+ docId +"/", false);
  xhr.send();
  var text = xhr.responseText; 
  return {"text": text};

  // call on backend using docId to get the text
  // var xhr = new XMLHttpRequest();
  // xhr.open("GET", "http://www.domain.com?par=0", false);
  // xhr.send();
  // var result = xhr.responseText; 
  //return { "text": "新潟県関川村にある農場で２８日、ニワトリがたくさん死んでいるのが見つかりました。新潟県が調べると、死んだニワトリから鳥のインフルエンザのＨ５型のウイルスが見つかりました。" };  
}

function parseText(htmlString, text) {
  var re = /<rt>(.*?)<\/rt>/g
  var matchedToRegex = htmlString.match(re);
  var furiganas = matchedToRegex.map(function(x) { 
    var i = x.indexOf('>'); 
    var j = x.indexOf("</"); 
    return x.substring(i+1, j); 
  });
  var textNoFurigana = "";
  var furiganaIndex = 0;  
  while (furiganaIndex < furiganas.length) {
    var furigana = furiganas[furiganaIndex];
    var endIndex = text.indexOf(furigana); 
    textNoFurigana += text.substring(0, endIndex);
    text = text.substring(endIndex + furigana.length); 
    furiganaIndex += 1 
  } 
  textNoFurigana += text; 

  return textNoFurigana;
} 

function executeScript(response) {
  $(document).ready(function() {
    document.body.style.background = "black";
    $(".contentWrap").css('background', 'unset');
    // $(document.body).append("<div class='overlay'></div>");
    targetText = response["text"]; 
    addTagToText(targetText);
    // $("#newsarticle").css('background', "black")
    $("#side").append("<div class='overlay'></div>");
    $("#targetText").append("<span class='popuptext' id='myPopup'> <i> Do you understand this sentence? </i> <br> <button type='button' class='yesButton' id='yesButtonId'> Yes </button> <button type='button' class='noButton' id='noButtonId'> No </button> </span>");
    
    document.getElementById("yesButtonId").addEventListener("click", function() {
      f(true)
    }, false);
    document.getElementById("noButtonId").addEventListener("click", function() {
      f(false)
    }, false);

    $('.overlay').fadeIn(300);
    $('html,body').animate({
        scrollTop: $("#myPopup").offset().top},
        'slow');
  });
}

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

function setCookie(cname,cvalue,exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

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