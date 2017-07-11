// when clicking on the chrome extension,
// listener helps you navigate to 
// http://www3.nhk.or.jp/news/easy/
// if it is the case that you are already in NHK,
// the you will be alerted so 
chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  if (!hasStarted()) {
    chrome.storage.local.set({'sequence_id': 0}, function() {
      window.location.href = 'http://www3.nhk.or.jp/news/easy/';
    });
  } else {
    alert("already started!");
  }
});

// public IP for backend in EC2 
var EBURL = "http://ec2-54-89-85-115.compute-1.amazonaws.com:5000"

$(document).ready(function() {
    if (hasStarted()) {
      if (justStarted()) {
        chrome.storage.local.get(null, function(obj) {
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
                // valuesToSet['doc_id'] = e['doc_id'];
                // valuesToSet['text'] = e['text'];
              } 
              chrome.storage.local.set(valuesToSet, function() {
                $.ajax({
                 type: 'POST',
                 contentType: 'application/json',
                 processData: false, 
                 traditional: true,
                 data: e['jrec'],
                 url: EBURL + '/get_request_id/',
                 success: function (id) {
                    navigate(id);
                  },
                  error: function(error) {
                    console.log(error);
                  }
                });
              });
            },
            error: function(error) {
              console.log(error);
            }
          });
        });
      } else {
        chrome.storage.local.get(null, function(e) {
          $.ajax({
                 type: 'POST',
                 contentType: 'application/json',
                 processData: false, 
                 traditional: true,
                 data: e['jrec'],
                 url: EBURL + '/get_request_text/',
                 success: function (text) {
                    addTagToText(text);
                    document.body.style.background = "black";
                    $(".contentWrap").css('background', 'unset');
                    $("#enq_answer_disp").css('background', 'unset');
                    $("#enq_ansbak").css('background', 'unset');
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
                  },
                  error: function(error) {
                    console.log(error);
                  }
                });

        });
      }
    } 
});

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

// given a docId, navigates page to article corresponding to it
function navigate(docId) {
  window.location.href = 'http://www3.nhk.or.jp/news/easy/' + docId + '/' + docId + '.html'
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
  var tag = '<div id="targetText" class="targetText">'; 
  if (newHtml.substring(newHtml.length-6) == '<ruby>') {
    newHtml = newHtml.substring(0, newHtml.length-6);
    tag += '<ruby>'
  } 
  newHtml += tag;
  newHtml += html.substring(firstIndex, lastIndex);
  newHtml +=  '</div>'
  newHtml += html.substring(lastIndex);
  $("#newsarticle").html(newHtml);
}

// submit user response (true or false) to the backend
// and get the next document id 
function submitAnswerAndGetNext(userResponse) {
  chrome.storage.local.get(null, function(e) {
          $.ajax({
                 type: 'POST',
                 contentType: 'application/json',
                 processData: false, 
                 traditional: true,
                 data: e['jrec'],
                 url: EBURL + '/record_response/' + userResponse,
                 success: function (jrec) {
                      chrome.storage.local.set({ 'jrec': jrec['jrec'] }, function() {
                      $.ajax({
                       type: 'POST',
                       contentType: 'application/json',
                       processData: false, 
                       traditional: true,
                       data: jrec['jrec'],
                       url: EBURL + '/get_request_id/',
                       success: function (id) {
                          navigate(id);
                        },
                        error: function(error) {
                          console.log(error);
                        }
                      });
                    });
                    
                },
                  error: function(error) {
                    console.log(error);
                  }
                });

        });
}