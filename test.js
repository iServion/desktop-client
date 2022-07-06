var fs = require('fs')
var axios = require('axios')
var FormData = require('form-data')
const concat = require("concat-stream")

/*

var data = fs.readFileSync( "test.txt",'utf8')
console.log(data);
var url = "http://monitoring.injani.com/api/client";
var config = {
    headers: {
        "X-Token" : "l21kdupf3pJqzFBxLMrvDszuzz9c"
    }
}

const fd = new FormData()
fd.append("code", "ANDY")
fd.append("file", fs.createReadStream("csv.csv"))
fd.pipe(concat({encoding: 'buffer'}, data => {
    var headers = fd.getHeaders();
    headers["x-Token"] = "l21kdupf3pJqzFBxLMrvDszuzz9c"
    axios.put(url,data, {
        headers: headers
    }).then(function (resp) {
        console.log(resp.data)
    })
}))
*/


const poshInstance = async (command) => {
    var output;
    const ps = new PowerShell({
        executionPolicy: 'Bypass',
        noProfile: true,
        inputFormat: 'Text',
        outputFormat: 'Text'
    });
    const getLG = PowerShell.command`${command}`
    output = await ps.invoke(getLG)
    await ps.dispose()

    return output
}

async function f() {
    var result = await poshInstance(`Get-Service  | ConvertTo-Json -Compress -Depth 99 `);

    var output = result.stdout;
    console.log(output)
    console.log(result)



    console.log(data)
    const b = Buffer.from(output);
    console.log(b.toString()); // example

    return result;
}
//f();

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



powShell(["Get-Service"]).then(function (data) {
    console.log("data");
    console.log(data);
    console.log("end data");

    var lines = data.split("\r\n");
    lines.forEach(function (line) {
        var explode = line.split(" ");
        console.log(explode)
    })
})
