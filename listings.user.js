// ==UserScript==
// @copyright           2014, Damian Ho
// @description         Trade.tf Freemium
// @downloadURL         https://github.com/damianhxy/Trade.tf-Freemium/raw/master/listings.user.js
// @grant               none
// @include             /^https?:\/\/www\.trade\.tf\/listings\/\d+/
// @name                Trade.tf Reloader
// @namespace           localhost
// @run-at              document-end
// @updateURL           https://github.com/damianhxy/Trade.tf-Freemium/raw/master/listings.meta.js
// @version             1.1.2
// ==/UserScript==

(function () {
    /*********** SETTINGS ***********/
    var randomTime = 0,              //(boolean) random reload time?
        defaultTime = 15,            //(seconds) default reload time
        randomMin = 10,              //(seconds) minimum random reload time
        randomMax = 20;              //(seconds) maximum random reload time
    /******** END OF SETTINGS *******/

    function addButton(prop, val, def) {
        var button = document.createElement("input");
        sessionStorage.setItem(prop, sessionStorage.getItem(prop) || def);
        button.setAttribute("style", "color: white; float: right; margin-right: 5px; padding: 5px; border-radius: 5px; border-color: black;" + "background-color: " + (JSON.parse(sessionStorage.getItem(prop)) ? "#628C2A;" : "#F15853;"));
        button.setAttribute("value", val);
        button.setAttribute("type", "button");
        button.setAttribute("onclick", "sessionStorage.setItem('" + prop + "', !JSON.parse(sessionStorage.getItem('" + prop + "'))); location.reload();");
        document.querySelectorAll("div[style^='width: 100%;']")[0].appendChild(button);
    }

    function hide(ele, lvls) {
        while (lvls--)
            ele = ele.parentNode;
        if (ele.style.display !== "none")
            ele.style.display = "none";
    }

    function range(lo, hi) {
        return Math.floor(Math.random() * (hi - lo + 1)) + lo;
    }

    function showStatus() {
        if (reloadTime) {
            var min = Math.floor(reloadTime / 60),
                sec = reloadTime % 60;
            window.document.title = "Trade.tf: " + min + ":" + ("0" + sec).slice(-2);
            data.innerHTML = "Reloading in: " + min + ":" + ("0" + sec).slice(-2);
            reloadTime--;
        }
        else
            document.getElementsByClassName("btn-reload")[0].click();
    }

    var input = document.createElement("input");
    sessionStorage.minProfit = sessionStorage.minProfit || 5;
    input.id = "minProfit";
    input.setAttribute("min", 1);
    input.setAttribute("onkeyup", "if(isFinite(this.value)){sessionStorage.setItem('minProfit', this.value);}"); //todo: add instant update
    input.setAttribute("value", sessionStorage.getItem("minProfit"));
    input.setAttribute("style", "float: right; width: 50px; margin-right: 5px; text-align: center;");
    document.querySelectorAll("div[style^='width: 100%;']")[0].appendChild(input);
    addButton("paused", "Paused", false);
    addButton("alert", "Alert", false);
    addButton("unusuals", "Unusuals", true);
    addButton("unpriced", "Unpriced", true)
    addButton("unconfirmed", "Unconfirmed", true);
    addButton("parted", "Parted", true);
    addButton("painted", "Painted", true);
    addButton("killstreak", "Killstreak", true);
    addButton("gifted", "Gifted", true);
    addButton("caution", "Caution", true);

    if (JSON.parse(sessionStorage.getItem("paused"))) {
        window.document.title = "Trade.tf: Paused";
        sessionStorage.removeItem("latest");
        return;
    }

    var profit = document.querySelectorAll("span.trade-profit");
    for (var a = 0; a < profit.length; a++) {
        var percent = profit[a].firstChild.nodeValue;
        if (!(+percent.split("%")[0] >= sessionStorage.getItem("minProfit")))
            hide(profit[a], 3);
        else if (!JSON.parse(sessionStorage.getItem("unconfirmed")) && percent === "n/a")
            hide(profit[a], 3);
    }

    if (!JSON.parse(sessionStorage.getItem("caution"))) {
        var caution = document.getElementsByClassName("label-warning");
        for (a = 0; a < caution.length; a++)
            if (caution[a].firstChild.nodeValue.contains("Caution"))
                hide(caution[a], 4);
    }
    if (!JSON.parse(sessionStorage.getItem("gifted"))) {
        var gifted = document.getElementsByClassName("icon-gift");
        for (a = 0; a < gifted.length; a++)
            hide(gifted[a], 8);
    }
    if (!JSON.parse(sessionStorage.getItem("killstreak"))) {
        var killstreak = document.getElementsByClassName("label-success");
        for (a = 0; a < killstreak; a++)
            if (killstreak[a].firstChild.nodeValue.contains("Killstreak"))
                hide(killstreak[a], 7);
    }
    if (!JSON.parse(sessionStorage.getItem("painted"))) {
        var painted = document.getElementsByClassName("paint1");
        for (a = 0; a < painted.length; a++)
            hide(painted[a], 7);
    }
    if (!JSON.parse(sessionStorage.getItem("parted"))) {
        var parted = document.getElementsByClassName("label-success");
        for (a = 0; a < parts; a++)
            if (parted[a].firstChild.nodeValue.contains("Strange Parts"))
                hide(parted[a], 7);
    }
    if (!JSON.parse(sessionStorage.getItem("unpriced"))) {
        var unpriced = document.getElementsByClassName("label-important");
        for (a = 0; a < unpriced; a++)
            if (unpriced[a].firstElementChild.getAttribute("data-original-title").contains("price set yet"))
                hide(unpriced[a], 6);
    }
    if (!JSON.parse(sessionStorage.getItem("unusuals"))) {
        var unusuals = document.querySelectorAll("[data-title^='Unusual']");
        for (a = 0; a < unusuals.length; a++)
            hide(unusuals[a], 6);
    }

    if (JSON.parse(sessionStorage.getItem("alert")) || sessionStorage.removeItem("latest")) {
        var latest = document.getElementsByClassName("profit-good");
        if (latest.length) {
            for (a = 0; a < latest.length; a++) {
                if (latest[a].parentNode.parentNode.style.display !== "none")
                    break;
            }
            if (a !== latest.length) {
                var tradeId = latest[a].nextElementSibling.firstElementChild.firstElementChild.firstElementChild.href.replace(/\d/g, ""),
                    audio = new Audio("https://wiki.teamfortress.com/w/images/5/50/Notification_alert.wav");
                if ((sessionStorage.getItem("latest") || 0) !== tradeId) {
                    sessionStorage.setItem("latest", tradeId);
                    audio.play();
                    latest[a].parentNode.nextElementSibling.style.backgroundColor = "#628C2A";
                }
            }
        }
    }

    var reloadTime = randomTime ? range(randomMin, randomMax) : defaultTime,
        data = document.createElement("small"),
        title = document.getElementsByClassName("btn-reload")[0].parentNode;
    data.setAttribute("style", "color: orange;");
    title.parentNode.insertBefore(data, title.nextSibling);
    setInterval(showStatus, 1000);
    console.info("Script Loaded.");
}).call(this);