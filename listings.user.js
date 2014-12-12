// ==UserScript==
// @copyright           2014, Damian Ho
// @description         Helper script for Trade.tf
// @grant               none
// @include             /^http:\/\/www\.trade\.tf.*/
// @name                Trade.tf Enhancer
// @namespace           https://bitbucket.org/
// @noframes
// @run-at              document-end
// @version             1.1.8.9
// ==/UserScript==

(function () {
    /*********** SETTINGS ***********/
    var randomTime = 0,              //[boolean] random reload time?
        defaultTime = 15,            //[seconds] default reload time
        randomMin = 10,              //[seconds] minimum random reload time
        randomMax = 20;              //[seconds] maximum random reload time
    /******** END OF SETTINGS *******/

    function addButton(prop, val, def, global) {
        if (global)
            localStorage.setItem(prop, localStorage.getItem(prop) || def);
        else
            sessionStorage.setItem(prop, sessionStorage.getItem(prop) || def);
        var button = document.createElement("a"),
            toggle = document.createElement("i"),
            text = document.createTextNode(" " + val),
            activated;
        if (global)
            activated = JSON.parse(localStorage.getItem(prop));
        else
            activated = JSON.parse(sessionStorage.getItem(prop));
        button.style = "margin-right: 5px; width: 100px;";
        button.className = "btn btn-" + (activated ? "success" : "danger") + " btn-sm pull-right";
        button.addEventListener("click", function() {
            window.stop();
            if (global)
                localStorage.setItem(prop, !JSON.parse(localStorage.getItem(prop)));
            else
                sessionStorage.setItem(prop, !JSON.parse(sessionStorage.getItem(prop)));
            location.reload();
        });
        toggle.className = "fa fa-toggle-" + (activated ? "on" : "off");
        button.appendChild(toggle);
        button.appendChild(text);
        document.querySelector("div[style^='width: 100%;']").appendChild(button);
    }

    function range(lo, hi) {
        return Math.floor(Math.random() * (hi - lo + 1)) + lo;
    }

    function setDisplay(ele, lvls, disp, hide) {
        while (lvls--)
            ele = ele.parentNode;
        ele.style.display = disp;
        if (hide)
            ele.setAttribute("data-hidden", "");
    }

    function showStatus() {
        if (reloadTime) {
            var min = Math.floor(reloadTime / 60),
                sec = reloadTime % 60;
            window.document.title = "Trade.tf: " + min + ":" + ("0" + sec).slice(-2);
            data.innerHTML = " Reloading in: " + min + ":" + ("0" + sec).slice(-2);
            reloadTime--;
        } else
            document.querySelector(".btn-reload").click();
    }

    try {
        /******** SCRIPT GLOBALS ********/
        var listingsPage = window.location.href.match(/^https?:\/\/www\.trade\.tf\/listings\/\d+/);
        /****** END SCRIPT GLOBALS ******/

        var style = document.querySelector("[href*='font-awesome']");
        style.href = style.href.replace("3.2.1", "4.2.0");
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
            document.querySelector("div[style^='width: 100%']").appendChild(input);
            addButton("paused", "Paused", 0, 1);
            addButton("alert", "Alert", 0);
            addButton("unusuals", "Unusuals", 0);
            addButton("unpriced", "N/A", 1);
            addButton("parted", "Parted", 1);
            addButton("painted", "Painted", 1);
            addButton("killstreak", "Killstreak", 1);
            addButton("caution", "Caution", 1);
            input.addEventListener("keyup", function() {
                if (isFinite(this.value) && this.value.length) {
                    sessionStorage.setItem("minProfit", this.value);
                    if (JSON.parse(localStorage.getItem("paused")))
                        return;
                    Array.prototype.forEach.call(document.querySelectorAll("span.trade-profit"), function(e) {
                        if (+e.textContent.split("%")[0] < sessionStorage.getItem("minProfit"))
                            setDisplay(e, 3, "none");
                        else if (!e.parentNode.parentNode.parentNode.hasAttribute("data-hidden"))
                            setDisplay(e, 3, "");
                    });
                }
            });

            if (JSON.parse(localStorage.getItem("paused"))) {
                window.document.title = "Trade.tf: Paused";
                console.info("Trade.tf Script Paused. Version " + GM_info.script.version);
                return;
            }

            Array.prototype.forEach.call(document.querySelectorAll("span.trade-profit"), function(e) {
                if (+e.textContent.split("%")[0] < sessionStorage.getItem("minProfit"))
                    setDisplay(e, 3, "none");
            });

            if (!JSON.parse(sessionStorage.getItem("caution"))) {
                Array.prototype.forEach.call(document.getElementsByClassName("label-warning"), function(e) {
                    if (e.textContent.contains("Caution"))
                        setDisplay(e, 4, "none", 1);
                });
            }
            if (!JSON.parse(sessionStorage.getItem("killstreak"))) {
                Array.prototype.forEach.call(document.getElementsByClassName("label-success"), function(e) {
                    if (e.textContent.contains("Killstreak"))
                        setDisplay(e, 7, "none", 1);
                });
            }
            if (!JSON.parse(sessionStorage.getItem("painted"))) {
                Array.prototype.forEach.call(document.getElementsByClassName("paint1"), function(e) {
                    setDisplay(e, 7, "none", 1);
                });
            }
            if (!JSON.parse(sessionStorage.getItem("parted"))) {
                Array.prototype.forEach.call(document.getElementsByClassName("label-success"), function(e) {
                    if (e.textContent.contains("Strange Parts"))
                        setDisplay(e, 7, "none", 1);
                });
            }
            if (!JSON.parse(sessionStorage.getItem("unpriced"))) {
                Array.prototype.forEach.call(document.getElementsByClassName("profit-even"), function(e) {
                    if (e.firstElementChild.textContent.contains("n/a"))
                        setDisplay(e, 2, "none", 1);
                });
            }
            if (!JSON.parse(sessionStorage.getItem("unusuals"))) {
                Array.prototype.forEach.call(document.querySelectorAll("img.q-unusual"), function(e) {
                    setDisplay(e, 7, "none", 1);
                });
            }

            if (JSON.parse(sessionStorage.getItem("alert")) || sessionStorage.removeItem("latest")) {
                var vis = document.querySelector(".trade:not([data-hidden])");
                if (vis) {
                    var trade = vis.querySelector("[href]").href.slice(28, 37);
                    if (sessionStorage.getItem("latest") !== trade) {
                        sessionStorage.setItem("latest", trade);
                        vis.lastElementChild.style.backgroundColor = "lime";
                        new Audio("https://wiki.teamfortress.com/w/images/5/50/Notification_alert.wav").play();
                    }
                }
            }

            var reloadTime = randomTime ? range(randomMin, randomMax) : defaultTime,
                data = document.createElement("small");
            data.setAttribute("style", "color: orange;");
            document.querySelector(".btn-reload").parentNode.appendChild(data);
            document.querySelector(".clear-top").firstElementChild.style.clear = "both";
            document.querySelector(".btn-reload").firstElementChild.className += " fa-spin";
            setInterval(showStatus, 1000);
        }
        console.info("Trade.tf Script Loaded. Version " + GM_info.script.version);
    } catch(e) {
        alert("[An error has occured]\n" + e.message + "\n[Stack Trace]\n" + e.stack);
    }
})();