function debug(msg) {
  browser.runtime.sendMessage({type: "debug", msg });
}

async function decipherPageTask() {
  let _book = Object.values(window).find(v => {
    try {
      return v && !!v.spine && !!v.opening;
    } catch (e) {
      return false;
    }
  });
  await _book.opened;
  await _book.rendition.started;
  let newZip = _book.archive.zip.clone();
  for (let i = 0; i < _book.spine.length; i++) {
    let section = _book.spine.get(i);
    await section.load(_book.rendition.manager.request);
    let html = section.contents.cloneNode(true);
    let base = html.querySelector("base");
    if (base) {
      base.remove();
    }
    newZip.file(section.url.replace(/^\//, ""), html.outerHTML);
  }
  let data = await newZip.generateAsync({type: "uint8array"});
  let { metadata } = _book.package;
  let filename = `book.epub`;
  sendZip(data, filename);
}

function decipherEpub() {
  return new Promise(resolve => {
    function processZip(data, filename) {
      resolve({ data: Uint8Array.from(data), filename });
    }
    exportFunction(processZip, window, { defineAs: "sendZip" });

    wrappedJSObject.eval(`(${decipherPageTask.toString()})()`);
  });
}

async function main() {
  let { data, filename } = await decipherEpub();
  browser.runtime.sendMessage({type: "epub", data, filename });
}

browser.runtime.onMessage.addListener(msg => {
  if (msg == "extract-epub") {
    main();
  }
});

if (wrappedJSObject.ePub && wrappedJSObject.ePub.Book) {
  browser.runtime.sendMessage({type: "hasEpubJS", msg: true });
}
