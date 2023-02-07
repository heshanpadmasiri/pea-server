import ballerina/http;
service / on new http:Listener(9000) {
    // TODO: take the server ip / port pair
    resource function get redirectTo () returns http:TemporaryRedirect {
        return {
            headers: {
                "Location": "http://192.168.8.176:8080"
            }
        };
    }
}
