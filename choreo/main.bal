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
        if findServer(server.id) != () {
            string errorMessage = "Already have a server registered by that id";
            log:printError(errorMessage);
            return error(errorMessage);
        }
        check registerServer(server);
        log:printInfo("Successfully registered: " + server.id);
        return http:OK;
    }

    resource function delete unregister(@http:Payload Server server) returns http:Ok|error? {
        log:printInfo("Unregistering server: " + server.toString());
        check unregisterServer(server);
        log:printInfo("Successfully unregistered: " + server.id);
        return http:OK;
    }

    resource function get find/[string serverId]() returns Server|error? {
        log:printInfo("Finding server: " + serverId);
        return check findServer(serverId);
    }
}

const string DATABASE = "servers";
const string COLLECTION = "servers";

function registerServer(Server server) returns error? {
    mongodb:Client mongoClient = check getMongoClient();
    check mongoClient->insert(server, "servers");
    mongoClient->close();
}

function unregisterServer(Server server) returns error? {
    mongodb:Client mongoClient = check getMongoClient();
    int count = check mongoClient->delete(COLLECTION, DATABASE, {id: server.id});
    if count != 1 {
        string errorMessage = string `Unexpected ${count} servers deleted for ${server.toString()}`;
        log:printError(errorMessage);
        return error(errorMessage);
    }
    mongoClient->close();
}

type ServerQueryResultType record {
    string id;
    string address;
    int port;
};

function findServer(string serverId) returns Server|error? {
    mongodb:Client mongoClient = check getMongoClient();
    var result = check mongoClient->find(COLLECTION, DATABASE, filter={id: serverId}, rowType = ServerQueryResultType);
    var server = check result.next();
    mongoClient->close();
    if server != () {
        var { id, address, port } = server.value;
        return {id: id, address: address, port: port};
    }
    return ();
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
