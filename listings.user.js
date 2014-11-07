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
// @version             1.1.6.2
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
        button.setAttribute("style", "color: white; float: right; margin-right: 5px; width: 70px; padding: 5px; border-radius: 5px; border-color: black;" + "background-color: " + (JSON.parse(sessionStorage.getItem(prop)) ? "#628C2A;" : "#F15853;"));
        button.setAttribute("value", val);
        button.setAttribute("type", "button");
        button.setAttribute("onclick", "sessionStorage.setItem('" + prop + "', !JSON.parse(sessionStorage.getItem('" + prop + "'))); location.reload();");
        document.querySelectorAll("div[style^='width: 100%;']")[0].appendChild(button);
    }

    function setDisplay(ele, lvls, disp) {
        while (lvls--)
            ele = ele.parentNode;
        if (ele.style.display !== disp)
            ele.style.display = disp;
    }

    function range(lo, hi) {
        return Math.floor(Math.random() * (hi - lo + 1)) + lo;
    }

    function showStatus() {
        if (reloadTime) {
            var min = Math.floor(reloadTime / 60),
                sec = reloadTime % 60;
            window.document.title = "Trade.tf: " + min + ":" + ("0" + sec).slice(-2);
            data.innerHTML = " Reloading in: " + min + ":" + ("0" + sec).slice(-2);
            reloadTime--;
        }
        else
            document.getElementsByClassName("btn-reload")[0].click();
    }

    var input = document.createElement("input");
    sessionStorage.minProfit = sessionStorage.minProfit || 5;
    input.setAttribute("value", sessionStorage.getItem("minProfit"));
    input.setAttribute("style", "float: right; width: 50px; margin-right: 5px; text-align: center;");
    document.querySelectorAll("div[style^='width: 100%;']")[0].appendChild(input);
    addButton("paused", "Paused", false);
    addButton("alert", "Alert", false);
    addButton("unusuals", "Unusuals", false);
    addButton("unpriced", "N/A", true);
    addButton("parted", "Parted", true);
    addButton("painted", "Painted", true);
    addButton("killstreak", "Killstreak", true);
    addButton("caution", "Caution", true);

    input.addEventListener("keyup", function() {
        if (isFinite(this.value) && this.value.length) {
            sessionStorage.setItem("minProfit", this.value);
            if (JSON.parse(sessionStorage.getItem("paused")))
                return;
            var profit = document.querySelectorAll("span.trade-profit");
            for (var a = 0; a < profit.length; a++) {
                if (+profit[a].firstChild.nodeValue.split("%")[0] < sessionStorage.getItem("minProfit"))
                    setDisplay(profit[a], 3, "none");
                else
                    setDisplay(profit[a], 3, "");
            }
        }
    });

    if (JSON.parse(sessionStorage.getItem("paused"))) {
        window.document.title = "Trade.tf: Paused";
        return;
    }

    var profit = document.querySelectorAll("span.trade-profit");
    for (var a = 0; a < profit.length; a++) {
        if (+profit[a].firstChild.nodeValue.split("%")[0] < sessionStorage.getItem("minProfit"))
            setDisplay(profit[a], 3, "none");
    }
    if (!JSON.parse(sessionStorage.getItem("caution"))) {
        var caution = document.getElementsByClassName("label-warning");
        for (a = 0; a < caution.length; a++)
            if (caution[a].firstChild.nodeValue.contains("Caution"))
                setDisplay(caution[a], 4, "none");
    }
    if (!JSON.parse(sessionStorage.getItem("killstreak"))) {
        var killstreak = document.getElementsByClassName("label-success");
        for (a = 0; a < killstreak.length; a++)
            if (killstreak[a].firstChild.nodeValue.contains("Killstreak"))
                if (!killstreak[0].parentNode.parentNode.parentNode.firstElementChild.firstChild.nodeValue.contains("Fabricator"))
                    setDisplay(killstreak[a], 7, "none");
    }
    if (!JSON.parse(sessionStorage.getItem("painted"))) {
        var painted = document.getElementsByClassName("paint1");
        for (a = 0; a < painted.length; a++)
            setDisplay(painted[a], 7, "none");
    }
    if (!JSON.parse(sessionStorage.getItem("parted"))) {
        var parted = document.getElementsByClassName("label-success");
        for (a = 0; a < parts.length; a++)
            if (parted[a].firstChild.nodeValue.contains("Strange Parts"))
                setDisplay(parted[a], 7, "none");
    }
    if (!JSON.parse(sessionStorage.getItem("unpriced"))) {
        var unpriced = document.getElementsByClassName("profit-even");
        for (a = 0; a < unpriced.length; a++)
            if (unpriced[a].firstElementChild.firstChild.nodeValue.contains("n/a"))
                setDisplay(unpriced[a], 2, "none");
    }
    if (!JSON.parse(sessionStorage.getItem("unusuals"))) {
        var unusuals = document.querySelectorAll("img.q-unusual");
        for (a = 0; a < unusuals.length; a++)
            setDisplay(unusuals[a], 7, "none");
    }

    if (JSON.parse(sessionStorage.getItem("alert")) || sessionStorage.removeItem("latest")) {
        var latest = document.querySelectorAll("span.trade-profit");
        if (latest.length) {
            for (a = 0; a < latest.length; a++) {
                if (latest[a].parentNode.parentNode.parentNode.style.display !== "none")
                    break;
            }
            if (a !== latest.length) {
                var trade = latest[a].parentNode.nextElementSibling.firstElementChild.firstElementChild.firstElementChild.href.slice(28,37),
                    audio = new Audio("https://wiki.teamfortress.com/w/images/5/50/Notification_alert.wav");
                if ((sessionStorage.getItem("latest") || 0) !== trade) {
                    sessionStorage.setItem("latest", trade);
                    audio.play();
                    latest[a].parentNode.parentNode.nextElementSibling.style.backgroundColor = "#628C2A";
                }
            }
        }
    }

    var reloadTime = randomTime ? range(randomMin, randomMax) : defaultTime,
        data = document.createElement("small");
    data.setAttribute("style", "color: orange;");
    document.getElementsByClassName("btn-reload")[0].parentNode.appendChild(data);
    setInterval(showStatus, 1000);
    console.info("Trade.tf Script Loaded. Version " + GM_info.script.version);
}).call(this);