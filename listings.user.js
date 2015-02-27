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
// @version             1.2.3.1
// ==/UserScript==

(function () {
    /*********** SETTINGS ***********/
    var reloadTime = 15;             //[seconds] default reload time
    /******** END OF SETTINGS *******/

    function addButton(prop, val, def) {
        sessionStorage.setItem(prop, sessionStorage.getItem(prop) || def);
        var button = document.createElement("a"),
            activated = JSON.parse(sessionStorage.getItem(prop));
        button.style = "margin-right: 5px; width: 100px;";
        button.classList.add("btn", `btn-${activated ? "success" : "danger"}`, "btn-sm");
        button.addEventListener("click", () => {
            var stat = !JSON.parse(sessionStorage.getItem(prop));
            sessionStorage.setItem(prop, stat);
            button.classList.toggle("btn-danger", !stat);
            button.classList.toggle("btn-success", stat);
            button.firstElementChild.classList.toggle("fa-toggle-off", !stat);
            button.firstElementChild.classList.toggle("fa-toggle-on", stat);
            if (prop === "paused")
                location.reload();
            else
                filter();
        });
        button.appendChild(createIcon(`toggle-${activated ? "on" : "off"}`, "border: none;"));
        button.appendChild(document.createTextNode(val));
        document.querySelector("#wrap > div:nth-child(4)").appendChild(button);
    }

    function check(element, toggle, query, content) {
        if (!JSON.parse(sessionStorage.getItem(toggle))) {
            var ele = element.querySelector(`.${query}`);
            if (ele)
                return content ? ele.textContent.contains(content) : true;
        }
        return false;
    }

    function createIcon(cls, style, content) {
        var icon = document.createElement("i");
        icon.classList.add("fa", `fa-${cls}`, "fa-inverse", "fa-border", "pull-left");
        icon.style = `border-radius: 50%;${style ? " " + style : ""}`;
        if (content)
            icon.appendChild(document.createTextNode(content));
        return icon;
    }

    function filter() {
        Array.prototype.forEach.call(document.getElementsByClassName("trade"), e => {
            var profit = +e.querySelector("span.trade-profit").textContent.match(/-?(?:\d+\.)?\d+?/);
            if (profit < +sessionStorage.getItem("minProfit") ||
                [["caution", "label-warning", "Caution"],
                 ["killstreak", "label-success", "Killstreak"],
                 ["painted", "paint1"],
                 ["parted", "label-success", "Strange Parts"],
                 ["gifted", "label-important", "Gifted"],
                 ["unusuals", "q-unusual"]].some(predicate => check(e, ...predicate)))
                e.style.display = "none";
            else
                e.style.display = "";
        });
        if (JSON.parse(sessionStorage.getItem("alert")))
            highlight();
        else {
            sessionStorage.removeItem("latest");
            if (modal)
                modal.close();
            removeHighlight();
        }
    }

    function highlight() {
        var vis = document.querySelector(".trade:not([style*='display: none'])");
        if (vis) {
            var trade = vis.querySelector("[href]").href.slice(28, 37);
            if (sessionStorage.getItem("latest") !== trade) {
                sessionStorage.setItem("latest", trade);
                removeHighlight();
                vis.lastElementChild.style.backgroundColor = "lime";
                Notification.requestPermission(permission => {
                    var amt = vis.querySelector("span.trade-profit").textContent.match(/-?(?:\d+\.)?\d+?/),
                        loc = vis.querySelector("[href^='/r/trade']").childNodes[2].textContent,
                        comp = vis.querySelector("div.trade-profit").getAttribute("data-original-title")
                                                                    .split(/(?:<br\/>|<\/u>)/),
                        msg = `${amt || 0}%${loc}\n[V]${comp[1]} [W]${comp[3]}`;
                    if (permission === "granted") {
                        modal = new Notification("Trade.tf Enhancer", {
                            body: msg,
                            icon: alertIcon
                        });
                        modal.addEventListener("click", () => alert(msg));
                    }
                    else
                        new Audio(alertSound).play();
                });
            }
        }
    }

    function removeHighlight() {
        var cur = document.querySelector(".trade-body[style*='background-color: lime']");
        if (cur)
            cur.style.backgroundColor = "";
    }

    function showStatus() {
        if (reloadTime) {
            var min = Math.floor(reloadTime / 60),
                sec = reloadTime-- % 60;
            data.textContent = ` Reloading in: ${min}:${("0" + sec).slice(-2)}`;
            document.title = `Trade.tf: ${min}:${("0" + sec).slice(-2)}`;
        } else {
            location.reload(true);
            clearInterval(showStatus);
        }
    }

    try {
        /******** SCRIPT GLOBALS ********/
        var listingsPage = /^http:\/\/www\.trade\.tf\/listings\/\d+$/.test(document.URL),
            alertIcon = "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/e6/" +
                        "e6ff6859b1c96e923a5051d54ee1f6e35c45094b_full.jpg",
            alertSound = "https://wiki.teamfortress.com/w/images/5/50/Notification_alert.wav",
            modal;
        /****** END SCRIPT GLOBALS ******/

        var style = document.querySelector("[href*='font-awesome']");
        style.href = style.href.replace("3.2.1", "4.3.0");
        Array.prototype.forEach.call(document.querySelectorAll("[class*='icon']"), e => {
            e.classList.add("fa");
            [["-check", "-check-square-o"],
             ["-info-sign", "-info-circle"],
             ["-ok-circle", "-check-circle-o"],
             ["-time", "-clock-o"],
             ["-white", "-inverse"],
             [/icon/g, "fa"]].forEach(f => e.className = e.className.replace(...f));
        });

        if (listingsPage) {
            var input = document.createElement("a"),
                style = document.createElement("style"),
                box = document.createElement("div"),
                wrap = document.getElementById("wrap");
            style.appendChild(document.createTextNode("[contenteditable] br { display: none; }" +
                                                      " * { -moz-user-select: none; }"));
            document.head.appendChild(style);
            sessionStorage.setItem("minProfit", sessionStorage.getItem("minProfit") || 5);
            input.appendChild(document.createTextNode(sessionStorage.getItem("minProfit")));
            input.classList.add("btn", "btn-info", "btn-sm");
            input.style = "width: 50px; margin-right: 5px; height: 21px; overflow: scroll;";
            input.contentEditable = "true";
            box.style = "margin: auto; display: table;";
            wrap.insertBefore(box, wrap.children[3]);
            [["caution", "Caution", true],
             ["killstreak", "Killstreak", true],
             ["painted", "Painted", true],
             ["parted", "Parted", true],
             ["gifted", "Gifted", true],
             ["unusuals", "Unusuals", false],
             ["alert", "Alert", false],
             ["paused", "Paused", false]].forEach(e => addButton(...e));
            box.appendChild(input);
            input.addEventListener("keyup", e => {
                if (e.which === 13 || e.which === 27)
                    input.blur();
                if (isFinite(input.textContent) && input.textContent.trim()) {
                    sessionStorage.setItem("minProfit", +input.textContent);
                    if (!JSON.parse(sessionStorage.getItem("paused")))
                        filter();
                }
            });
            input.addEventListener("blur", () => {
                input.textContent = sessionStorage.getItem("minProfit");
            });
            if (JSON.parse(sessionStorage.getItem("paused")))
                return console.info(`Trade.tf Script Paused. Version ${GM_info.script.version}`);
            filter();
            var data = document.createElement("small"),
                refresh = document.querySelector(".btn-reload").firstElementChild;
            data.style.color = "orange";
            document.querySelector(".btn-reload").parentNode.appendChild(data);
            document.querySelector(".clear-top").firstElementChild.style.clear = "both";
            refresh.classList.remove("fa-refresh");
            refresh.classList.add("fa-spinner", "fa-spin");
            setInterval(showStatus, 1000);
        }
        console.info(`Trade.tf Script Loaded. Version ${GM_info.script.version}`);
    } catch(e) {
        alert(`[A fatal error has occured]\n${e.message}\n[Stack Trace]\n${e.stack}`);
    }
})();