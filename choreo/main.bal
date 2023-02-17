import ballerina/http;
import ballerina/log;
import ballerinax/mongodb;

public type Server record {|
    readonly string id;
    string address;
    int port;
|};
service / on new http:Listener(9000) {
    resource function post register (@http:Payload Server server) returns http:Ok|error? {
        log:printInfo("Registering server: " + server.toString());
        error? result = registerServer(server);
        if result is error {
            log:printError("Error while registering server: " + result.message());
            return error("Error while registering server: " + result.message());
        }
        log:printInfo("Successfully registered: " + server.id);
        return http:OK;
    }
}

function registerServer(Server server) returns error? {
    mongodb:Client mongoClient = check getMongoClient();
    check mongoClient->insert(server, "servers");
    mongoClient->close();
}

configurable string db_username = ?;
configurable string db_password = ?;
configurable string db_url = ?;
function getMongoClient() returns mongodb:Client|error {
    string url = string `mongodb+srv://${db_username}:${db_password}@${db_url}/?retryWrites=true&w=majority`;
    mongodb:ConnectionString connection = {url};
    mongodb:ConnectionConfig config = {connection, databaseName: "servers"};
    return check new (config);
}
