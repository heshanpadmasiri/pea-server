import ballerina/test;
import ballerina/http;
@test:Config {}
function testServerRegistrationEndPoint() returns error? {
    http:Client clientEndpoint = check new("http://localhost:9000");
    http:Response response = checkpanic clientEndpoint->post("/register", {id: "unique_id", address: "http://192.168.8.160", port: 8080 });
    test:assertEquals(response.statusCode, 200, msg = "Status code mismatch!");
}
