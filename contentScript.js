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
    //$(document.body).append("<div class='overlay'></div>");
    targetText = response["text"]; 
    addTagToText(targetText);
    $("#newsarticle").append("<div class='overlay'></div>");
    $("#side").append("<div class='overlay'></div>");
    //$("#main_enqdiv").append("<div class='overlay'></div>");
    //$("#enq_bt_answer").append("<div class='overlay'></div>");
    //blurOutText(targetText);
    $("#targetText").append("<span class='popuptext' id='myPopup'> <i> Do you understand this sentence? </i> <br> <button type='button' class='yesButton' id='yesButtonId'> Yes </button> <button type='button' class='noButton' id='noButtonId'> No </button> </span>");
    //$('popuptext').css('z-index','99999');
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

function blurOutText(targetText) {
  $( "*" ).each(function(index) {
    var str = $(this).text();
    if (str.includes(targetText)) {
      $("notTargetText").foggy();
    } else {
      $(this).foggy();
    }
  });
}

function addTagToText(text) {
  console.log(text)
  found = false;
  $( "#newsarticle p" ).each(function(index) {
    var currentText = $(this).text();
    var currentHTML = $(this).html();
    if (currentText != null && currentHTML != null && currentText.length > 0 && currentHTML.length > 0) { 
      var parsedText = parseText(currentHTML, currentText); 
      if (parsedText.includes(text)) {
        console.log("Parsed text");
        console.log(parsedText);
        console.log("Current HTML");
        console.log(currentHTML);
        var newHtmlElement = parsedText.replace(text, '</notTargetText><span id="targetText" class="targetText"><b><u>' + currentHTML + '</u></b></span><notTargetText>');
        newHtmlElement = '<notTargetText>' + newHtmlElement + '</notTargetText>';
        console.log("new html element");
        console.log(newHtmlElement);
        $(this).html(newHtmlElement);
        found = true;
      }
    }
  });

  if (!found) {
    $("#newsarticle").empty()
    $("#newsarticle").append('<p></p>')
    $("#newsarticle p").html('<span id="targetText" class="targetText"><b><u>' + text + '</u></b></span>');
  }
/*
  newsarticleHtml = $("#newsarticle").html();
  newsarticleText = $("#newsarticle").text(); 
  newsarticleNoFurigana = parseText(newsarticleHtml, newsarticleText).split('\n').filter(function(x) { 
    return x.length > 0 }).join(" "); 
  console.log("NEWS ARTICLE NO FURIGANA");
  console.log(newsarticleNoFurigana);
  console.log(newsarticleNoFurigana.includes(text));
  if (newsarticleNoFurigana.includes(text)) {
    var newHtmlElement = newsarticleNoFurigana.replace(text, '</notTargetText><span id="targetText" class="targetText"><b><u>' + text + '</u></b></span><notTargetText>');
    newHtmlElement = '<notTargetText>' + newHtmlElement + '</notTargetText>';
    $(this).html(newHtmlElement);
  } */
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