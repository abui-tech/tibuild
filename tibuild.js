#!/usr/bin/env node

/****
     - xcode5以上
     - Command Line Toolsインストール済み
     - titaniumコマンドインストール済み
     - appceleratorにログイン済み
       => titanium login [email] [pass]

     [自動化するかどうか]
     require:
     - https://github.com/caolan/async
       > sudo npm install async
     - https://www.npmjs.org/package/argv
       > sudo npm install argv

     setup:
     > ./tibuild.js -p [project_name] -a setup

     usage:
     > cd [tibuild.js dir]
     > ./tibuild.js => run on simulator for default project
     > ./tibuild.js -p project_name => run project
     > ./tibuild.js -b [adhoc|dev|inhouse|appstore] => build for distribution
     > ./tibuild.js -b adhoc --deploygate => deploy to deploygate by mixi

     overrride_build_option:
     > ./tibuild.js _f= => overrride force build
     > ./tibuild.js __log-level=trace -p project_name => overrride output log-level

     show options:
     > ./tibuild.js -h
****/

/*
// global variables
var app_config = {}, project_dir = "";

// require modules
var require_modules = ['argv', 'readline', 'fs', 'path', 'child_process', 'async'],
    modules = {},
    unload_modules = []
;

require_modules.forEach(function (module) {
    try {
        modules[ module ] = require( module );
    } catch (e) {
        unload_modules.push( module );
    }
});
*/

var argv = argv = require('argv'),
    readline = require('readline'),
    rl = readline.createInterface(process.stdin, process.stdout),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    async = require('async'),
    app_config = {},
    project_dir = "",
    script_path = process.argv[1]
;

var options = argv.option(
    [
        {
            name: 'testflight',
            type: 'string',
            description: 'deploy to testflight service.',
            example: "./tibuild.js build adhoc --testflight"
        },
        {
            name: 'deploygate',
            type: 'string',
            description: 'deploy to deploygate service by mixi.',
            example: './tibuild.js build adhoc --deploygate'
        },
        {
            name: 'build-list',
            type: 'string',
            description: 'output build list',
            example: './tibuild.js --build-list'
        },
        {
            name: 'project',
            type: 'string',
            short: 'p',
            description: 'target project',
            example: 'tibuild.js -p project_name'
        },
        {
            name: 'build',
            type: 'string',
            short: 'b',
            description: 'build type',
            example: './tibuild.js -p project_name -b adhoc'
        },
        {
            name: 'action',
            type: 'string',
            short: 'a',
            description: 'build action',
            example: './tibuild.js -a setup'
        },
        {
            name: 'message',
            type: 'string',
            short: 'm',
            description: 'update message',
            example: './tibuild.js -b adhoc --deploygate -m xyz'
        }
    ]
).run().options;

var overrride_build_options = process.argv.filter(function (argv) {
    return /^_+/.test( argv ) && /=/.test( argv );
});

async.series(
    [
        function (callback) {
            exec('which titanium', function (err, stdout, stderr) {
                if ( /titanium/.test( stdout ) ) {
                    callback();
                } else {
                    console.log("should install titanium studio before exec. go to http://www.appcelerator.com/");
                }
            });
        },
        function (callback) {
            exec('titanium status', function (err, stdout, stderr) {
                if ( /logged out/.test( stdout ) ) {
                    var username, password;
                    rl.question("user: ", function (_username) {
                        username = _username;
                        rl.question('password: ', function (_password) {
                            rl.close();
                            password = _password;
                            if ( username && password ) {
                                exec('titanium login ' + username + ' ' + password, function (err, stdout, stderr) {
                                    if ( /Logged in successfully/.test( stdout ) ) {
                                        console.log(stdout) || callback();
                                    } else {
                                        console.log('can not login to appcelerator...');
                                        console.log(stdout);
                                        process.exit();
                                    }
                                });
                            } else {
                                console.log('can not login to appcelerator...');
                                process.exit();
                            }
                        });
                    });
                } else {
                    callback();
                }
            });
        },
        function (callback) {
            fs.readFile( __dirname + '/tibuild.config.js', 'utf8', function (err, text) {
                if ( err ) {
                    console.log(err);
                    process.exit();
                } else {
                    try {
                        app_config = eval( text );
                        callback();
                    } catch (e) {
                        console.log(e);
                        process.exit();
                    }
                }
            });
        },
        function (callback) {
            var project = options.project || app_config.default_project;
            if ( app_config.alias && app_config.alias.hasOwnProperty( project ) ) {
                project = app_config.alias[ project ];
            }
            if ( app_config.hasOwnProperty( project ) ) {
                app_config = app_config[ project ];
                if ( app_config.hasOwnProperty('project_dir') ) {
                    project_dir = app_config.project_dir;
                } else {
                    var copied_script_path = script_path;
                    while ( /\//.test( copied_script_path ) ) {
                        if ( copied_script_path = copied_script_path.slice(0, copied_script_path.lastIndexOf('/')) ) {
                            try {
                                fs.statSync( project_dir = ( copied_script_path + "/" + project ) );
                                break;
                            } catch (e) {
                                // next
                            }
                        } else {
                            break;
                        }
                    }
                }
                if ( project_dir ) {
                    process.chdir(project_dir);
                    callback();
                    return;
                }
            }
            console.log('[ERROR] ' + project + ' is not found..');
            process.exit();
        },
        function (callback) {
            if ( options["build-list"] ) {
                console.log('[OUTPUT BUILD LIST]');
                console.log( Object.keys( app_config.build ).map(function(x){ return " - " + x; }).join("\n") );
                process.exit();
            } else {
                callback();
            }
        },
        function (callback) {
            var branch = options.branch || app_config.branch;
            //return callback();
            if ( branch ) {
                async.series(
                    [
                        function (child_callback) {
                            exec('which git', function (err, stdout, stderr) {
                                /git/.test( stdout ) ? child_callback() : console.log(stderr||stdout) || process.exit();
                            });
                        },
                        function (child_callback) {
                            exec('git symbolic-ref --short HEAD', function (err, stdout, stderr) {
                                stdout = ( stdout || "" ).trim();
                                ( stdout == branch ? console.log("[SUCCESS] already switched branch: " + stdout) || callback() : child_callback() );
                            });
                        },
                        function (child_callback) {
                            exec('git checkout ' + branch, function (err, stdout, stderr) {
                                console.log( ( stdout || stderr ).trim() );
                                child_callback();
                            });
                        },
                        function (child_callback) {
                            exec('git symbolic-ref --short HEAD', function (err, stdout, stderr) {
                                stdout = ( stdout || "" ).trim();
                                console.log('[' + ( stdout == branch ? "SUCCESS" : "FAILED" ) + '] switched branch: ' + stdout);
                                callback();
                            });
                        }
                    ],
                    function (err, results) {
                        if (err) { throw err; }
                    }
                );
            } else {
                callback();
            }
        },
        function (callback) {
            var action = options.action || "build";
            async.series(
                [
                    function (callback) {
                        if ( app_config.hasOwnProperty('use_sdk') ) {
                            exec('titanium sdk select ' + app_config.use_sdk, function (err, stdout, stderr) {
                                stderr ? console.log( stderr ) || process.exit() : callback();
                            });
                        } else {
                            callback();
                        }
                    },
                    function (callback) {
                        var commands = new Commands();
                        if ( commands[ action ] ) {
                            console.log('[INFO] project dir is ' + project_dir + " : " + action);
                            commands[ action ]();
                            //process.exit();
                        } else {
                            console.log('[ERROR] ' + action + ' is not found.');
                            process.exit();
                        }
                    }
                ],
                function (err, results) {
                    if (err) { throw err; }
                }
            );
        }
    ],
    function (err, results) {
        if (err) { throw err; }
        console.log('series all done. ' + results);
    }
);

function Commands () {}
Commands.prototype.setup = function (argv) {
    async.series(
        [
            function (callback) {
                var require_commands = ['find', 'unzip', 'xargs', 'grep'];
                exec('which ' + require_commands.join(' '), function (err, stdout, stderr) {
                    if ( require_commands.every(function (command) {
                        return new RegExp( command ).test( stdout );
                    }) ) {
                        callback();
                    } else {
                        console.log( stderr || "require " + require_commands.join(" and ") + " command." );
                    }
                });
            },
            function (callback) {
                exec('find ./source -name "*.zip"', function (err, stdout, stderr) {
                    if ( stderr ) {
                        console.log( stderr ) || process.exit();
                    } else {
                        var unzip_source_callbacks = [];
                        stdout.trim().split(/\r\n|\r|\n/).forEach(function (path) {
                            unzip_source_callbacks.push(function (callback2) {
                                exec('unzip -o -d ./ ' + path, function (err, stdout, stderr) {
                                    console.log(stdout);
                                    callback2();
                                });
                            });
                        });
                        async.series(unzip_source_callbacks, function (err, results) {
                            if (err) { throw err; }
                            callback();
                        });
                    }
                });
            },
            function (callback) {
                var frameworks_dir = project_dir + "/frameworks";
                console.log(frameworks_dir);
                exec('find ./modules/iphone -name "module.xcconfig" | xargs grep -l " \\-F\\""', function (err, stdout, stderr) {
                    if ( stderr ) {
                        console.log( stderr ) || process.exit();
                    } else {
                        var replace_framework_ref_callbacks = [];
                        stdout.trim().split(/\r\n|\r|\n/).forEach(function (path) {
                            replace_framework_ref_callbacks.push(function (callback2) {
                                fs.readFile(path, 'utf8', function (err, text) {
                                    if ( err ) {

                                    } else {
                                        fs.writeFile(path, text.replace(/ -F"(.*?)"/, ' -F"' + frameworks_dir + '"'), function (err) {
                                            var old_frameworks_dir = RegExp.$1;
                                            err ? console.log( err ) || process.exit() : console.log('rewrite framework ref dir: ' + path + " ::: [" + old_frameworks_dir + " => " + frameworks_dir + "]") || callback2();
                                        });
                                    }
                                });
                            });
                        });
                        async.series(replace_framework_ref_callbacks, function (err, results) {
                            if (err) { throw err; }
                            callback();
                        });
                    }
                });
            },
            function (callback) {
                exec('titanium clean', function (err, stdout, stderr) {
                    console.log(stdout || stderr) || callback();
                });
            },
            function (callback) {
                console.log('SETUP OK!');
                process.exit();
            }
        ],
        function (err, results) {
            if (err) { throw err; }
            console.log('series all done. ' + results);
            process.exit();
    });
}

Commands.prototype.build = function () {
    var is_inhouse = false;
    var use_config;
    if ( use_config = app_config.build[ options.build || app_config.build_default ] ) {
        var titanium_args = ['build'];
        if ( use_config.hasOwnProperty('identifier') || use_config.hasOwnProperty('teamid') ) {
            use_config.hasOwnProperty('identifier') && exec('sed -i.tiorig "s/' + use_config.identifier[0] + '/' + use_config.identifier[1] + '/g" Info.plist tiapp.xml Entitlements.plist', function (err, stdout, stderr) {});
            use_config.hasOwnProperty('teamid') && exec('sed -i.tibk "s/' + use_config.teamid[0] + '/' + use_config.teamid[1] + '/g" Entitlements.plist', function (err, stdout, stderr) {});
            ['identifier', 'teamid'].forEach(function (x) {
                delete use_config[x];
            });
            is_inhouse = true;
        }
        if ( overrride_build_options.length > 0 ) {
            overrride_build_options.forEach(function (str) {
                var opt = str.split('='), key = opt[0], value = opt[1];
                key = key.replace(/_/g, '-');
                !value && ( value = null );
                use_config[ key ] = value;
            });
        }
        Object.keys( use_config ).forEach(function (key) {
            titanium_args.push( key );
            use_config[key] && titanium_args.push( use_config[key] );
        });
        console.log('> titanium ' + titanium_args.join(' '));
        var titanium_build = spawn('titanium', titanium_args);
        var package_name;
        titanium_build.stdout.on('data', function (data) {
            var log_text = data.toString().trim();
            console.log( log_text );
            if ( log_text.match(/Project built successfully/) ) {
                if ( is_inhouse ) {
                    is_inhouse = false;
                    var arguments_callee = arguments.callee;
                    var saved_log_text = log_text;
                    async.series(
                        [
                            function (callback) {
                                exec('ls | grep .tibk', function (err, stdout, stderr) {
                                    var fnames = ( stdout || "" ).trim().split(/\r\n|\r|\n/);
                                    var fcount = fnames.length;
                                    var finished_fcount = 0;
                                    fnames.forEach(function (fname) {
                                        fs.unlink(fname, function(err){
                                            err && console.log(err);
                                            if ( ++finished_fcount == fcount ) {
                                                callback();
                                            }
                                        });
                                    });
                                });
                            },
                            function (callback) {
                                exec('ls | grep .tiorig', function (err, stdout, stderr) {
                                    var fnames = ( stdout || "" ).trim().split(/\r\n|\r|\n/);
                                    var fcount = fnames.length;
                                    var finished_fcount = 0;
                                    fnames.forEach(function (fname) {
                                        var orig_fname = fname.replace('.tiorig', '');
                                        fs.unlink(orig_fname, function(err){
                                            err ? console.log( err ) : exec('mv ' + fname + ' ' + orig_fname, function () {
                                                if ( ++finished_fcount == fcount ) {
                                                    callback();
                                                }
                                            });
                                        });
                                    });
                                });
                            }
                        ],
                        function (err, results) {
                            if (err) { console.log(err); throw err; }
                            //console.log('series all done. ' + results);
                            arguments_callee('[FROM INHOUSE OPERATOR] ' + saved_log_text);
                            //process.exit();
                        }
                    );
                } else if ( options.testflight && app_config.testflight && package_name ) {
                    var testflight_opt = app_config.testflight.hasOwnProperty( options.testflight ) ? app_config.testflight[ options.testflight ] : app_config.testflight.default;
                    async.series(
                        [
                            function (callback) {
                                exec('which curl', function (err, stdout, stderr) {
                                    if ( /curl/.test( stdout ) ) {
                                        callback();
                                    } else {
                                        console.log('could not find curl..');
                                    }
                                });
                            },
                            function (callback) {
                                var command = "curl {API} -F file=@{FILE} -F api_token='{API_TOKEN}' -F team_token='{TEAM_TOKEN}'"
                                    .replace("{API}", app_config.testflight.build_api)
                                    .replace("{FILE}", project_dir + "/" + package_name)
                                    .replace("{API_TOKEN}", app_config.testflight.api_token)
                                    .replace("{TEAM_TOKEN}", app_config.testflight.team_token)
                                ;
                                Object.keys( testflight_opt ).forEach(function (key) {
                                    command += ( " -F " + key + "='" + testflight_opt[key] + "'" );
                                });
                                rl.question("note: ", function (note) {
                                    note = note || "";
                                    command += " -F notes='" + note + "'";
                                    rl.close();

                                    console.log( command );

                                    exec( command, function (err, stdout, stderr) {
                                        console.log( err ? err : stdout );
                                        process.exit();
                                    });
                                });
                            }
                        ],
                        function (err, results) {
                            if (err) { console.log(err); throw err; }
                            console.log('series all done. ' + results);
                            process.exit();
                        }
                    );
                } else if ( options.deploygate && app_config.deploygate && package_name ) {
                    var deploygate_opt = app_config.deploygate.hasOwnProperty( options.deploygate ) ? app_config.deploygate[ options.deploygate ] : app_config.deploygate.default;
                    async.series(
                        [
                            function (callback) {
                                var command = 'curl -F "file=@{FILE}" -F "token={token}" -F "message={note}" {end_point}'
                                    .replace("{FILE}", project_dir + "/" + package_name)
                                    .replace("{token}", deploygate_opt.token)
                                    .replace("{end_point}", deploygate_opt.end_point)
                                ;
                                rl.question("note: ", function (note) {
                                    note = note || "";
                                    command = command.replace("{note}", note);
                                    console.log( command );

                                    exec( command, function (err, stdout, stderr) {
                                        console.log( err ? err : stdout );
                                        process.exit();
                                    });
                                });
                            }
                        ],
                        function (err, results) {
                            if (err) { console.log(err); throw err; }
                            console.log('series all done. ' + results);
                            process.exit();
                        }
                    );
                } else {
                    process.exit();
                }
            } else if ( package_name = ( log_text.match(/Package location: .*\/(.*\.ipa)/) || ["", ""] )[1] ) {
                console.log('[INFO] Package name: ' + package_name);
            }
        });
        titanium_build.stderr.on('data', function(data) {
            console.log('titanium build stderr: ' + data.toString().trim());
        });
        titanium_build.on('exit', function(code) {
            if (code !== 0) {
                console.log( 'titanium build error code: ' + code );
            }
        });
    } else {
        console.log('[ERROR] ' + options.build + " is not found.");
        process.exit();
    }
}



