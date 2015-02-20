// ==UserScript==
// @copyright           ©2014 - 2015, Damian Ho
// @description         Helper script for Trade.tf
// @downloadURL         https://bitbucket.org/damianhxy/trade.tf-enhancer/raw/master/listings.user.js
// @include             /^http:\/\/www\.trade\.tf.*$/
// @exclude             /^http:\/\/www\.trade\.tf\/user\/mybot\/trades\/\d{17}\/offer$/
// @name                Trade.tf Enhancer
// @namespace           https://bitbucket.org/damianhxy
// @noframes
// @run-at              document-end
// @version             1.2.1.9
// ==/UserScript==

(function () {
    /*********** SETTINGS ***********/
    var reloadTime = 15;            //[seconds] default reload time
    /******** END OF SETTINGS *******/

    function addButton(prop, val, def) {
        sessionStorage.setItem(prop, sessionStorage.getItem(prop) || def);
        var button = document.createElement("a"),
            activated = JSON.parse(sessionStorage.getItem(prop));
        button.style = "margin-right: 5px; width: 100px;";
        button.className = "btn btn-" + (activated ? "success" : "danger") + " btn-sm";
        button.addEventListener("click", () => {
            window.stop();
            sessionStorage.setItem(prop, !JSON.parse(sessionStorage.getItem(prop)));
            location.reload();
        });
        button.appendChild(createIcon("toggle-" + (activated ? "on" : "off"), "border: none;"));
        button.appendChild(document.createTextNode(val));
        document.querySelector("#wrap > div:nth-child(4)").appendChild(button);
    }

    function check(element, toggle, query, content) {
        if (!JSON.parse(sessionStorage.getItem(toggle))) {
            var ele = element.querySelector("." + query);
            if (ele)
                return content ? ele.textContent.contains(content) : true;
        }
        return false;
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

    function showStatus() {
        if (reloadTime) {
            var min = Math.floor(reloadTime / 60),
                sec = reloadTime-- % 60;
            document.title = "Trade.tf: " + min + ":" + ("0" + sec).slice(-2);
            data.textContent = " Reloading in: " + min + ":" + ("0" + sec).slice(-2);
        } else {
            location.reload(true);
            clearInterval(showStatus);
        }
    }

    try {
        /******** SCRIPT GLOBALS ********/
        var listingsPage = /^http:\/\/www\.trade\.tf\/listings\/\d+$/.test(document.URL);
        /****** END SCRIPT GLOBALS ******/

        var style = document.querySelector("[href*='font-awesome']");
        style.href = style.href.replace("3.2.1", "4.3.0");
        Array.prototype.forEach.call(document.querySelectorAll("[class*='icon']"), e => {
            var cls = "fa " + e.className;
            e.className = cls.replace("-check", "-check-square-o").replace("-info-sign", "-info-circle")
                             .replace("-ok-circle", "-check-circle-o").replace("-time", "-clock-o")
                             .replace("-white", "-inverse").replace(/icon/g, "fa");
        });

        if (listingsPage) {
            var input = document.createElement("a"),
                style = document.createElement("style"),
                box = document.createElement("div"),
                wrap = document.getElementById("wrap");
            sessionStorage.setItem("minProfit", sessionStorage.getItem("minProfit") || 5);
            input.appendChild(document.createTextNode(sessionStorage.getItem("minProfit")));
            input.className = "btn btn-info btn-sm";
            input.style = "width: 50px; margin-right: 5px; height: 21px; overflow: scroll;";
            input.contentEditable = "true";
            style.appendChild(document.createTextNode("[contenteditable] br { display: none; }"));
            document.head.appendChild(style);
            box.style = "margin: auto; display: table;";
            wrap.insertBefore(box, wrap.children[3]);
            addButton("caution", "Caution", true);
            addButton("killstreak", "Killstreak", true);
            addButton("painted", "Painted", true);
            addButton("parted", "Parted", true);
            addButton("gifted", "Gifted", true);
            addButton("unusuals", "Unusuals", false);
            addButton("alert", "Alert", false);
            addButton("paused", "Paused", false);
            box.appendChild(input);
            input.addEventListener("keyup", e => {
                if (e.which === 13 || e.which === 27)
                    input.blur();
                if (isFinite(this.textContent) && this.textContent) {
                    sessionStorage.setItem("minProfit", +this.textContent);
                    if (!JSON.parse(sessionStorage.getItem("paused"))) {
                        Array.prototype.forEach.call(document.getElementsByClassName("trade"), e => {
                            if (+e.querySelector("span.trade-profit").textContent.match(/-?(?:\d+\.)?\d+?/) <
                                +sessionStorage.getItem("minProfit")) {
                                e.style.display = "none";
                                e.setAttribute("data-noprofit", null);
                            }
                            else if (!e.hasAttribute("data-hidden")) {
                                e.style.display = "";
                                e.removeAttribute("data-noprofit");
                            }
                        });
                    }
                }
            });
            input.addEventListener("blur", () => {
                this.textContent = sessionStorage.getItem("minProfit");
            });
            if (JSON.parse(sessionStorage.getItem("paused"))) {
                document.title = "Trade.tf: Paused";
                return console.info("Trade.tf Script Paused. Version " + GM_info.script.version);
            }
            Array.prototype.forEach.call(document.getElementsByClassName("trade"), e => {
                if (+e.querySelector("span.trade-profit").textContent.match(/-?(?:\d+\.)?\d+?/) <
                    +sessionStorage.getItem("minProfit")) {
                    e.style.display = "none";
                    e.setAttribute("data-noprofit", null);
                }
                else if ([["caution", "label-warning", "Caution"],
                          ["killstreak", "label-success", "Killstreak"],
                          ["painted", "paint1"],
                          ["parted", "label-success", "Strange Parts"],
                          ["gifted", "label-important", "Gifted"],
                          ["unusuals", "q-unusual"]].some(predicate => check(e, ...predicate))) {
                    e.style.display = "none";
                    e.setAttribute("data-hidden", null);
                }
            });
            if (JSON.parse(sessionStorage.getItem("alert")) || sessionStorage.removeItem("latest")) {
                var vis = document.querySelector(".trade:not([data-hidden]):not([data-noprofit])");
                if (vis) {
                    var trade = vis.querySelector("a").href.slice(28, 37);
                    if (sessionStorage.getItem("latest") !== trade) {
                        sessionStorage.setItem("latest", trade);
                        vis.lastElementChild.style.backgroundColor = "lime";
                        Notification.requestPermission(permission => {
                            var amt = vis.querySelector("span.trade-profit").textContent.match(/-?(?:\d+\.)?\d+?/),
                                loc = vis.querySelector("[href^='/r/trade']").childNodes[2].textContent,
                                comp = vis.querySelector("div.trade-profit").getAttribute("data-original-title")
                                                                            .split("</u> "),
                                msg = amt + "%" + loc + "\n[V] " + comp[1].split("<br/>")[0] + " [W] " + comp[2];
                            if (permission === "granted") {
                                var modal = new Notification("Trade.tf Enhancer", {
                                    body: msg,
                                    icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/e6/" +
                                          "e6ff6859b1c96e923a5051d54ee1f6e35c45094b_full.jpg"
                                });
                                modal.addEventListener("click", () => {
                                    alert(msg);
                                });
                            }
                            else
                                new Audio("https://wiki.teamfortress.com/w/images/5/50/Notification_alert.wav").play();
                        });
                    }
                }
            }
            var data = document.createElement("small");
            data.style.color = "orange";
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