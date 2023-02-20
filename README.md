# Pea server
Pea server is a file storage service designed to work almost exclusively within the LAN (everything except Discovery should work with an internet connection). I made it entirely for my usage, with the hope of achieving the following functions
+ Privacy: I don't want to store files or metadata about those files in anything outside of my LAN. 
+ Lightweight: I want to use as few system resources as possible so I can run the file server either as a background application or in something like a raspberry PI
+ Ease of use: Ideally once I have got the server running it should be dead simple to use.

# How to use it
## Index files
TODO: explain the format of index files
## Running the server
TODO: explain how to run the server

# Project structure
This is meant to be a mono repo containing the server as well as all the client applications. 
+ Sourcecode for the server is in the `src` directory
+ Sourcecode for the discovery service is in the `choreo` directory
+ Sourcecode for the web client is in the `pea-client` directory

# Web client
Running the server also runs a minimum web application that can be used to interact (get and upload files) with the server. Ideally, we want native client applications. But as a start web client is useful since
As long as you have a web browser you can interact with the server
Easier to test changes to the file server without having to fire up a dedicated native client
# Discovery
*This feature is not fully implemented yet*
While we can interact with the web client by using the ip and port of the server having to check and enter those values into the browser every time is cumbersome. Also, it will be even harder with native clients. Instead, the discovery service will store the server id (unique to each server) and address (ip / port combination) in the cloud. Then the client applications once the server id is given (I am hoping to do this by scanning a QR code) should query this service and get the address and use it to access the file server. 
