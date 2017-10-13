function getCurrentTabUrl(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true,
    };

    chrome.tabs.query(queryInfo, (tabs) => {
        // chrome.tabs.query invokes the callback with a list of tabs that match the
        // query. When the popup is opened, there is certainly a window and at least
        // one tab, so we can safely assume that |tabs| is a non-empty array.
        // A window can only have one active tab at a time, so the array consists of
        // exactly one tab.
        var tab = tabs[0];

        // A tab is a plain object that provides information about the tab.
        // See https://developer.chrome.com/extensions/tabs#type-Tab
        var url = tab.url;

        // tab.url is only available if the "activeTab" permission is declared.
        // If you want to see the URL of other tabs (e.g. after removing active:true
        // from |queryInfo|), then the "tabs" permission is required to see their
        // "url" properties.
        console.assert(typeof url == 'string', 'tab.url should be a string');

        callback(tab);
    });

    // Most methods of the Chrome extension APIs are asynchronous. This means that
    // you CANNOT do something like this:
    //
    // var url;
    // chrome.tabs.query(queryInfo, (tabs) => {
    //   url = tabs[0].url;
    // });
    // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

function invertColors(tabId, strategy) {
    if(strategy) {
        chrome.tabs.insertCSS(tabId, {
            file: "app/styles.css",
        });

        return;
    }

    var code = 'window.location.reload();';

    chrome.tabs.executeScript(tabId, {code: code});

}

function getSavedThemeStatus(domain, callback) {
    // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
    // for chrome.runtime.lastError to ensure correctness even when the API call
    // fails.
    chrome.storage.sync.get(domain, (items) => {
        callback(chrome.runtime.lastError ? null : items[domain]);
    });
}

function saveThemeStatus(url, color) {
    var items = {};
    items[url] = color;
    // See https://developer.chrome.com/apps/storage#type-StorageArea. We omit the
    // optional callback since we don't need to perform any action once the
    // background color is saved.
    chrome.storage.sync.set(items);
}

function getHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    (url.indexOf("://") > -1) ? hostname = url.split('/')[2] : hostname = url.split('/')[0];

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

document.addEventListener('DOMContentLoaded', () => {
    getCurrentTabUrl((tab) => {
        var switcher = document.querySelector('#night-mode-switcher');
        var tabDomain = getHostname(tab.url);

        getSavedThemeStatus(tabDomain, strategy => {
            switcher.checked = strategy;
        });

        switcher.addEventListener('click', () => {
            invertColors(tab.id, switcher.checked);
            saveThemeStatus(tabDomain, switcher.checked);
        });
    });
});

chrome.webNavigation.onCompleted.addListener(() => {
    getCurrentTabUrl((tab) => {
        var tabDomain = getHostname(tab.url);
        var tabId = tab.id;

        getSavedThemeStatus(tabDomain, strategy => {
            if(strategy) {
                invertColors(tabId, strategy);
            }
        });
    });
});
