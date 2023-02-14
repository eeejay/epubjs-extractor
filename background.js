browser.browserAction.onClicked.addListener((tab) => {
  browser.tabs.sendMessage(tab.id, "extract-epub");
});

browser.runtime.onMessage.addListener(msg => {
  if (msg.type == "epub") {
    let bookBlobURL = URL.createObjectURL(
      new Blob([msg.data.buffer], { type: "application/epub+zip" })
    );
    browser.downloads.download({url: bookBlobURL, filename: `${crypto.randomUUID()}.epub` })
  } else if (msg.type == "debug") {
    dump(`DEBUG: ${msg.msg}`);
  }
});