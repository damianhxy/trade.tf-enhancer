// ==UserScript==
// @copyright           ©2014 - 2015, Damian Ho
// @description         Helper script for Trade.tf
// @downloadURL         https://bitbucket.org/damianhxy/trade.tf-enhancer/raw/master/listings.user.js
// @include             /^https:\/\/www\.trade\.tf.*$/
// @exclude             /^https:\/\/www\.trade\.tf\/user\/mybot\/trades\/\d{17}\/offer$/
// @name                Trade.tf Enhancer
// @namespace           https://bitbucket.org/damianhxy
// @noframes
// @run-at              document-end
// @version             1.2.3.3
// ==/UserScript==

(function () {
    /*********** SETTINGS ***********/
    let reloadTime = 15;
    /******** END OF SETTINGS *******/

    const getBool = key => JSON.parse(sessionStorage.getItem(key));
    const getNum = key => +sessionStorage.getItem(key);

    function addButton(prop, val, def) {
        sessionStorage.setItem(prop, sessionStorage.getItem(prop) || def);
        const button = document.createElement("a");
        const activated = getBool(prop);
        button.style.cssText = "margin-right: 5px; width: 100px;";
        button.classList.add("btn", `btn-${activated ? "success" : "danger"}`, "btn-sm");
        button.addEventListener("click", () => {
            const stat = !getBool(prop);
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
        if (!getBool(toggle)) {
            const ele = element.querySelector(`.${query}`);
            if (ele)
                return content ? ele.textContent.includes(content) : true;
        }
        return false;
    }

    function createIcon(cls, style, content) {
        const icon = document.createElement("i");
        icon.classList.add("fa", `fa-${cls}`, "fa-inverse", "fa-border", "pull-left");
        icon.style.cssText = `border-radius: 50%;${style ? " " + style : ""}`;
        if (content)
            icon.appendChild(document.createTextNode(content));
        return icon;
    }

    function filter() {
        [...document.getElementsByClassName("trade")].forEach(e => {
            const profit = +e.querySelector("span.trade-profit").textContent.match(/-?(?:\d+\.)?\d+?/);
            if (profit < getNum("minProfit") ||
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
        if (getBool("alert"))
            highlight();
        else {
            sessionStorage.removeItem("latest");
            if (modal)
                modal.close();
            removeHighlight();
        }
    }

    function highlight() {
        const vis = document.querySelector(".trade:not([style*='display: none'])");
        if (!vis) return;
        const trade = vis.querySelector("[href]").href.slice(28, 37);
        if (sessionStorage.getItem("latest") === trade) return;
        sessionStorage.setItem("latest", trade);
        removeHighlight();
        vis.lastElementChild.style.backgroundColor = "lime";
        Notification.requestPermission().then(permission => {
            const amt = vis.querySelector("span.trade-profit").textContent.match(/-?(?:\d+\.)?\d+?/);
            const loc = vis.querySelector("[href^='/r/trade']").childNodes[2].textContent;
            const comp = vis.querySelector("div.trade-profit").getAttribute("data-original-title")
                                                              .split(/(?:<br\/>|<\/u>)/);
            const msg = `${amt || 0}%${loc}\n[V]${comp[1]} [W]${comp[3]}`;
            if (permission === "granted") {
                modal = new Notification("Trade.tf Enhancer", {
                    body: msg,
                    icon: alertIcon
                });
                modal.addEventListener("click", () => alert(msg));
            } else
                new Audio(alertSound).play();
        });
    }

    function removeHighlight() {
        const cur = document.querySelector(".trade-body[style*='background-color: lime']");
        if (cur)
            cur.style.backgroundColor = "";
    }

    function showStatus() {
        if (reloadTime) {
            const min = Math.floor(reloadTime / 60);
            const sec = reloadTime-- % 60;
            data.textContent = ` Reloading in: ${min}:${("0" + sec).slice(-2)}`;
            document.title = `Trade.tf: ${min}:${("0" + sec).slice(-2)}`;
        } else {
            location.reload();
            clearInterval(intervalId);
        }
    }

    let alertIcon;
    let alertSound;
    let modal;
    let data;
    let intervalId;

    try {
        /******** SCRIPT GLOBALS ********/
        const listingsPage = /^https:\/\/www\.trade\.tf\/listings\/\d+$/.test(document.URL);
        alertIcon = "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/e6/" +
                    "e6ff6859b1c96e923a5051d54ee1f6e35c45094b_full.jpg";
        alertSound = "https://wiki.teamfortress.com/w/images/5/50/Notification_alert.wav";
        /****** END SCRIPT GLOBALS ******/

        const faLink = document.querySelector("[href*='font-awesome']");
        if (faLink) {
            faLink.href = faLink.href.replace("3.2.1", "4.3.0");
        }
        [...document.querySelectorAll("[class*='icon']")].forEach(e => {
            e.classList.add("fa");
            [["-check", "-check-square-o"],
             ["-info-sign", "-info-circle"],
             ["-ok-circle", "-check-circle-o"],
             ["-time", "-clock-o"],
             ["-white", "-inverse"],
             [/icon/g, "fa"]].forEach(f => e.className = e.className.replace(...f));
        });

        if (listingsPage) {
            const input = document.createElement("a");
            const style = document.createElement("style");
            const box = document.createElement("div");
            const wrap = document.getElementById("wrap");
            style.appendChild(document.createTextNode("[contenteditable] br { display: none; }" +
                                                       " * { -moz-user-select: none; }"));
            document.head.appendChild(style);
            sessionStorage.setItem("minProfit", sessionStorage.getItem("minProfit") || 5);
            input.appendChild(document.createTextNode(sessionStorage.getItem("minProfit")));
            input.classList.add("btn", "btn-info", "btn-sm");
            input.style.cssText = "width: 50px; margin-right: 5px; height: 21px; overflow: scroll;";
            input.contentEditable = "true";
            box.style.cssText = "margin: auto; display: table;";
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
                if (e.key === "Enter" || e.key === "Escape")
                    input.blur();
                if (Number.isFinite(+input.textContent) && input.textContent.trim()) {
                    sessionStorage.setItem("minProfit", +input.textContent);
                    if (!getBool("paused"))
                        filter();
                }
            });
            input.addEventListener("blur", () => {
                input.textContent = sessionStorage.getItem("minProfit");
            });
            if (getBool("paused"))
                return console.info(`Trade.tf Script Paused. Version ${GM_info.script.version}`);
            filter();
            data = document.createElement("small");
            const refresh = document.querySelector(".btn-reload").firstElementChild;
            data.style.color = "orange";
            document.querySelector(".btn-reload").parentNode.appendChild(data);
            document.querySelector(".clear-top").firstElementChild.style.clear = "both";
            refresh.classList.remove("fa-refresh");
            refresh.classList.add("fa-spinner", "fa-spin");
            intervalId = setInterval(showStatus, 1000);
        }
        console.info(`Trade.tf Script Loaded. Version ${GM_info.script.version}`);
    } catch(e) {
        console.error(`[Trade.tf Enhancer Error]\n${e.message}\n[Stack Trace]\n${e.stack}`);
    }
})();