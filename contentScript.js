// public IP for backend in EC2 
var EBURL = "http://ec2-52-23-243-230.compute-1.amazonaws.com:5000"

var storage_keys = ['user_id', 'jrec', 'sequence_id', 'session_id', 'doc_id', 'text', 'info']

var POPUPONSCREEN = false; 

var LIMIT = 39; 

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  chrome.storage.local.set({ "activated_language_learning": request.activated}, 
    function(){
      chrome.storage.local.get(['sequence_id', 'doc_id'],
       function(obj) {
        var needsInit = !('sequence_id' in obj) || obj['sequence_id'] == 0 || obj['sequence_id'] >= LIMIT;
        if (request.activated && needsInit) {
          show_intro();
        } else if (request.activated) {
          navigate(buildURL(obj['doc_id']), buildURL(obj["doc_id"]) != window.location.href)
        } else {
          window.location.href = window.location.href;
        }
      });
  });
});

chrome.storage.local.get(["activated_language_learning", "doc_id"], function(r) {
  if (! "activated_language_learning" in r || 
    !r["activated_language_learning"]) {

  } else {
    $(document).ready(function() {
      if (hasStarted()) {
        if (justStarted()) {
          initialize();
        } else if (buildURL(r["doc_id"]) != window.location.href) {
          // allow users to navigate other NHK easy articles
          // navigate(buildURL(r["doc_id"]), false);
        } else {
          highlightText();
        }
      } 
  });

  }
})

function convertDocIdToId(doc_id) {
  return doc_id.substr(0,15); 
}

function scrollToMyPopUp() {
    $('html,body').animate({
            scrollTop: $("#myPopup").offset().top - 100
          },
          'slow', function() {
            setTimeout(function(){}, 2000);
            POPUPONSCREEN = $("#myPopup").isOnScreen();
            if (!POPUPONSCREEN) {
              scrollToMyPopUp();
            } 
          });
} 

function initialize() {
  chrome.storage.local.get(storage_keys, function(obj) {
            $.ajax({
              type: 'GET',
              url: EBURL + '/initialize',
              success: function (e) {
                var valuesToSet = {
                  'sequence_id': 0, 
                  'session_id': e['session_id'] 
                }; 
                if (obj['user_id'] == null) {
                  valuesToSet['user_id'] = e['user_id'];
                  valuesToSet['jrec'] = e['jrec'];
                  valuesToSet['doc_id'] = e['doc_id'];
                  valuesToSet['text'] = e['text'];
                  valuesToSet['info'] = e['info'];
                } 
                chrome.storage.local.set(valuesToSet, function() {
                  chrome.storage.local.get(['doc_id'], function(d) {
                    navigate(buildURL(d['doc_id']), false)
                  })
                });
              },
              error: function(error) {
                console.log(error);
              }
            });
          });
}

function highlightText() {
  chrome.storage.local.get(storage_keys, function(e) {
            text = e['text'];
            addTagToText(text);

            document.body.style.background = "black";
            $(".contentWrap").css('background', 'unset');
            $("#side").append("<div class='overlay'></div>");
            $("#enq_answer_disp").css('background', 'unset');
            $("#enq_ansbak").css('background', 'unset');
            $("#main_enqdiv").hide();
            $("#targetText").append("<span class='popuptext' id='myPopup'> <i> Do you understand this passage? </i> <br> <button type='button' class='yesButton' id='yesButtonId'> Yes </button> <button type='button' class='noButton' id='noButtonId'> No </button> </span>");

            $('.overlay').fadeIn(300);
            scrollToMyPopUp();
            var seen = new Date().getTime()
                      
              document.getElementById("yesButtonId").addEventListener("click", function() {
                submitAnswerAndGetNext(true, seen)
              }, false);
              
              document.getElementById("noButtonId").addEventListener("click", function() {
                submitAnswerAndGetNext(false, seen)
              }, false);
          });

}
// checks whether URL contains http://www3.nhk.or.jp/
function needsInit() {
  chrome.storage.local.get('sequence_id', function(obj) {
    return !'sequence_id' in obj || obj['sequence_id'] == 0 || obj['sequence_id'] >= LIMIT;
  });
}

// checks whether URL contains http://www3.nhk.or.jp/
function hasStarted() {
  return window.location.href.indexOf("http://www3.nhk.or.jp/") > -1; 
}

// gets the id of the current document of interest
// if you are not on a document but on NHK 
// then this method will return 'easy'
function justStarted() {
  var currentUrl = window.location.href.split('/')
  return currentUrl[currentUrl.length - 2] == 'easy'
}

function buildURL(docId) {
  id = convertDocIdToId(docId);
  return 'http://www3.nhk.or.jp/news/easy/' + id + '/' + id + '.html'
}
// given a docId, navigates page to article corresponding to it
function navigate(docId, inNewTab) {
  chrome.runtime.sendMessage({"url": docId, "newTab": inNewTab});
}

// isplay final page 
function show_intro() {
	navigate(chrome.extension.getURL('welcome_page.htm'), true);
}

// isplay final page 
function show_final_page() {
	navigate(chrome.extension.getURL('final_page.htm'), true);
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
  text = text.replace("＜", "【");
  text = text.replace("＞", "】");
  console.log(text);
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
          if (indexOfText == 0) {
            firstIndex = i;
          }
          indexOfText += 1
        } else {
          indexOfText = 0; 
        }
        i += 1 
    }
  }

  lastIndex = i;
  var newHtml = html.substring(0, firstIndex);
  var addSpan = false 
  var spanClass = '<ruby><span class="under">'
  if (newHtml.substring(newHtml.length - spanClass.length) == spanClass) {
    addSpan = true
  } 
  var tag = '<div id="targetText" class="targetText">'; 
  if (newHtml.substring(newHtml.length-6) == '<ruby>') {
    newHtml = newHtml.substring(0, newHtml.length-6);
    tag += '<ruby>'
  } 
  if (addSpan) {
    newHtml = newHtml.substring(0, newHtml.length - spanClass.length);
    newHtml += tag;
    newHtml += spanClass; 
  }
  else {
    newHtml += tag;
  }

  newHtml += html.substring(firstIndex, lastIndex);
  newHtml +=  '</div>'
  newHtml += html.substring(lastIndex);
  $("#newsarticle").html(newHtml);
}

// submit user response (true or false) to the backend
// and get the next document id 
function submitAnswerAndGetNext(userResponse, seen) {
  chrome.storage.local.get(storage_keys, function(e) { 
          e['answered'] = new Date().getTime()
          e['seen'] = seen
          $.ajax({
                 type: 'POST',
                 contentType: 'application/json',
                 processData: false, 
                 traditional: true,
                 data: JSON.stringify(e),
                 url: EBURL + '/record_response/' + userResponse,
                 success: function (d) {
                  if (d['end']) {
                    chrome.storage.local.set({
                      'user_summary': d['user_summary'] 
                    }, function() {
                      show_final_page();
                      window.close();
                    });
                  } else {
                    chrome.storage.local.set(
                      { 
                        'jrec': d['jrec'], 
                        'doc_id': d['next_doc_id'], 
                        'text': d['next_text'],
                        'info': d['next_info'],
                        'sequence_id': e['sequence_id'] + 1
                      }, function() {
                        navigate(buildURL(d['next_doc_id']), false);
                      });
                  }
                },
                  error: function(error) {
                    console.log(error);
                  }
                });

        });
}

// credits to https://stackoverflow.com/questions/8897289/how-to-check-if-an-element-is-off-screen 
$.fn.isOnScreen = function(partial){

    //let's be sure we're checking only one element (in case function is called on set)
    var t = $(this).first();

    //we're using getBoundingClientRect to get position of element relative to viewport
    //so we dont need to care about scroll position
    var box = t[0].getBoundingClientRect();

    //let's save window size
    var win = {
        h : $(window).height(),
        w : $(window).width()
    };

    //now we check against edges of element

    //firstly we check one axis
    //for example we check if left edge of element is between left and right edge of scree (still might be above/below)
    var topEdgeInRange = box.top >= 0 && box.top <= win.h;
    var bottomEdgeInRange = box.bottom >= 0 && box.bottom <= win.h;

    var leftEdgeInRange = box.left >= 0 && box.left <= win.w;
    var rightEdgeInRange = box.right >= 0 && box.right <= win.w;


    //here we check if element is bigger then window and 'covers' the screen in given axis
    var coverScreenHorizontally = box.left <= 0 && box.right >= win.w;
    var coverScreenVertically = box.top <= 0 && box.bottom >= win.h;

    //now we check 2nd axis
    var topEdgeInScreen = topEdgeInRange && ( leftEdgeInRange || rightEdgeInRange || coverScreenHorizontally );
    var bottomEdgeInScreen = bottomEdgeInRange && ( leftEdgeInRange || rightEdgeInRange || coverScreenHorizontally );

    var leftEdgeInScreen = leftEdgeInRange && ( topEdgeInRange || bottomEdgeInRange || coverScreenVertically );
    var rightEdgeInScreen = rightEdgeInRange && ( topEdgeInRange || bottomEdgeInRange || coverScreenVertically );

    //now knowing presence of each edge on screen, we check if element is partially or entirely present on screen
    var isPartiallyOnScreen = topEdgeInScreen || bottomEdgeInScreen || leftEdgeInScreen || rightEdgeInScreen;
    var isEntirelyOnScreen = topEdgeInScreen && bottomEdgeInScreen && leftEdgeInScreen && rightEdgeInScreen;

    return partial ? isPartiallyOnScreen : isEntirelyOnScreen;

};
