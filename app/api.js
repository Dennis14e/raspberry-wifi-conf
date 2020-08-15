import { join } from "path";
import iwlist from "./iwlist";
import express, { static } from "express";
import { json } from 'body-parser';
import { access_point, server } from "../config.json";

// Helper function to log errors and send a generic status "SUCCESS"
// message to the caller
function log_error_send_success_with(success_obj, error, response) {
    if (error) {
        console.log("ERROR: " + error);
        response.send({ status: "ERROR", error: error });
    } else {
        success_obj = success_obj || {};
        success_obj["status"] = "SUCCESS";
        response.send(success_obj);
    }
    response.end();
}

/*****************************************************************************\
    Returns a function which sets up the app and our various routes.
\*****************************************************************************/
export default function(wifi_manager, callback) {
    var app = express();

    // Configure the app
    app.set("view engine", "ejs");
    app.set("views", join(__dirname, "views"));
    app.set("trust proxy", true);

    // Setup static routes to public assets
    app.use(static(join(__dirname, "public")));
    app.use(json());

    // Setup HTTP routes for rendering views
    app.get("/", function(request, response) {
        response.render("index");
    });

    // Setup HTTP routes for various APIs we wish to implement
    // the responses to these are typically JSON
    app.get("/api/rescan_wifi", function(request, response) {
        console.log("Server got /rescan_wifi");
        iwlist(function(error, result) {
            log_error_send_success_with(result[0], error, response);
        });
    });

    app.post("/api/enable_wifi", function(request, response) {
        var conn_info = {
            wifi_country:  request.body.wifi_country,
            wifi_ssid:     request.body.wifi_ssid,
            wifi_passcode: request.body.wifi_passcode,
        };

        // TODO: If wifi did not come up correctly, it should fail
        // currently we ignore ifup failures.
        wifi_manager.enable_wifi_mode(conn_info, function(error) {
            if (error) {
                console.log("Enable Wifi ERROR: " + error);
                console.log("Attempt to re-enable AP mode");
                wifi_manager.enable_ap_mode(access_point.ssid, function(error) {
                    console.log("... AP mode reset");
                });
                response.redirect("/");
            }
            // Success! - exit
            console.log("Wifi Enabled! - Exiting");
            process.exit(0);
        });
    });

    // Listen on our server
    app.listen(server.port);
}
