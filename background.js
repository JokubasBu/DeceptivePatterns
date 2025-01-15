chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");
  });
  
  chrome.action.onClicked.addListener((tab) => {
    if (chrome.scripting) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error executing script in background:", chrome.runtime.lastError.message);
        } else {
          console.log("Script executed from background.js");
        }
      });
    } else {
      console.error("Chrome scripting API is not available in background.js");
    }
  });