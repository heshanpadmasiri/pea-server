import ballerina/test;
import ballerina/http;
function testServerRegistrationEndPoint() returns error? {
    http:Client clientEndpoint = check new("http://localhost:9000");
    Server server = {id: "unique_id", address: "http://192.168.8.160", port: 8080 };
    http:Response response = checkpanic clientEndpoint->post("/register", server);
    test:assertEquals(response.statusCode, 200, msg = "Status code mismatch!");
    return cleanup_registration(server);
}

@test:Config {}
function testDuplicateRegistrationDetection() returns error? {
    http:Client clientEndpoint = check new("http://localhost:9000");
    Server server = {id: "duplicate_id", address: "http://192.168.8.160", port: 8080 };
    http:Response response = checkpanic clientEndpoint->post("/register", server );
    test:assertEquals(response.statusCode, 200, msg = "Initial registration failed!");

    http:Response duplicateResponse = checkpanic clientEndpoint->post("/register", server );
    test:assertEquals(duplicateResponse.statusCode, 500, msg = "Duplicate registration not detected!");

    return cleanup_registration(server);
}

@test:Config {}
function testServerUnregistrationEndPoint() returns error? {
    http:Client clientEndpoint = check new("http://localhost:9000");
    Server server = {id: "unreg_test_1", address: "http://192.168.8.160", port: 8080 };
    http:Response reg_res = checkpanic clientEndpoint->post("/register", server);
    test:assertEquals(reg_res.statusCode, 200, msg = "Failed to register server!");

    http:Response unreg_res = checkpanic clientEndpoint->delete("/unregister", server );
    test:assertEquals(unreg_res.statusCode, 200, msg = "Failed to unregister server!");
}

@test:Config {}
function testServerDuplicateUnregRequests() returns error? {
    http:Client clientEndpoint = check new("http://localhost:9000");
    Server server = {id: "unreg_test_2", address: "http://192.168.8.160", port: 8080 };
    http:Response reg_res = checkpanic clientEndpoint->post("/register", server);
    test:assertEquals(reg_res.statusCode, 200, msg = "Failed to register server!");

    http:Response unreg_res = checkpanic clientEndpoint->delete("/unregister", server );
    test:assertEquals(unreg_res.statusCode, 200, msg = "Failed to unregister server!");

    http:Response duplicate_res = checkpanic clientEndpoint->delete("/unregister", server );
    test:assertEquals(duplicate_res.statusCode, 500, msg = "Failed to detect duplicate unregistration request!");
}

@test:Config {}
function testServerNonExistingUnregRequests() returns error? {
    http:Client clientEndpoint = check new("http://localhost:9000");
    Server server = {id: "non_existing", address: "http://192.168.8.160", port: 8080 };

    http:Response unreg_res = checkpanic clientEndpoint->delete("/unregister", server );
    test:assertEquals(unreg_res.statusCode, 500, msg = "Allowed non existing server to unregister!");
}

function cleanup_registration(Server server) returns error? {
    http:Client clientEndpoint = check new("http://localhost:9000");
    http:Response _ = check clientEndpoint->delete("/unregister", server );
}
