chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  console.log(request);
  if (!hasStarted()) {
    // ping backend to start
    var response = getId(); 
    window.location.href = 'http://www3.nhk.or.jp/news/easy/' + response["doc_id"] + '/' + response["doc_id"] + '.html' 
  } else {
    alert("You have already started!");
  }
});

if (hasStarted()) {
  var response = getText(); 
  executeScript(response);
}

function hasStarted() {
  return window.location.href.indexOf("http://www3.nhk.or.jp/") > -1; 
}

// calls backend to get the id of the URL 
function getId() {
  // var xhr = new XMLHttpRequest();
  // xhr.open("GET", "http://www.domain.com?par=0", false);
  // xhr.send();
  // var result = xhr.responseText; 
  return {"doc_id": "k10010787761000" };

}

function getText() {
  var currentUrl = window.location.href; 
  var splitUrl = currentUrl.split('/');
  var docIdIndex = splitUrl.length - 2;
  var docId = splitUrl[docIdIndex]; 

  // call on backend using docId to get the text
  console.log(docId);
  // var xhr = new XMLHttpRequest();
  // xhr.open("GET", "http://www.domain.com?par=0", false);
  // xhr.send();
  // var result = xhr.responseText; 

  return { "text": "新潟県関川村にある農場で２８日、ニワトリがたくさん死んでいるのが見つかりました。新潟県が調べると、死んだニワトリから鳥のインフルエンザのＨ５型のウイルスが見つかりました。" };  
}

function parseText(htmlString, text) {
  console.log(htmlString);
  console.log(text);
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
    $(document.body).append("<div id='overlay'></div>");
    targetText = response["text"]; 
    addTagToText(targetText);
    $("#newsarticle").append("<div id='overlay'></div>");
    //blurOutText(targetText);
    $("#targetText").append("<span class='popuptext' id='myPopup'> <i> Do you understand this sentence? </i> <br> <button type='button' class='yesButton' onclick='alert('Hello world!')''> Yes </button> <button type='button' class='noButton' onclick='alert('Hello world!')''> No </button> </span>");
    //$('popuptext').css('z-index','99999');
    $('#overlay').fadeIn(300);
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
  $( "#newsarticle p" ).each(function(index) {
    var currentText = $(this).text();
    var currentHTML = $(this).html();
    if (currentText != null && currentHTML != null && currentText.length > 0 && currentHTML.length > 0) { 
      var parsedText = parseText(currentHTML, currentText); 
      if (parsedText.includes(text)) {
        console.log("HELLO");
        var newHtmlElement = parsedText.replace(text, '</notTargetText><div id="targetText" class="targetText"><b><u>' + text + '</u></b></div><notTargetText>');
        newHtmlElement = '<notTargetText>' + newHtmlElement + '</notTargetText>'
        $(this).html(newHtmlElement);
      }
    }
  }); 
}