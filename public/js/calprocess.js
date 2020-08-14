var setDueDate = async function(
  t,
  event,
  restDurationEvent,
  isOngoingStarted,
  card
) {
  if (!isOngoingStarted) {
    var cardStartDate = moment(event.startDate)
      .add(event.duration)
      .subtract(moment.duration(restDurationEvent, "minutes"));
    console.log("startDate of " + card.name, cardStartDate);

    var token = await t.get("member", "private", "token");
    var key = "5db50da477d5b9033e479892f742bf8d";
    $.ajax({
      url:
        "https://api.trello.com/1/cards/" +
        card.id +
        "?key=" +
        key +
        "&token=" +
        token +
        "&due=" +
        cardStartDate.format(),
      type: "PUT",
      success: function(result) {}
    });
  }
};

var removeDueDate = async function(
  t,
  isOngoingStarted,
  card
) {
  if (!isOngoingStarted) {
    var token = await t.get("member", "private", "token");
    var key = "5db50da477d5b9033e479892f742bf8d";
    $.ajax({
      url:
        "https://api.trello.com/1/cards/" +
        card.id +
        "?key=" +
        key +
        "&token=" +
        token +
        "&due=",
      type: "PUT",
      success: function(result) {}
    });
  }
};

var filterEvents = function(events) {
  var newEvents = [];
  var currentTime = moment();
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    if (currentTime.isBetween(event.startDate, event.endDate)) {
      event.startDate = currentTime;
      event.duration = moment.duration(event.endDate.diff(event.startDate));
      newEvents.push(event);
    } else if (event.startDate.isAfter(currentTime)) {
      newEvents.push(event);
    }
  }
  return newEvents;
};

var processDueDates = function(t) {
  new Promise(function(resolve, reject) {
    extractDates(t).then(function(events) {
      console.log("events", events);
      events = filterEvents(events);
      console.log("events2", events);

      if (events.length === 0) {
        return;
      }

      t.list("cards").then(async function(cards) {
        console.log("cards", cards);

        var currentEventIndex = 0;
        var event = events[currentEventIndex];
        var restDurationEvent = event.duration.asMinutes();

        var isOngoing = await t.get("board", "private", "isContinuous");

        for (var i = 0; i < cards.cards.length; i++) {
          var card = cards.cards[i];
          var isOngoingStarted = false;

          var estimation = await t.get(card.id, "shared", "estimation");

          var restDurationCard = estimation.estimation;
          while (
            restDurationCard > 0 &&
            currentEventIndex + 1 <= events.length
          ) {
            if (restDurationEvent === 0) {
              currentEventIndex = currentEventIndex + 1;
              if (currentEventIndex + 1 > events.length) {
                break;
              }
              event = events[currentEventIndex];
              restDurationEvent = event.duration.asMinutes();
            }

            if (restDurationEvent === restDurationCard) {
              setDueDate(t, event, restDurationEvent, isOngoingStarted, card);
              isOngoingStarted = true;

              restDurationCard = 0;
              restDurationEvent = 0;
            } else if (restDurationEvent > restDurationCard) {
              setDueDate(t, event, restDurationEvent, isOngoingStarted, card);
              isOngoingStarted = true;

              restDurationEvent = restDurationEvent - restDurationCard;
              restDurationCard = 0;
            } else if (restDurationEvent < restDurationCard) {
              if (isOngoing) {
                restDurationCard = restDurationCard - restDurationEvent;
                if (currentEventIndex + 1 === events.length) {
                  if (restDurationCard === 0) {
                    setDueDate(
                      t,
                      event,
                      restDurationEvent,
                      isOngoingStarted,
                      card
                    );
                                    isOngoingStarted = true;
                  }
                } else {
                  setDueDate(
                    t,
                    event,
                    restDurationEvent,
                    isOngoingStarted,
                    card
                  );
                                  isOngoingStarted = true;
                }
              }
              restDurationEvent = 0;
            }
          }
          if (restDurationCard > 0) {
            removeDueDate(t, isOngoingStarted, card);
            
          }
        }

        t.alert({
          message: "Ready! All deadlines in list calculated!",
          duration: 6,
          display: "success"
        });

        resolve();
      });
    });
  });
};
