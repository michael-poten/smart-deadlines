/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var linkToCalSelector = document.getElementById("linkToCal");
var isContinuousSelector = document.getElementById("isContinuous");
var patternToUseSelector = document.getElementById("patternToUse");

t.render(function() {
  return Promise.all([
    t.get("board", "private", "linkToCal"),
    t.get("board", "private", "isContinuous"),
    t.get("board", "private", "patternToUse")
  ])
    .spread(function(savedLinkToCal, savedIsContinuous, savedPatternToUse) {
      if (savedLinkToCal) {
        linkToCalSelector.value = savedLinkToCal;
      }
      if (savedIsContinuous) {
        isContinuousSelector.checked = true;
      }
      if (savedPatternToUse) {
        patternToUseSelector.value = savedPatternToUse;
      }
    })
    .then(function() {
      t.sizeTo("#content").done();
    });
});

document.getElementById("save").addEventListener("click", function() {
  return t
    .set("board", "private", "linkToCal", linkToCalSelector.value)
    .then(function() {
      return t
        .set("board", "private", "isContinuous", isContinuousSelector.checked)
        .then(function() {
          return t.set(
            "board",
            "private",
            "patternToUse",
            patternToUseSelector.value ? patternToUseSelector.value : '*'
          );
        });
    })
    .then(function() {
      t.closePopup();
    });
});
