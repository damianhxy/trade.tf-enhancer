// ==UserScript==
// @copyright           2014, Damian Ho
// @description         Helper script for Trade.tf
// @downloadURL         https://bitbucket.org/damianhxy/trade.tf-enhancer/raw/master/listings.user.js
// @include             /^http:\/\/www\.trade\.tf.*$/
// @name                Trade.tf Enhancer
// @namespace           https://bitbucket.org/damianhxy
// @noframes
// @run-at              document-end
// @version             1.1.9.8
// ==/UserScript==

(function () {
    /*********** SETTINGS ***********/
    var randomTime = 0,              //[boolean] random reload time?
        defaultTime = 15,            //[seconds] default reload time
        randomMin = 10,              //[seconds] minimum random reload time
        randomMax = 20;              //[seconds] maximum random reload time
    /******** END OF SETTINGS *******/

    function addButton(prop, val, def) {
        sessionStorage.setItem(prop, sessionStorage.getItem(prop) || def);
        var button = document.createElement("a"),
            text = document.createTextNode(" " + val),
            activated = JSON.parse(sessionStorage.getItem(prop));
        button.style = "margin-right: 5px; width: 100px;";
        button.className = "btn btn-" + (activated ? "success" : "danger") + " btn-sm pull-right";
        button.addEventListener("click", function() {
            window.stop();
            sessionStorage.setItem(prop, !JSON.parse(sessionStorage.getItem(prop)));
            location.reload();
        });
        button.appendChild(createIcon("toggle-" + (activated ? "on" : "off"), "border: none;"));
        button.appendChild(text);
        document.querySelector("div[style^='width: 100%;']").appendChild(button);
    }

    function createIcon(cls, style, content) {
        var icon = document.createElement("i");
        icon.className = "fa fa-" + cls + " fa-inverse fa-border pull-left";
        icon.style = style;
        if (content)
            icon.appendChild(document.createTextNode(content));
        return icon;
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
            document.title = "Trade.tf: " + min + ":" + ("0" + sec).slice(-2);
            data.textContent = " Reloading in: " + min + ":" + ("0" + sec).slice(-2);
            reloadTime--;
        } else {
            document.querySelector(".btn-reload").click();
            clearInterval(showStatus);
        }
    }

    try {
        /******** SCRIPT GLOBALS ********/
        var listingsPage = /^http:\/\/www\.trade\.tf\/listings\/\d+$/.test(document.URL);
        /****** END SCRIPT GLOBALS ******/

        var style = document.querySelector("[href*='font-awesome']");
        style.href = style.href.replace("3.2.1", "4.2.0");
        Array.prototype.forEach.call(document.querySelectorAll("[class*='icon']"), function(e) {
            var cls = e.className;
            cls = cls.replace("-check", "-check-square-o").replace("-info-sign", "-info-circle")
                     .replace("-ok-circle", "-check-circle-o").replace("-time", "-clock-o")
                     .replace("-white", "-inverse");
            e.className = "fa " + cls.replace(/icon/g, "fa");
        });

        if (listingsPage) {
            var input = document.createElement("input");
            sessionStorage.setItem("minProfit", sessionStorage.getItem("minProfit") || 5);
            input.setAttribute("value", sessionStorage.getItem("minProfit"));
            input.style = "float: right; width: 50px; margin-right: 5px; text-align: center;";
            document.querySelector("div[style^='width: 100%']").appendChild(input);
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
                    if (!JSON.parse(sessionStorage.getItem("paused"))) {
                        Array.prototype.forEach.call(document.querySelectorAll("span.trade-profit"), function(e) {
                            if (+e.textContent.match(/-?\d+\.?\d+/) < +sessionStorage.getItem("minProfit"))
                                setDisplay(e, 3, "none");
                            else if (!e.parentNode.parentNode.parentNode.hasAttribute("data-hidden"))
                                setDisplay(e, 3, "");
                        });
                    }
                }
            });
            if (JSON.parse(sessionStorage.getItem("paused"))) {
                document.title = "Trade.tf: Paused";
                return console.info("Trade.tf Script Paused. Version " + GM_info.script.version);
            }
            Array.prototype.forEach.call(document.querySelectorAll("span.trade-profit"), function(e) {
                if (+e.textContent.match(/-?\d+\.?\d+/) < +sessionStorage.getItem("minProfit"))
                    setDisplay(e, 3, "none");
            });
            if (!JSON.parse(sessionStorage.getItem("caution"))) {
                Array.prototype.forEach.call(document.getElementsByClassName("label-warning"), function(e) {
                    if (e.textContent.contains("Caution"))
                        setDisplay(e, 4, "none", true);
                });
            }
            if (!JSON.parse(sessionStorage.getItem("killstreak"))) {
                Array.prototype.forEach.call(document.getElementsByClassName("label-success"), function(e) {
                    if (e.textContent.contains("Killstreak"))
                        setDisplay(e, 7, "none", true);
                });
            }
            if (!JSON.parse(sessionStorage.getItem("painted"))) {
                Array.prototype.forEach.call(document.getElementsByClassName("paint1"), function(e) {
                    setDisplay(e, 7, "none", true);
                });
            }
            if (!JSON.parse(sessionStorage.getItem("parted"))) {
                Array.prototype.forEach.call(document.getElementsByClassName("label-success"), function(e) {
                    if (e.textContent.contains("Strange Parts"))
                        setDisplay(e, 7, "none", true);
                });
            }
            if (!JSON.parse(sessionStorage.getItem("unpriced"))) {
                Array.prototype.forEach.call(document.getElementsByClassName("profit-even"), function(e) {
                    if (e.firstElementChild.textContent.contains("n/a"))
                        setDisplay(e, 2, "none", true);
                });
            }
            if (!JSON.parse(sessionStorage.getItem("unusuals"))) {
                Array.prototype.forEach.call(document.querySelectorAll("img.q-unusual"), function(e) {
                    setDisplay(e, 7, "none", true);
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
            data.style = "color: orange;";
            document.querySelector(".btn-reload").parentNode.appendChild(data);
            document.querySelector(".clear-top").firstElementChild.style.clear = "both";
            document.querySelector(".btn-reload").firstElementChild.classList.add("fa-spin");
            setInterval(showStatus, 1000);
        }
        console.info("Trade.tf Script Loaded. Version " + GM_info.script.version);
    } catch(e) {
        alert("[A fatal error has occured]\n" + e.message + "\n[Stack Trace]\n" + e.stack);
    }
})();