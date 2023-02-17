import ballerina/http;
import ballerina/log;
import ballerina/io;
import ballerinax/mongodb;

public type Server record {|
    readonly string id;
    string address;
    int port;
|};
service / on new http:Listener(9000) {
    resource function post register (@http:Payload Server server) returns Server|error? {
        log:printInfo("Registering server: " + server.id);
        error? result = registerServer(server);
        if result is error {
            log:printError("Error while registering server: " + result.message());
            return error("Error while registering server: " + result.message());
        }
        return server;
    }
}

configurable string db_username = ?;
configurable string db_password = ?;
configurable string db_url = ?;
function registerServer(Server server) returns error? {
    string url = string `mongodb+srv://${db_username}:${db_password}@${db_url}/?retryWrites=true&w=majority`;
    mongodb:ConnectionString connection = {url};
    mongodb:ConnectionConfig config = {connection, databaseName: "pea-server-dev"};
    mongodb:Client mongoClient = check new (config);
    map<json> doc = { "name": "Gmail", "version": "0.99.1", "type" : "Service" };
    // FIXME: why authentication is failing here?
    check mongoClient->insert(doc, "testCollection");
    mongoClient->close();
}
