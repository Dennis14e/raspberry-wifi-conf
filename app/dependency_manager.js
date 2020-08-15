import { _ } from "underscore";
import { series, parallel } from "async";
import { exists } from "fs";
import { exec } from "child_process";

/*****************************************************************************\
    Return a set of functions which we can use to manage our dependencies
\*****************************************************************************/
export default function() {

    // Check dependencies based on the input "deps" object.
    // deps will contain: {"binaries": [...], "files":[...]}
    _check_deps = function(deps, callback) {
        if (typeof(deps["binaries"]) == "undefined") {
            deps["binaries"] = [];
        }
        if (typeof(deps["files"]) == "undefined") {
            deps["files"] = [];
        }

        // Define functions to check our binary deps
        var check_exe_fns = _.map(deps["binaries"], function(bin_dep) {
            //console.log("Building || function for " + bin_dep);
            return function(callback) {
                exec("which " + bin_dep, function(error, stdout, stderr) {
                    if (error) return callback(error);
                    if (stdout == "") return callback("\"which " + bin_dep + "\" returned no valid binary");
                    return callback(null)
                });
            };
        });

        // Define functions to check our file deps
        var check_file_fns = _.map(deps["files"], function(file) {
            //console.log("Building || function for " + file);
            return function(callback) {
                exists(file, function(file_exists) {
                    if (file_exists) return callback(null);
                    return callback(file + " does not exist");
                });
            };
        });

        // Dispatch the parallel functions
        series([
            function check_binaries(next_step) {
                parallel(check_exe_fns, next_step);
            },
            function check_files(next_step) {
                parallel(check_file_fns, next_step);
            },
        ], callback);
    };

    return {
        check_deps: _check_deps
    };
}
