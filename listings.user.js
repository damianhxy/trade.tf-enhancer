// ==UserScript==
// @copyright           2014, Damian Ho
// @description         Trade.tf Freemium
// @downloadURL         https://github.com/damianhxy/Trade.tf-Freemium/raw/master/listings.user.js
// @grant               none
// @include             /^https?:\/\/www\.trade\.tf.*/
// @name                Trade.tf Reloader
// @namespace           localhost
// @run-at              document-end
// @version             1.1.7.9
// ==/UserScript==

(function () {
    /*********** SETTINGS ***********/
    var randomTime = 0,              //[boolean] random reload time?
        defaultTime = 15,            //[seconds] default reload time
        randomMin = 10,              //[seconds] minimum random reload time
        randomMax = 20;              //[seconds] maximum random reload time
    /******** END OF SETTINGS *******/

    //FUNCTION DECLARATIONS
    function addButton(prop, val, def) {
        var button = document.createElement("a"),
            toggle = document.createElement("i"),
            text = document.createTextNode(" " + val);
        sessionStorage.setItem(prop, sessionStorage.getItem(prop) || def);
        button.setAttribute("style", "margin-right: 5px; width: 100px;");
        button.setAttribute("onclick", "sessionStorage.setItem('" + prop + "', !JSON.parse(sessionStorage.getItem('" + prop + "'))); location.reload();");
        button.setAttribute("class", "btn btn-success btn-sm pull-right");
        toggle.setAttribute("class", "fa fa-toggle-" + (JSON.parse(sessionStorage.getItem(prop)) ? "on" : "off"));
        button.appendChild(toggle);
        button.appendChild(text);
        document.querySelectorAll("div[style^='width: 100%;']")[0].appendChild(button);
    }

    function hide(ele, lvls) {
        while (lvls--)
            ele = ele.parentNode;
        if (!ele.hasAttribute("data-hidden")) {
            ele.setAttribute("data-hidden", "");
            ele.style.display = "none";
        }
    }

    function range(lo, hi) {
        return Math.floor(Math.random() * (hi - lo + 1)) + lo;
    }

    function setDisplay(ele, lvls, disp) {
        while (lvls--)
            ele = ele.parentNode;
        if (ele.style.display !== disp)
            ele.style.display = disp;
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

    //START OF SCRIPT
try {
    /******** SCRIPT GLOBALS ********/
    var listingsPage = window.location.href.match(/^https?:\/\/www\.trade\.tf\/listings\/\d+/);
    /****** END SCRIPT GLOBALS ******/

    document.querySelectorAll("[href*='font-awesome']")[0].href = "//cdnjs.cloudflare.com/ajax/libs/font-awesome/4.2.0/css/font-awesome.min.css";
    Array.prototype.forEach.call(document.querySelectorAll("[class*='icon']"), function(e) {
        var cls = e.className;
        cls = cls.replace("-check", "-check-square-o");
        cls = cls.replace("-info-sign", "-info-circle");
        cls = cls.replace("-ok-circle", "-check-circle-o");
        cls = cls.replace("-time", "-clock-o");
        cls = cls.replace("-white", "-inverse");
        e.className = "fa " + cls.replace(/icon/g, "fa");
    });

    if (listingsPage) {
        var input = document.createElement("input");

        sessionStorage.setItem("minProfit", sessionStorage.getItem("minProfit") || 5);
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
                Array.prototype.forEach.call(document.querySelectorAll("span.trade-profit"), function(e) {
                    if (+e.textContent.split("%")[0] < sessionStorage.getItem("minProfit"))
                        setDisplay(e, 3, "none");
                    else if (!e.parentNode.parentNode.parentNode.hasAttribute("data-hidden"))
                        setDisplay(e, 3, "");
                });
            }
        });

        if (JSON.parse(sessionStorage.getItem("paused"))) {
            window.document.title = "Trade.tf: Paused";
            return;
        }

        Array.prototype.forEach.call(document.querySelectorAll("span.trade-profit"), function(e) {
            if (+e.textContent.split("%")[0] < sessionStorage.getItem("minProfit"))
                setDisplay(e, 3, "none");
        });

        if (!JSON.parse(sessionStorage.getItem("caution"))) {
            Array.prototype.forEach.call(document.getElementsByClassName("label-warning"), function(e) {
                if (e.textContent.contains("Caution"))
                    hide(e, 4);
            });
        }
        if (!JSON.parse(sessionStorage.getItem("killstreak"))) {
            Array.prototype.forEach.call(document.getElementsByClassName("label-success"), function(e) {
                if (e.textContent.contains("Killstreak"))
                    hide(e, 7);
            });
        }
        if (!JSON.parse(sessionStorage.getItem("painted"))) {
            Array.prototype.forEach.call(document.getElementsByClassName("paint1"), function(e) {
                hide(e, 7);
            });
        }
        if (!JSON.parse(sessionStorage.getItem("parted"))) {
            Array.prototype.forEach.call(document.getElementsByClassName("label-success"), function(e) {
                if (e.textContent.contains("Strange Parts"))
                    hide(e, 7);
            });
        }
        if (!JSON.parse(sessionStorage.getItem("unpriced"))) {
            Array.prototype.forEach.call(document.getElementsByClassName("profit-even"), function(e) {
                if (e.firstElementChild.textContent.contains("n/a"))
                    hide(e, 2);
            });
        }
        if (!JSON.parse(sessionStorage.getItem("unusuals"))) {
            Array.prototype.forEach.call(document.querySelectorAll("img.q-unusual"), function(e) {
                hide(e, 7);
            });
        }

        if (JSON.parse(sessionStorage.getItem("alert")) || sessionStorage.removeItem("latest")) {
            var vis = document.querySelectorAll(".trade:not([data-hidden])") || [];
            if (vis.length) {
                var trade = vis[0].firstElementChild.children[1].firstElementChild.firstElementChild.firstElementChild.href.slice(28, 37);
                if (sessionStorage.getItem("latest") !== trade) {
                    sessionStorage.setItem("latest", trade);
                    vis[0].lastElementChild.style.backgroundColor = "lime";
                    new Audio("https://wiki.teamfortress.com/w/images/5/50/Notification_alert.wav").play();
                }
            }
        }

        var reloadTime = randomTime ? range(randomMin, randomMax) : defaultTime,
            data = document.createElement("small");
        data.setAttribute("style", "color: orange;");
        document.getElementsByClassName("btn-reload")[0].parentNode.appendChild(data);
        document.getElementsByClassName("clear-top")[0].firstElementChild.style.clear = "both";
        document.getElementsByClassName("btn-reload")[0].firstElementChild.className = "fa fa-cog fa-spin";
        setInterval(showStatus, 1000);
    }
    console.info("Trade.tf Script Loaded. Version " + GM_info.script.version);
}
catch(e) {
    alert("[An error has occured]\n" + e.message + "\n[Stack Trace]\n" + e.stack);
}
})();