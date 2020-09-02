You want to privately start an extensive project and have a mountain of tasks ahead of you. Full of motivation, you throw yourself into it and at some point you realise: without structure you can't do it. 

**Wouldn't it be great if you knew exactly when you had something ready and could finally present the result to your friends?**

The problem: In private life it is sometimes difficult to find free time. 

This is exactly where SmartDeadline comes in: 

Place placeholder-appointments in your iCal-calendar. SmartDeadline reads out these appointments and can determine what needs to be done and when - based on the estimates you make per card. Sounds relaxing, doesn't it? It is! ;)

![](https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/lists.PNG)

## What happens there exactly?

After entering the URL to your iCal calendar in the preferences and setting estimates per card, you can calculate the due dates for a list calculated automatically. First, all dates (with the previously defined title) for the next 3 months are read from your iCal calendar. Afterwards, the next possible date is determined for each card in sequence according to the estimate and set as due date.

### A small example

**User estimates**

Card A: 1 hour

Card B: 1,5 hours

Card C: 1 hour

**Dates according to calendar**

16.8.2020 / 10 - 12 o'clock

16.8.2020 / 15 - 17 o'clock

**Calculated due dates**

Card A: 10:00 o'clock

Card B: 11:00 o'clock

Card C: 15:30 o'clock

## Configuration

First, you need to add the link to your iCal calendar. Optionally, you can define a text to be included in the calendar title. After you have done this you should give an estimate for each card.
![](https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/card_estimation.PNG)

Finally, click on "Calculate Smart Deadlines..." in the context menu of a desired list. In the window that now appears, you can make settings and then click on "Run" to start the calculation of the deadlines.
![](https://raw.githubusercontent.com/michael-roedel/smart-deadlines/master/images/calculation.PNG)

### Upload and Download of .ics files with your own server

You can also run a (very small) NodeJs service on your own server. An ics file can be uploaded automatically. You can then import the URL to this ics in your calendar. The download of the ics file is also done via this service.

To do so, please go to the public [GitHub repository](https://github.com/michael-roedel/smart-deadlines) and copy the package.json and server.js to your server. After installing NodeJs and running "npm install" in your command console, you can start the application with "node server.js". More detailed instructions would unfortunately go beyond this scope.

There is also an official Docker image available on DockerHub. Please go to [https://hub.docker.com/r/nicknamenuck/smart-deadlines](https://hub.docker.com/r/nicknamenuck/smart-deadlines).

## Open Source

This project is OpenSource and cooperation is highly desired. Feel free to share your ideas with me or develop a feature yourself! You can find more information on the [GitHub page](https://github.com/michael-roedel/smart-deadlines) of the repository.
 