(function () {
    function mixin(/*Object*/ target, /*Object*/ source){
        var name, s, i;
        for(name in source){
            s = source[name];
            if(!(name in target) || (target[name] !== s && (!(name in empty) || empty[name] !== s))){
                target[name] = s;
            }
        }
        return target; // Object
    };
    function combine(/*Object*/ obj, /*Object...*/ props) {
        var newObj = {};
        for(var i=0, l=arguments.length; i<l; i++){
            mixin(newObj, arguments[i]);
        }
        return newObj;
    };
    var common_build_options = {
        "ios7": {
            "-p": "ios",
            "--log-level": "info",
            "-C": "iPhone Retina (4 inch)"
        },
        "ios7_3.5inch": {
            "-p": "ios",
            "--log-level": "info",
            "-S": "7.1",
            "-C": "iPhone Retina (3.5 inch)"
        },
        "ios6": {
            "-p": "ios",
            "--log-level": "info",
            "-S": "6.0",
            "-C": "iPhone Retina (3.5 inch)"
        },
        "ios5": {
            "-p": "ios",
            "--log-level": "info",
            "-S": "5.1",
            "-C": "iPhone"
        },
        "64bit": {
            "-p": "ios",
            "--log-level": "info",
            "--tall": null,
            "--retina": null,
            "--sim-64bit": null,
            "-C": "iPhone Retina (4 inch 64-bit)"
        },
        "ipad": {
            "-p": "ios",
            "--log-level": "info",
            "-C": "iPad Retina",
            "-F": "universal"
        },
        "clean": {
            "-p": "ios",
            "--log-level": "info",
            "-f" : null
        }
    };
    var common_deploy_gate_options = {
    };
    return {
        "default_project": "project",
        "alias": {
            "project": "pj"
        },
        "project": {
            "use_sdk": "3.2.0.GA",
            "build_default": "ios7",
            "build": combine(common_build_options, {
                "dev": {
                    "--log-level": "info",
                    "-p": "ios",
                    "-V": "[xxxxxxxxxxxxxxxxxxxx]",
                    "-P": "[xxxxxxxxxxxxxxxxxxxx]",
                    "-T": "device",
                    "-C": "[xxxxxxxxxxxxxxxxxxxx]"
                },
                "adhoc": {
                    "--log-level": "info",
                    "-p": "ios",
                    "-T": "dist-adhoc",
                    "-R": "[xxxxxxxxxxxxxxxxxxxx]",
                    "-P": "[xxxxxxxxxxxxxxxxxxxx]",
                    "-O": "./"
                },
                "inhouse": {
                    "--log-level": "info",
                    "-p": "ios",
                    "-T": "dist-adhoc",
                    "-R": "[xxxxxxxxxxxxxxxxxxxx]",
                    "-P": "[xxxxxxxxxxxxxxxxxxxx]",
                    "-O": "./",
                    "identifier": ["[xxxxxxxxxxxxxxxxxxxx]", "[xxxxxxxxxxxxxxxxxxxx]"],
                    "teamid": ["[xxxxxxxxxxxxxxxxxxxx]", "[xxxxxxxxxxxxxxxxxxxx]"]
                },
                "appstore": {
                    "--log-level": "info",
                    "-p": "ios",
                    "-T": "dist-appstore",
                    "-R": "[xxxxxxxxxxxxxxxxxxxx]",
                    "-P": "[xxxxxxxxxxxxxxxxxxxx]"
                }
            }),
            "testflight": {
                "build_api": "http://testflightapp.com/api/builds.json",
                "api_token": "[xxxxxxxxxxxxxxxxxxxx]",
                "team_token": "[xxxxxxxxxxxxxxxxxxxx]",
                "default": {
                    "notify": true,
                    "distribution_lists": "developer"
                },
                "project_team": {
                    "notify": false,
                    "distribution_lists": "project_team"
                }
            },
            "deploygate": combine(common_deploy_gate_options, {})
        }
    };
})();


