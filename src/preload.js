const {
    app,
    contextBridge,
    ipcRenderer,
    BrowserWindow,
    dialog
} = require("electron")
const path = require('path')
var myCache = require("./cache")
const axios = require("axios")
axios.defaults.adapter = require('axios/lib/adapters/http');
const {exec} = require("child_process")
var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
var FormData = require('form-data')
const concat = require("concat-stream")

// Get Global Variables
//let remote = require('electron').remote;

contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            console.log(`to${channel.toString()}`);
            // whitelist channels
            let validChannels = ["toMain"];
            if (validChannels.includes(channel)) {
                var jsonData = {}
                if (myCache.has("server")) {
                    jsonData = myCache.get("server");
                    ipcRenderer.send("onMain", JSON.stringify(jsonData));
                }

                //first time execute powershell policies
                powShell(['Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force']).then(function (result) {
                    ipcRenderer.send("onServer", JSON.stringify(jsonData));
                    console.log(result);
                    powShell(['Install-PackageProvider NuGet']).then(function (result) {
                        console.log(result);
                        ipcRenderer.send("onServer", JSON.stringify(jsonData));
                        powShell(['Install-Module PSWindowsUpdate']).then(function (result) {
                            console.log(result);
                            ipcRenderer.send("onServer", JSON.stringify(jsonData));
                        })
                    })
                })
            }

            //end toMain
            let toServer = ['toServer'];
            if (toServer.includes(channel)) {
                if(data) {
                    var jsonData = JSON.parse(data);
                    checkApi(jsonData).then(function (result) {
                        //console.log(JSON.stringify(result));
                        if (result.status == 1) {
                            jsonData.connect = 1;
                            myCache.set("server", jsonData);
                            console.log("success");
                        } else {
                            //failed info
                            //TODO
                            jsonData.connect = 0;
                            myCache.set("server", jsonData);
                            console.log("gagal");
                        }
                        //callback ipcRenderer
                        ipcRenderer.send("onServer", JSON.stringify(jsonData));
                    })
                }
            }
            //end toServer

            let toCheck = ['toCheck'];
            if (toCheck.includes(channel)) {
                if (myCache.has("server")) {
                    jsonData = myCache.get("server");
                    jsonData.connect = 1;
                    getData(jsonData, data).then(function (result) {
                        console.log(result);
                        ipcRenderer.send("onCheck", JSON.stringify(result));
                    });
                } else {
                    ipcRenderer.send("onServer", JSON.stringify({
                        connect :0,
                        url:"",
                        code:"",
                        token:""
                    }));
                }
            }
        }
    }
);

var checkApi = async (client) => {
    var url = client.url;
    var l = url.slice(url.length - 1);
    if (l == "/") {
        url = url + "api/check"
    } else {
        url = url + "/api/check"
    }
    var config = {
        headers: {
            "x-token": client.token
        }
    }
    var resp = await axios.post(url, {code: client.code}, config);
    return resp.data;
}

var getData =(client, type) => {
    return new Promise(function (resolve,reject) {
        command(type).then(function (result) {
            if(result.status==0) {
                return resolve({
                    status: 0,
                    message: result.message
                });
            } else {
                sendApi(client,type,result.message).then(function (result2) {
                    if(result2.status==0) {
                        return resolve({
                            status: 0,
                            message: result2.message
                        });
                    } else {
                        return resolve({
                            status: 1,
                            message: result2.message
                        });
                    }
                })
            }
        })
    });
}

var command = (type) => {
    if(type == 1) {
        return new Promise(function (resolve, reject) {
            wmic().then(function (result) {
                resolve(result)
            })
        })
    } else {
        return new Promise(function (resolve, reject) {
            var commands = ['Get-WindowsUpdate']
            powShell(commands).then(function (result) {
                resolve(result)
            })
        })
    }
}

var wmic = (file,format) => {
    file= file || 'csv.csv';
    format= format || 'csv';
    return new Promise(function (resolve, reject) {
        exec(`wmic /output:${file} product get name,version /format:${format}`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return resolve({
                    status: 0,
                    message: error.message
                });
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return resolve({
                    status: 0,
                    message: stderr.toString()
                });
            }
            myCache.set("csv", stdout.toString());
            myCache.set("csv2", stderr.toString());
            console.log(`stdout: ${stdout}`);

            return resolve({
                status: 1,
                message: stdout.toString()
            });
        });
    });
}


var powShell = (commands = []) => {
    var output ="";
    var arr = [];
    return new Promise(function (resolve, reject) {
        var spawn = require("child_process").spawn,child;
        child = spawn("powershell.exe",commands);
        child.stdout.on("data",function(data){
            //console.log("Powershell Data: " + data);
            data = data.toString();
            output += data;
        });
        child.stderr.on("data",function(data){
            //console.log("Powershell Errors: " + data);
            resolve({
                status:0,
                message:data.toString()
            })
        });
        child.on("exit",function(){
            //console.log("Powershell Script finished");
            resolve({
                status : 1,
                message: output
            })
        });
        child.stdin.end(); //end input
    })
}

/*

const poshInstance = async (command) => {
    var output;
    const ps = new PowerShell({
        executionPolicy: 'Bypass',
        noProfile: true
    });
    const getLG = PowerShell.command`${command}`
    output = await ps.invoke(getLG)
    await ps.dispose()
    console.log(output)
    return output
}
*/


var sendApi =  (client,type, datas = "") => {
    var url = '',file = '';
    if (type == 1) {
        url = client.url + "/api/client";
        file = 'csv.csv';
    } else if(type == 2) {
        url = client.url + "/api/windows-update";
        file = 'table.html';
    }

    return new Promise(function (resolve) {
        if(type == 1) {
            const fd = new FormData()
            fd.append("code", client.code)
            fd.append("file", fs.createReadStream(file))
            fd.pipe(concat({encoding: 'buffer'}, data => {
                var headers = fd.getHeaders();
                headers["x-Token"] = client.token;
                axios.put(url,data, {
                    headers: headers
                }).then(function (resp) {
                    console.log(resp.data)
                    resolve({
                        status: 1,
                        message:  resp.data
                    });
                })
            }))
        } else {
            axios.post(url,{
                code:client.code,
                content:datas
            }, {
                headers: {
                    "x-Token" : client.token
                }
            }).then(function (resp) {
                console.log(resp.data)
                resolve({
                    status: 1,
                    message:  resp.data
                });
            })
        }

    })
}
