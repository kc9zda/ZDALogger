ZDALogger
=========

Version 1.0 - Nov 25, 2018

ZDALogger is a logging web app for amateur radio operators. The server runs on Node.JS and can be accessed through Chrome or Firefox. It can be run on a server for multiple users or locally for personal use. Most features will even work without an internet connection. 

## Getting Started

1. Navigate to the server in your browser. For example: http://localhost:8627/
2. Here, you will find a very basic page (as of right now). Click the Login link at the top.
3. You can either create an account or log into an existing account. Put the callsign you will be operating as in the Callsign field. The Operator field is for cases where there are multiple operators using the same callsign on air. Leave the Operator field blank if the operator's callsign is the same as the station callsign. Then enter your password and click Login.
4. You should be greeted with a page where you can begin to log your contacts. Your most recent log entries from previous sessions will appear in the upper half of the screen.
5. Enter contacts in the box in the lower left.
6. If others are using the same callsign as you are (for example, a special event, a contest, etc.), you can chat with them using the chat box on the lower left. You can also see what band and mode they are using by clicking the button that says "# ops online".
7. Please report any bugs to the Github repo at https://github.com/kc9zda/ZDALogger.

## How to run

Windows users: Download/clone the code from Github and open the zdalog.bat file.
Linux users: Download/clone the code from Github and open the zdalog.sh file. A recent version of Node.js is required.