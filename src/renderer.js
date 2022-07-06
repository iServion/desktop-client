// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const socket = new WebSocket("ws://localhost:1040");
socket.onmessage = function(event) {
    var data = event.data;
    console.log(`dataku ${data}`);
    if(data) {
        var jsonData = JSON.parse(data);
        if(jsonData.eventName == "connecting") {
            getAndSet(jsonData);
        }
        if(jsonData.eventName == "check") {
            boxMessage(jsonData);
        }

    }
    $(".btn-loading-server").hide();
    $(".btn-loading-check").hide();
}

socket.onopen = function() {
    socket.send('Hello server!')
}
window.api.send("toMain","");


$("#save").on("click", function (e) {
    e.preventDefault();
    $(".btn-loading-server").show();
    $(".btn-loading-check").hide();
    saveApi();
});

$(".btn-check").on("click", function (e) {
    e.preventDefault();
    $(".btn-loading-check").show();
    $(".btn-loading-server").hide();
    window.api.send("toCheck","1");
});
$(".btn-update").on("click", function (e) {
    e.preventDefault();
    $(".btn-loading-check").show();
    $(".btn-loading-server").hide();
    window.api.send("toCheck","2");
});

function saveApi() {
    var url = $("#url").val(),
        code = $("#code").val(),
        token = $("#token").val();

    if(!isValidURL(url)){
        validated("#url", {
            message : "URL pattern is not valid!"
        });
        return false;
    }
    if(token == "" || (token && token.length < 5)) {
        validated("#token", {
            message : "Token is not valid!"
        });
        return false;
    }
    if(code == "" || (code && code.length < 2)) {
        validated("#code", {
            message : "Code is not valid!"
        });
        return false;
    }
    $("#code").closest("form").addClass("was-validated ");

    $(".invalid-feedback").each(function () {
        $(this).remove();
    });
    $(".is-invalid").each(function () {
        $(this).removeClass("is-invalid");
    });
    var data = {
        url :url.trim(),
        token :token.trim(),
        code : code.trim()
    }
    window.api.send("toServer",JSON.stringify(data));
}

var validated = (elementId, data) => {
    $(".invalid-feedback").each(function () {
        $(this).remove();
    });
    $(".is-invalid").each(function () {
        $(this).removeClass("is-invalid");
    });
    $(elementId).addClass("is-invalid");
    $(elementId).closest("div").append(`<div class="invalid-feedback">${data.message}</div>`);
    setTimeout(function () {
        $(elementId).closest("form").removeClass("was-validated ");
    },3000)
}

function boxMessage(msg) {
    //msg = msg ;
    $(".informations").show();
    $(".information").html(JSON.stringify(msg));
}

function isValidURL(string) {
    var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
}

function getAndSet(jsonData) {
    console.log(`Received ${jsonData} from main process`);
    boxMessage(jsonData);
    if(typeof jsonData == "string") {
        jsonData = JSON.parse(jsonData);
    }
    console.log(JSON.stringify(jsonData));
    if(jsonData.url) {
        $("#url").val(jsonData.url);
    }
    if(jsonData.code) {
        $("#code").val(jsonData.code);
    }
    if(jsonData.token) {
        $("#token").val(jsonData.token);
    }
    if(jsonData.connect == 1) {
        $(".btn-connected").show();
        $(".btn-disconnected").hide();
    } else {
        $(".btn-connected").hide();
        $(".btn-disconnected").show();
    }
}




