var calsync = function() {
  return {
    extractDates: function(t, listId, rangeStartInput, data) {
      return new Promise(async function(resolve, reject) {
        let that = this;
        let errorText;

        let listIsActive = await t.get(
          "board",
          "private",
          listId + "listSettingsActive"
        );

        let pattern;
        if (!listIsActive) {
          pattern = await t.get("board", "private", "patternToUse");
        } else {
          pattern = await t.get("board", "private", listId + "patternToUse");
        }

        if (!pattern) pattern = "";

        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        let patternToUse = RegExp(pattern ? ".*" + pattern + ".*" : ".*");

        const rangeStart = rangeStartInput;
        let rangeEnd = rangeStartInput
          .clone()
          .startOf("day")
          .add(12, "months");

        let events = [];

        for (let k in data) {
          let event = data[k];
          if (event.type === "VEVENT") {
            if (!patternToUse.test(event.summary)) {
              continue;
            }


            let startDate = moment(event.start);
            let endDate;
            if (!event.end) {
              endDate = startDate.clone().add(1, "hours");
            } else {
              endDate = moment(event.end);
            }
            
            let mustStartBeChanged = moment(startDate).isDST() != moment().isDST();
            let mustEndBeChanged = moment(endDate).isDST() != moment().isDST();

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
              if (!event.rruleConverted) {
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
              }
              event.rruleConverted = true;
              
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
                  
                  
                  if (mustStartBeChanged && moment(startDate).isDST() == moment().isDST()) {
                    if (moment().isDST()) {
                      startDate = moment(startDate).clone().subtract(1, "hours");
                    } else {
                      startDate = moment(startDate).clone().add(1, "hours");
                    }
                  }
                  
                  if (mustEndBeChanged && moment(endDate).isDST() == moment().isDST()) {
                    if (moment().isDST()) {
                      endDate = moment(endDate).clone().subtract(1, "hours");
                    } else {
                      endDate = moment(endDate).clone().add(1, "hours");
                    }
                  }
                  
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
          reject(
            "No event found in iCal-Calendar" +
              (pattern === ".*" ? "" : " with configured title") +
              "!"
          );

          return;
        }

        resolve(events);
      });
    },
    downloadIcalCalendar: function(t) {
      return new Promise(async function(resolve, reject) {
        let that = this;
        let errorText;

        let linkToCal = await t.get("board", "private", "linkToCal");

        if (!linkToCal) {
          reject("Error! Please set the link to the iCal-Calendar!");
          return;
        }

        let generalExportEnabled = await t.get(
          "board",
          "private",
          "ownServerActive"
        );
        
        let exportServer = await t.get("board", "private", "exportServer");

        let dataInput;
        if (generalExportEnabled) {
          
          if (!exportServer) {
            reject("Error! Please set the URL to your Smart Deadlines-server!");
            return;
          }
          
          let exportServerKey = await t.get(
            "board",
            "private",
            "exportServerKey"
          );

          await axios({
            method: "get",
            url: exportServer + "/cors?url=" + linkToCal,
            headers: {
              token: exportServerKey
            }
          })
            .then(function(result) {
              that.dataInput = result.data;
            })
            .catch(function(error) {
              that.errorText = "Could not connect to iCal-Url or to your Smart Deadlines-server!";
            });
        } else {
          await axios({
            method: "get",
            url: "https://smart-deadlines-cors.herokuapp.com/" + linkToCal
          })
            .then(function(result) {
              that.dataInput = result.data;
            })
            .catch(function(error) {
              that.errorText = "Could not connect to iCal-server!";
            });
        }

        if (this.errorText) {
          reject(this.errorText);
          return;
        }

        if (!this.dataInput) {
          reject("Sorry, could not connect to iCal-Calendar!");
          return;
        }

        dataInput = this.dataInput;
        let data = ical.parseICS(dataInput);

        resolve(data);
      });
    }
  };
};
