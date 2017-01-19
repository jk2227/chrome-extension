$(document).ready(function() {
  // Initialize the plugin

  targetText = "新潟県にいがたけん関川せきかわ村むらにある"; 
  addTagToText(targetText);
  blurOutText(targetText);
  $("#targetText").append("<span class='popuptext' id='myPopup'> <i> Do you understand this sentence? </i> <br> <button type='button' class='yesButton' onclick='alert('Hello world!')''> Yes </button> <button type='button' class='noButton' onclick='alert('Hello world!')''> No </button> </span>");
});

function blurOutText(targetText) {
  $( "p" ).each(function(index) {
    var str = $(this).text();
    if (str.includes(targetText)) {
      $("notTargetText").foggy();
    } else {
      $(this).foggy();
    }
  });
}

function addTagToText(text) {
  $( "p" ).each(function(index) {
    var currentText = $(this).text();
    if (currentText.includes(text)) {
      var newHtmlElement = currentText.replace(text, '</notTargetText><div id="targetText" class="targetText">' + text + '</div><notTargetText>');
      newHtmlElement = '<notTargetText>' + newHtmlElement + '</notTargetText>'
      $(this).html(newHtmlElement);
    }
  }); 
}



/*
http://stackoverflow.com/questions/4409378/text-selection-and-bubble-overlay-as-chrome-extension/*


// Add bubble to the top of the page.
var bubbleDOM = document.createElement('div');
bubbleDOM.setAttribute('class', 'selection_bubble');
document.body.appendChild(bubbleDOM);

// Lets listen to mouseup DOM events.
document.addEventListener('mouseup', function (e) {
  var selection = window.getSelection().toString();
  if (selection.length > 0) {
    renderBubble(e.clientX, e.clientY, selection);
  }
}, false);


// Close the bubble when we click on the screen.
document.addEventListener('mousedown', function (e) {
  bubbleDOM.style.visibility = 'hidden';
}, false);

// Move that bubble to the appropriate location.
function renderBubble(mouseX, mouseY, selection) { 
  console.log(selection);
  bubbleDOM.innerHTML = selection;
  bubbleDOM.style.top = mouseY + 'px';
  bubbleDOM.style.left = mouseX + 'px';
  bubbleDOM.style.visibility = 'visible';
}
*/