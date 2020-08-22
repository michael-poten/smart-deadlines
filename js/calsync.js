var extractDates = function(t, listId, rangeStartInput) {
  return new Promise(async function(resolve) {
    let listIsActive = await t.get("board", "private", listId + "listSettingsActive");
    let linkToCal;
    let pattern;
    if (!listIsActive) {
      linkToCal = await t.get("board", "private", "linkToCal");
      pattern = await t.get("board", "private", "patternToUse");
    } else {
      linkToCal = await t.get("board", "private", listId + "linkToCal");
      pattern = await t.get("board", "private", listId + "patternToUse");
    }

    if (!pattern) pattern = "";

    if (!linkToCal) {
      t.alert({
        message: "Error! Please set the link to the iCal-Calendar!",
        duration: 6,
        display: "error"
      });
      return;
    }

    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let patternToUse = RegExp(pattern ? ".*" + pattern + ".*" : ".*");

    $.get("https://cors-anywhere.herokuapp.com/" + linkToCal, "text")
      .done(function(dataInput) {
        let data = ical.parseICS(dataInput);

        const rangeStart = rangeStartInput;
        let rangeEnd = rangeStartInput
            .clone()
            .startOf("day")
            .add(3, "months");

        let events = [];

        for (let k in data) {
          let event = data[k];
          if (event.type === "VEVENT") {
            if (!patternToUse.test(event.summary)) {
              continue;
            }

            let startDate = moment(event.start);
            let endDate = moment(event.end);

            let duration =
                parseInt(endDate.format("x")) - parseInt(startDate.format("x"));

            if (typeof event.rrule === "undefined") {
              if (
                !startDate.isBetween(rangeStart, rangeEnd) &&
                !endDate.isBetween(rangeStart, rangeEnd)
              ) {
                continue;
              }

              events.push({
                title: event.summary,
                description: event.description,
                startDate: startDate,
                endDate: endDate,
                duration: moment.duration(duration)
              });
            } else if (typeof event.rrule !== "undefined") {
              let rule = event.rrule.replace("RRULE:", "");
              if (rule.indexOf("DTSTART") === -1) {
                if (event.start.length === 8) {
                  let comps = /^(\d{4})(\d{2})(\d{2})$/.exec(event.start);
                  if (comps) {
                    event.start = new Date(comps[1], comps[2] - 1, comps[3]);
                  }
                }

                if (typeof event.start.toISOString === "function") {
                  try {
                    rule +=
                      ";DTSTART=" +
                      event.start.toISOString().replace(/[-:]/g, "");
                    rule = rule.replace(/\.[0-9]{3}/, "");
                  } catch (error) {
                    console.error(
                      "ERROR when trying to convert to ISOString",
                      error
                    );
                  }
                } else {
                  console.error(
                    "No toISOString function in curr.start",
                    event.start
                  );
                }
              }

              event.rrule = rrule.RRule.fromString(rule);
              let dates = event.rrule.between(
                  rangeStart.toDate(),
                  rangeEnd.toDate(),
                  true
              );

              if (event.recurrences !== undefined) {
                for (let r in event.recurrences) {
                  if (
                    moment(new Date(r)).isBetween(rangeStart, rangeEnd) !== true
                  ) {
                    dates.push(new Date(r));
                  }
                }
              }

              for (let i in dates) {
                let date = dates[i];
                let curEvent = event;
                let showRecurrence = true;
                let curDuration = duration;

                startDate = moment(date);

                let dateLookupKey = date.toISOString().substring(0, 10);

                if (
                  curEvent.recurrences !== undefined &&
                  curEvent.recurrences[dateLookupKey] !== undefined
                ) {
                  curEvent = curEvent.recurrences[dateLookupKey];
                  startDate = moment(curEvent.start);
                  curDuration =
                    parseInt(moment(curEvent.end).format("x")) -
                    parseInt(startDate.format("x"));
                } else if (
                  curEvent.exdate !== undefined &&
                  curEvent.exdate[dateLookupKey] !== undefined
                ) {
                  showRecurrence = false;
                }

                endDate = moment(
                  parseInt(startDate.format("x")) + curDuration,
                  "x"
                );

                if (
                  endDate.isBefore(rangeStart) ||
                  startDate.isAfter(rangeEnd)
                ) {
                  showRecurrence = false;
                }

                if (showRecurrence === true) {
                  events.push({
                    title: curEvent.summary,
                    description: curEvent.description,
                    startDate: startDate,
                    endDate: endDate,
                    duration: moment.duration(curDuration)
                  });
                }
              }
            }
          }
        }

        events = events.sort((a, b) => {
          return moment(a.startDate).diff(b.startDate);
        });

        if (events.length === 0) {
          t.alert({
            message:
              "No event found in iCal-Calendar" +
              (pattern === ".*" ? "" : " with this title") +
              "!",
            duration: 6,
            display: "info"
          });
        }

        resolve(events);
      })
      .fail(function() {
        t.alert({
          message: "Sorry, could net connect to iCal-Calendar! (URL correct?)",
          duration: 6,
          display: "error"
        });
      });
  });
};
