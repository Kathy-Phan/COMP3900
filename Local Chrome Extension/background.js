// background.js
// This can be left empty for now, but is required for the extension to work.

//chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//  if (message && message.from === 'Bubble') {
//    console.log("Received data from Bubble:", message.data);
//
//    // Handle the incoming data
//    // For example, save it to storage or process it
//    // You can also trigger some action in the UI based on this data
//    sendResponse({status: 'Data received successfully'});
//  }
//  return true; // Keep the message channel open for asynchronous response
//});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getUserEmail") {
        console.log("Fetching logged-in user email...");
        chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, function(userInfo) {
            if (userInfo.email) {
                console.log("✅ Email Found:", userInfo.email);
                sendResponse({ email: userInfo.email });
            } else {
                console.warn("❌ No email found (User may not be signed in).");
                sendResponse({ email: "Unknown User" });
            }
        });
        return true; // Required to use sendResponse asynchronously
    }
});