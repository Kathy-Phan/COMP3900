window.selectedStarRating = 1;

function isOwnLinkedInProfile() {
  const url = window.location.href;
  const profileRegex = /^https:\/\/www\.linkedin\.com\/in\/([^/?#]+)/;
  const match = url.match(profileRegex);

  if (match && match[1]) {
    const username = match[1];
    const myStoredUsername = localStorage.getItem("linkedin_username");
    return username === myStoredUsername;
  }

  return true; // fallback
}

function toggleActionButtons() {
  const actionButtons = document.getElementById("actionButtons");
  const errorBox = document.getElementById("errorMessage");

  if (!actionButtons || !errorBox) return;

  const url = window.location.href;

  // Hide on profile pages unless it's your own
  if (url.includes("linkedin.com/in")) {
    if (isOwnLinkedInProfile()) {
      actionButtons.style.display = "flex";
      errorBox.style.display = "none";
    } else {
      actionButtons.style.display = "none";
      errorBox.innerText = "⚠️ Please visit your own LinkedIn profile to use the optimizer.";
      errorBox.style.display = "block";
    }
  }
  // Show only on job pages
  else if (isJobPage()) {
    actionButtons.style.display = "flex";
    errorBox.style.display = "none";
  } else {
    actionButtons.style.display = "none";
    errorBox.style.display = "none";
  }
}

// Call when page changes (SPA-safe)
const observer = new MutationObserver(toggleActionButtons);
observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractLinkedInProfile") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs || !tabs.length) return;
            const tabId = tabs[0].id;

            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: extractLinkedInProfile
            }, (injectionResults) => {
                if (chrome.runtime.lastError) {
                    // console.error("Injection error:", chrome.runtime.lastError);
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    // console.log("Script executed successfully");
                }
            });
        });
        return true;
    }
});

async function waitForElement(selector, timeout = 5000) {
    let startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        let element = document.querySelector(selector);
        if (element) return element;
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
    }

    throw new Error(`Timeout: Element '${selector}' not found`);
}

function waitOneSecond() {
    return new Promise(resolve => setTimeout(resolve, 1000)); // 1000ms = 1 second
}


    function getElementByXPath(xpath) {
        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    function getElementByText(tag, text) {
        return [...document.querySelectorAll(tag)].find(el => el.innerText.includes(text));
    }


// Helper Functions
    function showTooltip(event, message) {
        removeTooltip(); // Remove existing tooltip

        const tooltip = document.createElement("div");
        tooltip.innerText = message;
        tooltip.style.position = "fixed";
        tooltip.style.backgroundColor = "black";
        tooltip.style.color = "white";
        tooltip.style.padding = "5px 10px";
        tooltip.style.borderRadius = "5px";
        tooltip.style.fontSize = "12px";
        tooltip.style.zIndex = "99999";
        tooltip.style.top = `${event.clientY + 10}px`;
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.pointerEvents = "none";
        tooltip.id = "comingSoonTooltip";

        document.body.appendChild(tooltip);
    }

    function removeTooltip() {
        const tooltip = document.getElementById("comingSoonTooltip");
        if (tooltip) tooltip.remove();
    }

function extractLinkedInProfile() {
    // console.log("🚀 Extracting LinkedIn profile details...");

    function getElementText(selector) {
        const element = document.querySelector(selector);
        return element ? element.innerText.trim() : "Not Found";
    }

    function getListItemsBySection(sectionTitle) {
        const section = Array.from(document.querySelectorAll("section"))
            .find(sec => sec.querySelector("h2")?.innerText.includes(sectionTitle));
        return section ? Array.from(section.querySelectorAll("li")).map(item => item.innerText.trim()) : [];
    }

    const profileData = {
        name: getElementText("h1"),
        headline: getElementText(".text-body-medium.break-words"),
        about: getElementText("#profile-content section:nth-child(3) div.display-flex.ph5.pv3 span.visually-hidden"),
        experience: getListItemsBySection("Experience"),
        education: getListItemsBySection("Education"),
        skills: getListItemsBySection("Skills"),
        projects: getListItemsBySection("Projects"),
        certifications: getListItemsBySection("Certifications"),
        languages: getListItemsBySection("Languages")
    };

    // console.log("✅ Extracted LinkedIn Profile Data:", profileData);

    window.postMessage({ type: "linkedinData", data: profileData }, "*");
    return profileData;
}

// Listen for messages from the injected script
window.addEventListener("message", function (event) {
    if (event.source !== window || event.data.type !== "linkedinData") return;
    // console.log("✅ Received LinkedIn Profile Data:", event.data.data);


});



async function waitForLinkedinDetails() {
  // console.log("⏳ Waiting for LinkedIn details to load...");

  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 20; // Increased attempts for reliability
    const checkInterval = 1500; // Reduced interval for faster detection

    function getDetailsElement() {
      return document.querySelector("#profile-content > div > div.scaffold-layout.scaffold-layout--breakpoint-md.scaffold-layout--main-aside.scaffold-layout--reflow.pv-profile.pvs-loader-wrapper__shimmer--animate > div > div > main > section:nth-child(3) > div.display-flex.ph5.pv3 > div > div > div > span.visually-hidden");
    }

    const observer = new MutationObserver((mutations, obs) => {
      const detailsElement = getDetailsElement();
      if (detailsElement && detailsElement.innerText.trim().length > 0) {
        // console.log("✅ LinkedIn details loaded via observer.");
        obs.disconnect();
        clearInterval(timeout);
        resolve(detailsElement.innerText.trim());
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const timeout = setInterval(() => {
      attempts++;
      const detailsElement = getDetailsElement();
      // console.log(`⏳ Checking for LinkedIn details... Attempt ${attempts}/${maxAttempts}`);

      if (detailsElement && detailsElement.innerText.trim().length > 0) {
        // console.log("✅ LinkedIn details loaded via timeout check.");
        clearInterval(timeout);
        observer.disconnect();
        resolve(detailsElement.innerText.trim());
      }

      if (attempts >= maxAttempts) {
        // console.log("❌ Timeout reached: Could not find LinkedIn details.");
        clearInterval(timeout);
        observer.disconnect();
        reject(new Error("LinkedIn details loading timed out."));
      }
    }, checkInterval);
  });
}



// Function to extract all content (HTML and text) from LinkedIn profile page
function extractAllContent(element) {
  let result = '';

  // Collect the outer HTML of the current element
  result += element.outerHTML;

  // Iterate through child nodes (including text nodes) recursively
  element.childNodes.forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      result += extractAllContent(child);  // Recursively extract content from child elements
    } else if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent;  // Add the text content
    }
  });

  return result;
}

function checkLinkedInProfile() {
  const url = window.location.href;
  return /https?:\/\/(www\.)?linkedin\.com\/in\/.+/.test(url);
}

async function getEmailFromBackground() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getUserEmail" }, (response) => {
      if (response?.email) {
        // console.log("✅ Retrieved email from background.js:", response.email);
        resolve(response.email);
      } else {
        console.warn("❌ No email found.");
        resolve("Unknown User");
      }
    });
  });
}

async function sendlinkedinDetailsToBubble(details) {
  try {
    // console.log("🚀 Sending linkedin details to Bubble.io...");
    const email = await getEmailFromBackground(); // Get email from background.js
    // console.log("📧 User Email:", email);

    const response = await fetch("https://www.jobgen.ai/version-test/api/1.1/wf/chrome_linkedin_data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "email": email,
        "description": details
      })
    });
    const data = await response.json();

    if (data && data.response) {
          // console.log("📨 Response from Bubble:", data.response);
          // Return the response if needed
    } else {
          console.warn("⚠️ Unexpected response format:", data);
          return null;
    }

    // console.log("✅ Job Data Sent Successfully:", data);
    return data.response;
  } catch (error) {
    // console.error("❌ API Error:", error);
  }
}

async function sendSaveJobDetailsToBubble(details, rating, title, company) {
  try {
    // console.log("🚀 Sending save job details to Bubble.io...");
    const email = await getEmailFromBackground(); // Get email from background.js
    const jobUrl = window.location.href;

    // console.log("📧 User Email:", email);
    console.log('Details:', details);
    console.log('Rating:', rating);
    console.log('Title:', title);
    console.log('Company:', company, jobUrl);


    const response = await fetch("https://www.jobgen.ai/version-test/api/1.1/wf/chrome_job_save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "email": email,
        "description": details,
        "excitement": rating,
        "title": title,
        "company": company,
        "job_url": jobUrl
      })
    });
    const data = await response.json();

    if (data && data.response) {
          // console.log("📨 Response from Bubble:", data.response);
          // Return the response if needed
    } else {
          console.warn("⚠️ Unexpected response format:", data);
          return null;
    }

    // console.log("✅ Job Data Sent Successfully:", data);
    return data.response;
  } catch (error) {
    // console.error("❌ API Error:", error);
  }
}



async function sendJobDetailsToBubble(jobTitle, company, jobDetails) {
  try {
    // console.log(" Sending job details to JobGen.AI...");
    const email = await getEmailFromBackground(); // Get email from background.js
    // console.log("📧 User Email:", email);

    const response = await fetch("https://www.jobgen.ai/version-test/api/1.1/wf/chrome_job_match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "email": email,
        "job_title": jobTitle,
        "company": company,
        "description": jobDetails
      })
    });
    const data = await response.json();

    if (data && data.response) {
          // console.log("📨 Response from JobGen.AI:", data.response);
          // Return the response if needed
    } else {
          console.warn("⚠️ Unexpected response format:", data);
          return null;
    }

    // console.log("✅ Job Data Sent Successfully:", data);
    return data.response;
  } catch (error) {
    // console.error("❌ API Error:", error);
  }
}

function waitForJobDetails(callback) {
  // console.log("Waiting for job details to load...");

  // Create the MutationObserver to watch for changes in the DOM
  const observer = new MutationObserver((mutations, obs) => {
    const detailsElement = document.querySelector("article.jobs-description__container");

    if (detailsElement && detailsElement.innerText.trim().length > 0) {
      // console.log("Job details loaded.");
      obs.disconnect(); // Stop observing once job details are available
      callback(detailsElement.innerText.trim()); // Extract text
    }
  });

  // Start observing the document body for any changes
  observer.observe(document.body, { childList: true, subtree: true });

  // Optional: Add a timeout mechanism (if you need to stop waiting after a certain amount of time)
  let attempts = 0;
  const maxAttempts = 7;
  const timeout = setInterval(() => {
    attempts++;
    const detailsElement = document.querySelector("article.jobs-description__container");
    if (attempts >= maxAttempts) {
      // console.log("Timeout reached: Could not find job details.");
      clearInterval(timeout);
      observer.disconnect(); // Disconnect the observer in case of timeout
    }
  }, 2000);
}

function waitForLinkedInProfile(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const interval = 100;
    let elapsed = 0;

    const check = () => {
      const element = document.querySelector(selector);
      if (element) return resolve(true);

      elapsed += interval;
      if (elapsed >= timeout) return reject("Timeout waiting for LinkedIn profile");

      setTimeout(check, interval);
    };

    check();
  });
}


async function displayJobInfoLinkedin() {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    @font-face {
      font-family: 'Inter';
      src: url('${chrome.runtime.getURL('fonts/Inter-Light.woff2')}') format('woff2');
      font-weight: normal;
      font-style: normal;
    }

    @font-face {
      font-family: 'InterBold';
      src: url('${chrome.runtime.getURL('fonts/Inter-Bold.woff2')}') format('woff2');
      font-weight: bold;
      font-style: normal;
    }

    #jobContainer, #jobContainer * {
      font-family: 'Inter', sans-serif !important;
      margin: 0;
      padding: 0;
      z-index: 2147483647;
      line-height: 1.2; /* Reduce space between lines */
    }

    #jobTitle, #companyName {
    font-family: 'InterBold', sans-serif !important;
    font-weight: bold;
    font-size: 16px;
    }

    #location, #salary {
       font-weight: normal;
       font-size: 14px;
    }

    body {
     font-family: 'Inter', sans-serif;
       font-weight: normal;
       font-size: 14px;
     }

    h3 {
      font-family: 'InterBold', sans-serif !important;
      font-weight: bold;
      font-size: 16px;
    }

    h1 {
          font-family: 'InterBold', sans-serif !important;
          font-weight: bold;
          font-size: 16px;
        }
    h2 {
          font-family: 'InterBold', sans-serif !important;
          font-weight: bold;
          font-size: 16px;
        }
    h4 {
          font-family: 'InterBold', sans-serif !important;
          font-weight: bold;
          font-size: 16px;
        }

    /* Ring Graph Styles */
    .ring-graph {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: conic-gradient(#3f6afd calc(var(--percent) * 1%), #ddd 0);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ring-graph::after {
      content: '';
      position: absolute;
      width: 70%;
      height: 70%;
      border-radius: 50%;
      background: white;
    }

    .percentage-text {
      position: relative;
      z-index: 99999;
      font-size: 16px;
      font-weight: bold;
      color: black;
    }

     .section-title {
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: black;
                font-weight: bold;
                padding: 10px 0;
            }
            .dropdown-icon {
                font-size: 14px;
                transition: transform 0.3s;
            }
            .collapsed .dropdown-icon {
                transform: rotate(180deg);
            }
            .content {
                display: none;
                padding-left: 20px;
                color: black;
            }
            hr {
                border: 1px solid #ddd;
                margin: 20px 0;
            }
  `;

  document.head.appendChild(styleElement); // Add style to head
  document.body.appendChild(styleElement); // Add style to head

  const button = document.createElement('button');
  button.id = 'jobButton';
  button.style.position = 'fixed';
  button.style.top = '50%';
  button.style.right = '10px';
  button.style.transform = 'translateY(-50%)';
  button.style.backgroundColor = '#FFFFFF';
  button.style.border = 'none';
  button.style.padding = '0';
  button.style.borderRadius = '10px';
  button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  button.style.zIndex = '99999';
  button.style.width = '60px';
  button.style.height = '60px';
  button.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/icon48.png" alt="Logo" style="width: 100%; height: 100%;" />`;

  let isDragging = false;

  button.addEventListener('mousedown', (e) => {
    isDragging = true;
    const offsetY = e.clientY - button.getBoundingClientRect().top;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
    });

    function onMouseMove(e) {
      if (isDragging) {
        const topPosition = e.clientY - offsetY;
        button.style.top = `${topPosition}px`; // Adjust vertical position
        button.style.right = '0';  // Keep button fixed on the right edge
      }
    }
  });



  button.addEventListener('click', () => {
    button.style.display = 'none';

    const container = document.createElement('div');
    container.id = 'jobContainer';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.right = '0';
    container.style.height = '100%';
    container.style.backgroundColor = '#FFFFFF';
    container.style.padding = '0';
    container.style.borderRadius = '0px';
    container.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    container.style.zIndex = '99999';
    container.style.maxWidth = '400px';
    container.style.width = '400px';
    container.style.overflowY = 'auto';

    const currentlink = window.location.href.toLowerCase();
    const jobTitleElement = document.querySelector("h1");

    let companyElement;
    let companyLogoElement;

    if (currentlink.includes("linkedin.com/job") && currentlink.includes("job")) {
        companyElement = document.querySelector('#main > div > div.scaffold-layout__list-detail-inner.scaffold-layout__list-detail-inner--grow > div.scaffold-layout__detail.overflow-x-hidden.jobs-search__job-details > div > div.jobs-search__job-details--container > div > div > div:nth-child(1) > div > div:nth-child(1) > div > div.relative.job-details-jobs-unified-top-card__container--two-pane > div > div.display-flex.align-items-center > div.display-flex.align-items-center.flex-1 > div > a');
        companyLogoElement = document.querySelector("a[data-test-app-aware-link] img");
    } else {
        companyElement = document.querySelector('#profile-content > div > div.scaffold-layout.scaffold-layout--breakpoint-md.scaffold-layout--main-aside.scaffold-layout--reflow.pv-profile.pvs-loader-wrapper__shimmer--animate > div > div > main > section.artdeco-card.GnQuklSZTYJLESwQmsLZcVBXqMjSlZma > div.ph5 > div.mt2.relative > div:nth-child(1) > div.text-body-medium.break-words');
        companyLogoElement = document.querySelector(".profile-photo-edit__edit-btn img");
    }



    const jobLocationElement = document.querySelector('.t-black--light .tvm__text');


    const jobTitle = jobTitleElement ? jobTitleElement.innerText.trim() : "Loading job title...";
    const companyName = companyElement ? companyElement.innerText.trim() : "";
    const companyLogoUrl = companyLogoElement ? companyLogoElement.src : "chrome-extension://" + chrome.runtime.id + "/icon48.png";
    // console.log("setting company logo")
    const jobLocation = jobLocationElement ? jobLocationElement.innerText.trim() : "";

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100vh; box-sizing: border-box;">
        <!-- Header Section -->
        <div style="background-color: black; padding: 15px; display: flex; align-items: center; justify-content: flex-start; width: 100%; box-sizing: border-box; position: sticky; top: 0; height:70px; z-index: 99999;">
          <img src="chrome-extension://${chrome.runtime.id}/icon48.png" alt="Logo" style="width: 40px; height: 40px; margin-right: 10px;" />
          <h3 style="margin: 0; font-size: 26px; font-weight: bold;">
            <span style="color: white;">JOB</span><span style="color: white;">GEN.AI</span>
          </h3>
        </div>
<hr style="border: none; border-top: 2px solid black; margin: 0;">

        <!-- Close Button (positioned in top-right corner of header) -->
        <button id="closeButton" style="position: absolute; top: 15px; right: 15px; padding: 5px; background-color: black; border: none; border-radius: 5px; z-index: 100000;">
          <img src="chrome-extension://${chrome.runtime.id}/cross.png" alt="Close" style="width: 30px; height: 30px;">
        </button>


        <div style="display: flex; align-items: center; margin-top: 10px;">
          <div style="display: flex; align-items: center; justify-content: center; margin-right: 30px; margin-left: 20px; width: 80px; height: 80px;">
            <img id="companyLogo" src="${companyLogoUrl}" alt="Company Logo" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>


          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <p id="jobTitle" style="color: #002F8D; margin: 0;">${jobTitle}</p>
            <p id="companyName" style="color: black; margin: 0;">${companyName}</p>
            <p id="location" style="color: black; margin: 0;">${jobLocation}</p>
            <p id="salary" style="color: black; margin: 0;"></p>

            <!-- Excitement Text and Clickable Star Rating on Same Line -->
            <div id="starRating" style="margin-top: 8px; display: flex; align-items: center;">
              <span style="margin-right: 8px; font-weight: bold;">Excitement:</span>
              <span class="star" data-value="1" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
              <span class="star" data-value="2" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
              <span class="star" data-value="3" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
              <span class="star" data-value="4" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
              <span class="star" data-value="5" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
            </div>
          </div>

        </div>

        <!-- Tab Buttons -->
        <div style="display: flex; border-bottom: 2px solid #ddd; margin-top: 20px;">
          <button id="highLevelTab" style="flex: 1; padding: 10px; background-color: #3f6afd; color: white; border: none; text-align: center; cursor: pointer; border-radius: 5px 5px 0 0; transition: background-color 0.3s; font-weight: bold;">
            Job Match
          </button>
          <button id="linkedinTab" style="flex: 1; padding: 10px; background-color: #f4f4f4; border: none; text-align: center; cursor: pointer; transition: background-color 0.3s; font-weight: bold;">
             Linkedin Optimizer
          </button>

        </div>

        <div id="warningMessage" style="
          display: none;
          margin: 20px auto;
          padding: 12px 20px;
          max-width: 80%;
          background-color: #ffe6e6;
          color: #cc0000;
          border: 1px solid #cc0000;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          font-size: 16px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        ">
        </div>

        <!-- Tabs Content -->
        <div id="tabsContent" style="flex: 1; overflow-y: auto; padding: 10px; box-sizing: border-box; margin-bottom: 60px">
          <div id="highLevelContent" style="padding: 10px;">

                 <!-- Hidden Form -->
            <div id="jobDetailsForm" style="display: none; margin-top: 10px; padding: 10px;">
              <label for="jobTitleInput" style="color: black;">Job Title:</label>
              <input type="text" id="jobTitleInput" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">

              <label for="companyNameInput" style="color: black; margin-top: 10px;">Company Name:</label>
              <input type="text" id="companyNameInput" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">

              <label for="jobUrlInput" style="color: black; margin-top: 10px;">Job URL:</label>
              <input type="url" id="jobUrlInput" placeholder="https://example.com/job-posting" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">

              <label for="locationInput" style="color: black; margin-top: 10px;">Location:</label>
              <input type="text" id="locationInput" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">

             <label for="descriptionInput" style="color: black; margin-top: 10px;">Description:</label>
             <input type="text" id="descriptionInput" required style="width: 100%; height: 270px; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">
    </div>


            <div style="display: flex; justify-content: space-between; align-items: center; margin-left: 5px;">
              <div style="flex: 1;">
                <h4 style="color: black; font-weight: bold;">Your Match:</h4>
                <ul id="alignment" style="color: black; padding-left: 0;">Loading YOUR alignment...</ul>
              </div>
              <div style="flex: 0 0 100px; text-align: center;">
                <div class="ring-graph" style="--percent: 0;">
                  <div class="percentage-text" id="scoreText">0%</div>
                </div>
              </div>
            </div>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

            <h4 style="color: black; font-weight: bold;">Keywords:</h4>
                                    <ul id="keywords" style="color: black; padding-left: 20px;">
                                      <li>Loading summary...</li>
                                    </ul>

                        <hr style="border: 1px solid #ddd; margin: 20px 0;" />

            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
              <div style="flex: 1; padding-right: 20px;">
                <h4 style="color: black; font-weight: bold;">Skills:</h4>
                <ul id="hardSkills" style="color: black; padding-left: 20px;">
                  <li>Loading skills...</li>
                </ul>
              </div>

              <hr style="border: 1px solid #ddd; margin: 20px 0;" />

              <div style="flex: 1; padding-left: 20px;">
               <h4 style="color: black; font-weight: bold;">Technical Skills:</h4>
                <ul id="softSkills" style="color: black; padding-left: 20px;">
                  <li>Loading skills...</li>
                </ul>
              </div>
            </div>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

            <h4 style="color: black; font-weight: bold;">Key Responsibilities:</h4>
            <ul id="jobSummary" style="color: black; padding-left: 20px;">
              <li>Loading summary...</li>
            </ul>



        </div>



        <div id="linkedinContent" style="padding: 10px; display: none;">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-left: 5px;">
                          <div style="flex: 1;">
                            <h4 style="color: black; font-weight: bold;">Summary:</h4>
                            <ul id="linkedinSummary" style="color: black; padding-left: 0;">Loading...</ul>
                          </div>
                          <div style="flex: 0 0 100px; text-align: center;">
                            <div id="linkedingraph" class="ring-graph" style="--percent: 0;">
                              <div id="linkedinscore" class="percentage-text" id="scoreText">0%</div>
                            </div>
                          </div>
                        </div>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

                        <h4 class="section-title" data-target="linkedinHeadline">
                                        Headline  <span class="dropdown-icon" style="color: #3f6afd;">▼</span>
                                    </h4>
                                    <ul id="linkedinHeadline" class="content">
                                        <li>Loading about details...</li>
                                    </ul>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

            <h4 class="section-title" data-target="aboutSection">
                            About <span class="dropdown-icon" style="color: #3f6afd;">▼</span>
                        </h4>
                        <ul id="aboutSection" class="content">
                            <li>Loading about details...</li>
                        </ul>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

                        <h4 class="section-title" data-target="experienceSection">
                            Experience <span class="dropdown-icon" style="color: #3f6afd;">▼</span>
                        </h4>
                        <ul id="experienceSection" class="content">
                            <li>Loading experience details...</li>
                        </ul>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

                                    <h4 class="section-title" data-target="educationSection">
                                        Education <span class="dropdown-icon" style="color: #3f6afd;">▼</span>
                                    </h4>
                                    <ul id="educationSection" class="content">
                                        <li>Loading education details...</li>
                                    </ul>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

                                                <h4 class="section-title" data-target="skillsSection">
                                                    Skills <span class="dropdown-icon" style="color: #3f6afd;">▼</span>
                                                </h4>
                                                <ul id="skillsSection" class="content">
                                                    <li>Loading skills details...</li>
                                                </ul>
            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

                                                            <h4 class="section-title" data-target="featuredSection">
                                                                Featured <span class="dropdown-icon" style="color: #3f6afd;">▼</span>
                                                            </h4>
                                                            <ul id="featuredSection" class="content">
                                                                <li>Loading featured details...</li>
                                                            </ul>
            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

                                                            <h4 class="section-title" data-target="recommendedSection">
                                                                Recommended <span class="dropdown-icon" style="color: #3f6afd;">▼</span>
                                                            </h4>
                                                            <ul id="recommendedSection" class="content">
                                                                <li>Loading recommended details...</li>
                                                            </ul>
        </div>

        <p id="summarizingText" style="text-align: center;"></p>

        <!-- Footer Section (Fixed) -->
        <div id="footer" style="position: fixed; bottom: 0; width: 100%; padding: 0 0; background-color: white; border-top: 2px solid black; z-index: 99999; display: flex; align-items: center;">
          <button id="saveButton" style="padding: 10px 20px; margin: 15px; margin-left: 50px; background-color: #3f6afd; color: white; border: none; border-radius: 20px; font-weight: bold;">Save</button>
          <button id="reviewButton" style="padding: 10px 20px; margin: 15px; background-color: #f4f4f4; color: black; border: none; border-radius: 20px;">Review</button>
          <button id="applyButton" style="padding: 10px 20px; margin: 15px; background-color: #f4f4f4; color: black; border: none; border-radius: 20px;">Apply</button>
        </div>
      </div>
    `;



    document.body.appendChild(container);


    const stars = document.querySelectorAll('#starRating .star');

    // Default rating
    let rating = 3;
    window.selectedStarRating = rating;

    // Set initial star appearance
    stars.forEach(s => {
      if (parseInt(s.getAttribute('data-value')) <= rating) {
        s.textContent = '★';
      } else {
        s.textContent = '☆';
      }
    });

    // Add click listeners
    stars.forEach(star => {
      star.addEventListener('click', () => {
        rating = parseInt(star.getAttribute('data-value'));

        stars.forEach(s => {
          if (parseInt(s.getAttribute('data-value')) <= rating) {
            s.textContent = '★';
          } else {
            s.textContent = '☆';
          }
        });

        window.selectedStarRating = rating;
        console.log('User selected rating:', rating);
      });
    });




    document.getElementById('reviewButton').addEventListener('mouseover', (event) => {
        showTooltip(event, "🚀 Review Coming Soon!");
    });

    document.getElementById('reviewButton').addEventListener('mousemove', (event) => {
        showTooltip(event, "🚀 Review Coming Soon!");
    });

    document.getElementById('reviewButton').addEventListener('mouseout', () => {
        removeTooltip();
    });

    document.getElementById('reviewButton').addEventListener('click', (event) => {
        event.preventDefault();
        alert("🚀 Review Feature Coming Soon!");
    });

    document.getElementById('applyButton').addEventListener('mouseover', (event) => {
        showTooltip(event, "🚀 Apply Coming Soon!");
    });

    document.getElementById('applyButton').addEventListener('mousemove', (event) => {
        showTooltip(event, "🚀 Apply Coming Soon!");
    });

    document.getElementById('applyButton').addEventListener('mouseout', () => {
        removeTooltip();
    });

    document.getElementById('applyButton').addEventListener('click', (event) => {
        event.preventDefault();
        alert("🚀 Apply Feature Coming Soon!");
    });


    document.getElementById('closeButton').addEventListener('click', () => {
          const container = document.getElementById('jobContainer');
          if (container) {
            document.body.removeChild(container);
          }
          const button = document.getElementById('jobButton');
          if (button) {
            button.style.display = 'block';
          }
        });

        document.querySelectorAll('.section-title').forEach(title => {
            title.addEventListener('click', () => {
                const sectionId = title.getAttribute('data-target');
                const section = document.getElementById(sectionId);
                if (section) {
                    section.style.display = section.style.display === 'block' ? 'none' : 'block';
                    title.classList.toggle('collapsed');
                }
            });
        });

    const linkedin = document.querySelectorAll('#linkedinTab');

        linkedin.forEach(l => {
          l.addEventListener('click', async () => {
            // // console.log("on linkedin", checkLinkedInProfile());
            if (checkLinkedInProfile() == true) {
//            await scrollToLoadLinkedIn();
            document.getElementById("starRating").style.display = "none";

            try {
                await waitForLinkedInProfile("#profile-content section:nth-child(3) div.display-flex.ph5.pv3 span.visually-hidden");
              } catch (e) {
                console.warn(e);
              }


            const alldata = extractLinkedInProfile();
            // console.log(alldata);
            // console.log(typeof alldata);

            // Select the profile image inside the button
            let profileImageElement = document.querySelector(".profile-photo-edit__edit-btn img");

            if (profileImageElement) {
            } else {
             profileImageElement = document.querySelector("button.pv-top-card-profile-picture__container img");
            }

            const headlineCandidates = document.querySelectorAll("#profile-content .text-body-medium.break-words");

            let headline = "";
            if (headlineCandidates.length > 0) {
              // Assume first match is the headline
              headline = headlineCandidates[0].textContent.trim();
            }

            if (headline) {
              const companyElement = document.getElementById("companyName");
              if (companyElement) {
                companyElement.textContent = headline;
              }
            }


            // Extract the profile image URL
            let profileImageUrl = profileImageElement ? profileImageElement.getAttribute("src") : "";

            if (profileImageUrl) {
                // console.log("trying to find the image element to change");
                let companyLogoElement = document.querySelector("div img[alt='Company Logo']"); // Select the correct <img> element
                // console.log(companyLogoElement);

                if (companyLogoElement) {
                    // console.log("chnaging to profile pic in html");
                    companyLogoElement.setAttribute("src", profileImageUrl); // Update the src attribute
                    companyLogoElement.src = profileImageUrl;
                }

                // console.log(profileImageElement);
                // console.log(profileImageUrl);
            }

            // console.log("All data");
            // console.log(alldata);


            const extractedData = JSON.stringify(alldata, null, 2); // Pretty formatting
            // console.log("Extracted data");
            // console.log(extractedData);


            // console.log("Fetching LinkedIn data...");
            const linfrombubble = await sendlinkedinDetailsToBubble(extractedData);
            // console.log("Raw LinkedIn Data Received:", linfrombubble);

            // Convert to JSON string and back to object for debugging purposes
            const linkedInDataJson = JSON.stringify(linfrombubble);
            // console.log("Converted to JSON String:", linkedInDataJson);

            const linkedInSummary = JSON.parse(linkedInDataJson);
            // console.log("Parsed LinkedIn Summary:", linkedInSummary);

            // Check if linkedin_data exists and is a string
            if (!linkedInSummary["linkedin_data"]) {
                // console.error("linkedin_data key is missing in the response.");
            } else {
                // console.log("linkedin_data found.");
            }

            // **Fix: Parse `linkedin_data` if it's still a string**
            if (typeof linkedInSummary["linkedin_data"] === "string") {
                try {
                    linkedInSummary["linkedin_data"] = JSON.parse(linkedInSummary["linkedin_data"]);
                    // console.log("linkedin_data successfully parsed.");
                } catch (error) {
                    // console.error("Error parsing linkedin_data:", error);
                }
            }

            // Show LinkedIn content section
            const linkedinContent = document.querySelector("#linkedinContent");
            // console.log("LinkedIn Content Section:", linkedinContent);
            linkedinContent.style.display = "block";

            // Display the short summary
            // console.log("Checking for Short Summary...");
            if (linkedInSummary["linkedin_data"]?.["Short Summary"]) {
                // console.log("Short Summary Found:", linkedInSummary["linkedin_data"]["Short Summary"]);
                document.getElementById("linkedinSummary").innerHTML = `<li>${linkedInSummary["linkedin_data"]["Short Summary"]}</li>`;
            } else {
                console.warn("Short Summary not provided.");
            }

//            document.getElementById("starRating").style.display = "none";

            // Display the profile score
            // console.log("Checking for Profile Score...");
            if (linkedInSummary["linkedin_data"]?.["Profile Score"]) {
                const profileScore = linkedInSummary["linkedin_data"]["Profile Score"];
                // console.log("Profile Score Found:", profileScore);
                document.getElementById("linkedinscore").textContent = `${profileScore}%`;
                document.getElementById("linkedingraph").style.setProperty("--percent", profileScore);
            } else {
                console.warn("Profile Score not found.");
            }

            // Display headline suggestions
            // console.log("Checking for Headline Suggestions...");
            if (linkedInSummary["linkedin_data"]?.["Headline Suggestions"]) {
                const headlineList = linkedInSummary["linkedin_data"]["Headline Suggestions"]
                    .map((headline) => `<li>${headline}</li>`)
                    .join("");
                // console.log("Headline Suggestions Found:", headlineList);
                document.getElementById("linkedinHeadline").innerHTML = headlineList;
            } else {
                console.warn("Headline Suggestions not provided.");
            }

            // Display improved about section
            // console.log("Checking for Improved About Section...");
            if (linkedInSummary["linkedin_data"]?.["Improved About Section"]) {
                // console.log("Improved About Section Found:", linkedInSummary["linkedin_data"]["Improved About Section"]);
                document.getElementById("aboutSection").innerHTML = `<li>${linkedInSummary["linkedin_data"]["Improved About Section"]}</li>`;
            } else {
                console.warn("Improved About Section not provided.");
            }

            // Display experience improvement suggestions
            // console.log("Checking for Experience Improvement...");
            if (linkedInSummary["linkedin_data"]?.["Experience Improvement"]) {
                const experienceList = linkedInSummary["linkedin_data"]["Experience Improvement"]
                    .map((experience) => `<li>${experience}</li>`)
                    .join("");
                // console.log("Experience Improvement Found:", experienceList);
                document.getElementById("experienceSection").innerHTML = experienceList;
            } else {
                console.warn("Experience Improvement not provided.");
            }

            // Display education improvement suggestions
            // console.log("Checking for Education Improvement...");
            if (linkedInSummary["linkedin_data"]?.["Education Improvement"]) {
                const educationList = linkedInSummary["linkedin_data"]["Education Improvement"]
                    .map((education) => `<li>${education}</li>`)
                    .join("");
                // console.log("Education Improvement Found:", educationList);
                document.getElementById("educationSection").innerHTML = educationList;
            } else {
                console.warn("Education Improvement not provided.");
            }

            // Display skills improvement suggestions
            // console.log("Checking for Skills Improvement...");
            if (linkedInSummary["linkedin_data"]?.["Skills Improvement"]) {
                const skillsList = linkedInSummary["linkedin_data"]["Skills Improvement"]
                    .map((skill) => `<li>${skill}</li>`)
                    .join("");
                // console.log("Skills Improvement Found:", skillsList);
                document.getElementById("skillsSection").innerHTML = skillsList;
            } else {
                console.warn("Skills Improvement not provided.");
            }

            // console.log("check featured and recommended here");
            const featuredElement = document.querySelector("#featured");
            const featuredText = featuredElement ? "Good job you have a featured section!": "It is recommended to have some achievements featured, feature atleast 2 posts.";
            document.getElementById("featuredSection").innerHTML = featuredText;
            let recommendElement, recommendText, recommendCountE, recommendCount, recommendHTML;
            recommendElement = document.querySelector("#recommendations");
            // recommendText = recommendElement ?  recommendElement.innerText: "Get some recommendations na";
            recommendText = recommendElement ?  "Good job you have some recommendations!": "Get Some Recommendations! Ask a colleague or manager today.";
            recommendHTML = recommendText;
            if (recommendElement) {
               recommendCountE = document.querySelector("#navigation-index-see-all-recommendations");
               recommendCount = recommendCountE ? recommendCountE.innerText : "Get 5+ recommendations to boost credibility — it builds trust with recruiters and makes your profile stand out.";
               recommendHTML += " " + recommendCount;
            }
            document.getElementById("recommendedSection").innerHTML = recommendHTML;

            // console.log("LinkedIn Data Processing Completed.");

            }
          });
        });

    const tabs = document.querySelectorAll('#highLevelTab, #linkedinTab');
        const warningMessage = document.getElementById('warningMessage');
        const currentURL = window.location.href.toLowerCase(); // Get the full URL in lowercase

        tabs.forEach(tab => {
          tab.addEventListener('mouseover', () => {
            tab.style.backgroundColor = '#e0e0e0';
            if (tab.classList.contains('active')) {
              tab.style.backgroundColor = '#3f6afd';
            }
          }); // <-- Closing parenthesis and curly brace correctly placed


          tab.addEventListener('mouseout', () => {
            if (!tab.classList.contains('active')) {
              tab.style.backgroundColor = '#f4f4f4';
            }
            if (tab.classList.contains('active')) {
                           tab.style.backgroundColor = '#3f6afd';
                        }
          });

          tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabs.forEach(t => {
              t.style.backgroundColor = t.classList.contains('active') ? '#3f6afd' : '#f4f4f4';
              t.style.color = t.classList.contains('active') ? 'white' : 'black';
            });

            // Condition 1: If URL contains 'linkedin' and 'job'
            if (currentURL.includes("linkedin") && currentURL.includes("job")) {
              if (tab.id === 'linkedinTab') {
                showWarning("This feature works best on your own LinkedIn profile. Head to your profile to see personalized insights.");
              } else {
                showContent(tab.id);
              }
            }
            // Condition 2: If URL contains 'linkedin' and '/in/'
            else if (currentURL.includes("linkedin") && currentURL.includes("/in/")) {
              if (tab.id === 'linkedinTab') {
                showContent(tab.id);
              } else {
                showWarning("Oops! This content isn’t accessible on LinkedIn profile pages.");
                document.getElementById("linkedinTab").click();
              }
            }
            // Condition 3: If URL contains 'linkedin' but neither job or /in/
                    else if (currentURL.includes("linkedin") && !currentURL.includes("/in/") && !currentURL.includes("job")) {
                      // console.log("not on profile or job page");
                      if (tab.id === 'highLevelTab') {
                        showForm(tab.id);
                      } else {
                        showWarning("Try our feature on job listings or your profile for the best results!");
                      }
                    }
            // Default: Show content if none of the conditions match
            else {
              showContent(tab.id);
            }
          });
        });

        // Function to show tab content
            function showForm(tabId) {
              // console.log("lets show form");
              document.getElementById("jobDetailsForm").style.display = "block";
              document.getElementById("alignment").style.display = "none";
              document.getElementById("hardSkills").style.display = "none";
              document.getElementById("softSkills").style.display = "none";
              document.getElementById("jobSummary").style.display = "none";
              document.getElementById("companyName").style.display = "none";
              document.getElementById("salary").style.display = "none";
              // Select all h4 elements inside the specific structure and hide them
              document.querySelectorAll("#highLevelContent > div:nth-child(2) > div:nth-child(1) > h4")
                  .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(4) > div:nth-child(1) > h4")
                            .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > h4")
                                          .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(2) > div:nth-child(1) > h4")
                                                        .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(2) > div:nth-child(2) > div")
                                                                  .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(4) > div:nth-child(3) > h4")
                                                                  .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > hr:nth-child(5)")
                                                                            .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > hr:nth-child(3)")
                                                                            .forEach(el => el.style.display = "none");
              document.getElementById('highLevelContent').style.display = tabId === 'highLevelTab' ? 'block' : 'none';

              // Hide warning message
              warningMessage.style.display = 'none';
              warningMessage.innerText = "";

              // Hide Skills title
              const skillsTitle = document.querySelector("#highLevelContent > div:nth-of-type(3) > div:nth-of-type(1) > h4");
              if (skillsTitle) skillsTitle.style.display = "none";

              // Hide Skills list
              const skillsList = document.getElementById("hardSkills");
              if (skillsList) skillsList.style.display = "none";

              // Hide Technical Skills title
              const technicalSkillsTitle = document.querySelector("#highLevelContent > div:nth-of-type(3) > div:nth-of-type(2) > h4");
              if (technicalSkillsTitle) technicalSkillsTitle.style.display = "none";

              // Hide Technical Skills list
              const technicalSkillsList = document.getElementById("softSkills");
              if (technicalSkillsList) technicalSkillsList.style.display = "none";

              // 2. Hide the "Loading summary..." list
              const keywordsList = document.getElementById("keywords");
              if (keywordsList) keywordsList.style.display = "none";

              // 2. Hide the "Loading summary..." list
                            const rate = document.getElementById("starRating");
                            if (rate) rate.style.display = "none";

              const hrs = document.querySelectorAll("#highLevelContent > hr");
              hrs.forEach(hr => hr.style.display = "none");

              document.getElementById("jobTitle").textContent = 'Enter job manually';



            }

        // Function to show tab content
        function showContent(tabId) {
          document.getElementById('highLevelContent').style.display = tabId === 'highLevelTab' ? 'block' : 'none';
          document.getElementById('linkedinContent').style.display = tabId === 'linkedinTab' ? 'block' : 'none';

          // Hide warning message
          warningMessage.style.display = 'none';
          warningMessage.innerText = "";
        }

        // Function to show a warning message
        function showWarning(message) {
          warningMessage.innerText = message;
          warningMessage.style.display = 'block';

          // Hide all tab content
          document.getElementById('highLevelContent').style.display = 'none';
          document.getElementById('linkedinContent').style.display = 'none';
        }

    document.getElementById('highLevelTab').click();
    let savedata;

    waitForJobDetails(async (jobText) => {
      savedata = jobText;
      // console.log("Extracted Job Details:", jobText);
      document.getElementById("summarizingText").style.display = 'block';

      const datafrombubble = await sendJobDetailsToBubble(jobTitle, companyName, jobText);
      console.log("time to parse data from bubble", datafrombubble);
      const datajson = JSON.stringify(datafrombubble);
      const summary = JSON.parse(datajson);
      // console.log("summary: ", summary);
      // console.log(typeof datafrombubble);
      // console.log(typeof datajson);
      // console.log(typeof summary);
      // console.log("Available keys in summary:", Object.keys(summary));

      // Parse the job_data field if it's a string
      if (typeof summary["job_data"] === "string") {
        try {
          summary["job_data"] = JSON.parse(summary["job_data"]); // Convert to an object
        } catch (error) {
          // console.error("Error parsing job_data JSON:", error);
        }
      }

      // console.log("Value of summary['Salary']:", summary["Salary"]);
      // console.log("Value of summary['Salary']:", summary["job_data"]?.["Salary"]);

      if (datafrombubble) {
        // console.log("will display data from bubble now:");
        const jobDetails = document.querySelector('#highLevelContent');
        jobDetails.style.display = 'block';


        const salaryMatch = summary["job_data"]?.["Salary"] || "Not provided";
        const alignment = summary["job_data"]?.["alignment_with_user_profile"] || "Not provided";
        const score = summary["job_data"]?.["job_match_score"] || "Not provided";

        // console.log(salaryMatch);


        if (salaryMatch) {
          document.getElementById('salary').innerText = salaryMatch;
          if (salaryMatch == "Not provided") {
               document.getElementById('salary').innerText = '';
          }
        }
        if (alignment) {
          document.getElementById('alignment').innerText = alignment;
        }

        if (score) {
          // console.log(typeof score, score);
          // console.log(score.replace('%', ''));
          let numericScore = parseInt(score.replace('%', ''));
          // console.log(typeof numericScore, numericScore);

          // Update the ring graph
          const ringGraph = document.querySelector('.ring-graph');
          ringGraph.style.setProperty('--percent', numericScore);
          document.getElementById('scoreText').textContent = score;
        }

        if (summary["job_data"]?.["skills"]) {
          const skillsList = summary["job_data"]?.["skills"]
            .map(skill => `<li>${skill}</li>`)
            .join('');
          document.getElementById('hardSkills').innerHTML = skillsList;
        }

        if (summary["job_data"]?.["technical_skills"]) {
                  const skillsList = summary["job_data"]?.["technical_skills"]
                    .map(skill => `<li>${skill}</li>`)
                    .join('');
                  document.getElementById('softSkills').innerHTML = skillsList;
                }

        if (summary["job_data"]?.["top_responsibilities"]) {
          const responsibilitiesList = summary["job_data"]?.["top_responsibilities"]
            .map(task => `<li>${task}</li>`)
            .join('');
          document.getElementById('jobSummary').innerHTML = responsibilitiesList;
        }

        if (summary["job_data"]?.["keywords"]) {
                                              const responsibilitiesList = summary["job_data"]?.["keywords"]
                                                .map(task => `<li>${task}</li>`)
                                                .join('');
                                              document.getElementById('keywords').innerHTML = responsibilitiesList;
                                            }

//       if (summary["job_data"]?.["Company Information"]) {
//           // console.log(summary["job_data"]?.["Company Information"]);
//           const companyInfo = summary["job_data"]?.["Company Information"];
//           const companyInfoList = Object.entries(companyInfo)
//               .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
//               .join('');
//           document.getElementById('companyInfo').innerHTML = companyInfoList;
//       }


        document.getElementById("summarizingText").style.display = 'none';
      }
    });

    document.getElementById('saveButton').addEventListener('click', () => {
                // console.log("pressed save button");

                const highLevelTab = document.getElementById('highLevelTab');
                // console.log(highLevelTab);

               if (highLevelTab && highLevelTab.classList.contains('active')) {
                    // console.log("✅ Save button clicked on High-Level Tab");

                    // Extract job details
                    const jobTitle = document.getElementById('jobTitle')?.innerText.trim() || "N/A";
                    const companyName = document.getElementById('companyName')?.innerText.trim() || "N/A";
                    const location = document.getElementById('location')?.innerText.trim() || "N/A";
                    const salary = document.getElementById('salary')?.innerText.trim() || "N/A";
                    const alignment = document.getElementById('alignment')?.innerText.trim() || "N/A";
                    const jobMatchScore = document.getElementById('scoreText')?.innerText.trim() || "N/A";
                    const form1 = document.getElementById('jobTitleInput')?.value.trim() || "N/A";
                                        const form2 = document.getElementById('companyNameInput')?.value.trim() || "N/A";
                                        const form3 = document.getElementById('locationInput')?.value.trim() || "N/A";
                                        const form4 = document.getElementById('descriptionInput')?.value.trim() || "N/A";

                    // Extract skills
                    const hardSkills = [...document.getElementById('hardSkills')?.querySelectorAll('li') || []]
                        .map(li => li.innerText.trim()).join(', ') || "N/A";

                    // Extract technical_skills
                    const softSkills = [...document.getElementById('softSkills')?.querySelectorAll('li') || []]
                        .map(li => li.innerText.trim()).join(', ') || "N/A";

                    // Extract Key Responsibilities
                    const keyResponsibilities = [...document.getElementById('jobSummary')?.querySelectorAll('li') || []]
                        .map(li => li.innerText.trim()).join('\n- ') || "N/A";

                    // Construct a formatted string with extracted information
                    const jobDetailsString = `
                        Job Title: ${jobTitle}
                        Company: ${companyName}
                        Location: ${location}
                        Salary: ${salary}
                        Alignment: ${alignment}
                        job_match_score: ${jobMatchScore}

                        skills: ${hardSkills}
                        technical_skills: ${softSkills}

                        Key Responsibilities:
                        - ${keyResponsibilities}

                        ${form1} ${form2} ${form3} ${form4}
                    `;

                    // console.log("🚀 Sending extracted High-Level Job Details to JobGen.AI", jobDetailsString + savedata);

                    async function saveJobDetails() {
                        try {
                            // Send extracted details to JobGen.AI API
                            const result = await sendSaveJobDetailsToBubble(jobDetailsString + savedata, window.selectedStarRating, jobTitle, companyName);
                            console.log(result);

                            // Check the outcome
                            if (result?.outcome === "Pass") {
                                document.getElementById("saveButton").innerText = "Saved";
                                // console.log(document.getElementById("saveButton").innerText);
                                // console.log("Job details saved successfully!");
                                const messageerror = document.getElementById('warningMessage');
                                messageerror.style.display = 'none';
                            } else {
                                // console.log("Job details saving failed.");
                                const messageerror = document.getElementById('warningMessage');
                                messageerror.innerText = "Error: Please try saving again!";
                                messageerror.style.display = 'block';
                            }
                        } catch (error) {
                            // console.error("Error saving job details:", error);
                        }
                    }


                    // Call the function when needed
                    saveJobDetails();

                }
            });





    let buttons = document.querySelectorAll('#saveButton');

    buttons.forEach(button => {
      button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#30A1FB'; // Darker shade of blue
      });

      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#3f6afd'; // Original color
      });
    });

     buttons = document.querySelectorAll('#reviewButton, #applyButton');

        buttons.forEach(button => {
          button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#f4f4f4'; // Darker shade of blue
          });

          button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#f4f4f4'; // Original color
          });
        });



  });

  document.body.appendChild(button);

let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      // console.log('URL changed, resetting UI.');
      const container = document.getElementById('jobContainer');
      if (container) {
         document.body.removeChild(container);
      }
      const jobButton = document.getElementById('jobButton');
      if (jobButton) jobButton.click();
      currentUrl = window.location.href;
    }
  }, 500);
}

async function displayJobInfoIndeed() {
  // console.log("on indeed");
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    @font-face {
      font-family: 'Inter';
      src: url('${chrome.runtime.getURL('fonts/Inter-Light.woff2')}') format('woff2');
      font-weight: normal;
      font-style: normal;
    }

    @font-face {
      font-family: 'InterBold';
      src: url('${chrome.runtime.getURL('fonts/Inter-Bold.woff2')}') format('woff2');
      font-weight: bold;
      font-style: normal;
    }

    #jobContainer, #jobContainer * {
      font-family: 'Inter', sans-serif !important;
      z-index: 2147483647;
      margin: 0;
      padding: 0;
      line-height: 1.2; /* Reduce space between lines */
    }

    #jobTitle, #companyName {
    font-family: 'InterBold', sans-serif !important;
    font-weight: bold;
    font-size: 16px;
    }

    #location, #salary {
       font-weight: normal;
       font-size: 14px;
    }

    body {
     font-family: 'Inter', sans-serif;
       font-weight: normal;
       font-size: 14px;
     }

    h3 {
      font-family: 'InterBold', sans-serif !important;
      font-weight: bold;
      font-size: 16px;
    }

    h1 {
          font-family: 'InterBold', sans-serif !important;
          font-weight: bold;
          font-size: 16px;
        }
    h2 {
          font-family: 'InterBold', sans-serif !important;
          font-weight: bold;
          font-size: 16px;
        }
    h4 {
          font-family: 'InterBold', sans-serif !important;
          font-weight: bold;
          font-size: 16px;
        }

    /* Ring Graph Styles */
    .ring-graph {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: conic-gradient(#3f6afd calc(var(--percent) * 1%), #ddd 0);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ring-graph::after {
      content: '';
      position: absolute;
      width: 70%;
      height: 70%;
      border-radius: 50%;
      background: white;
    }

    .percentage-text {
      position: relative;
      z-index: 99999;
      font-size: 16px;
      font-weight: bold;
      color: black;
    }

     .section-title {
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: black;
                font-weight: bold;
                padding: 10px 0;
            }
            .dropdown-icon {
                font-size: 14px;
                transition: transform 0.3s;
            }
            .collapsed .dropdown-icon {
                transform: rotate(180deg);
            }
            .content {
                display: none;
                padding-left: 20px;
                color: black;
            }
            hr {
                border: 1px solid #ddd;
                margin: 20px 0;
            }
  `;

  document.head.appendChild(styleElement); // Add style to head
  document.body.appendChild(styleElement); // Add style to head

  const button = document.createElement('button');
  button.id = 'jobButton';
  button.style.position = 'fixed';
  button.style.top = '50%';
  button.style.right = '10px';
  button.style.transform = 'translateY(-50%)';
  button.style.backgroundColor = '#FFFFFF';
  button.style.border = 'none';
  button.style.padding = '0';
  button.style.borderRadius = '10px';
  button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  button.style.zIndex = '99999';
  button.style.width = '60px';
  button.style.height = '60px';
  button.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/icon48.png" alt="Logo" style="width: 100%; height: 100%;" />`;

  let isDragging = false;

  button.addEventListener('mousedown', (e) => {
    isDragging = true;
    const offsetY = e.clientY - button.getBoundingClientRect().top;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
    });

    function onMouseMove(e) {
      if (isDragging) {
        const topPosition = e.clientY - offsetY;
        button.style.top = `${topPosition}px`; // Adjust vertical position
        button.style.right = '0';  // Keep button fixed on the right edge
      }
    }
  });



  button.addEventListener('click', async () => {
    button.style.display = 'none';

    const container = document.createElement('div');
    container.id = 'jobContainer';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.right = '0';
    container.style.height = '100%';
    container.style.backgroundColor = '#FFFFFF';
    container.style.padding = '0';
    container.style.borderRadius = '0px';
    container.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    container.style.zIndex = '99999';
    container.style.maxWidth = '400px';
    container.style.width = '400px';
    container.style.overflowY = 'auto';

    // Global variables
    let currentlink = window.location.href.toLowerCase();
    let jobTitleElement, companyElement, jobLocationElement, companyLogoElement;
    let jobTitle = "", companyName = "", jobLocation = "", companyLogoUrl = "";





    container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100vh; box-sizing: border-box;">
              <!-- Header Section -->
              <div style="background-color: black; padding: 15px; display: flex; align-items: center; justify-content: flex-start; width: 100%; box-sizing: border-box; position: sticky; top: 0; height:70px; z-index: 99999;">
                <img src="chrome-extension://${chrome.runtime.id}/icon48.png" alt="Logo" style="width: 40px; height: 40px; margin-right: 10px;" />
                <h3 style="margin: 0; font-size: 26px; font-weight: bold;">
                  <span style="color: white;">JOB</span><span style="color: white;">GEN.AI</span>
                </h3>
              </div>
      <hr style="border: none; border-top: 2px solid black; margin: 0;">

              <!-- Close Button (positioned in top-right corner of header) -->
              <button id="closeButton" style="position: absolute; top: 15px; right: 15px; padding: 5px; background-color: black; border: none; border-radius: 5px; z-index: 100000;">
                <img src="chrome-extension://${chrome.runtime.id}/cross.png" alt="Close" style="width: 30px; height: 30px;">
              </button>


        <div style="display: flex; align-items: center; margin-top: 10px;">
          <div style="display: flex; align-items: center; justify-content: center; margin-right: 30px; margin-left: 20px; width: 80px; height: 80px;">
            <img id="companyLogo" src="${companyLogoUrl}" alt="Company Logo" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>


         <div style="display: flex; flex-direction: column; align-items: flex-start;">
           <p id="jobTitle" style="color: #002F8D; margin: 0;">${jobTitle}</p>
           <p id="companyName" style="color: black; margin: 0;">${companyName}</p>
           <p id="location" style="color: black; margin: 0;">${jobLocation}</p>
           <p id="salary" style="color: black; margin: 0;"></p>

           <!-- Excitement Text and Clickable Star Rating on Same Line -->
           <div id="starRating" style="margin-top: 8px; display: flex; align-items: center;">
             <span style="margin-right: 8px; font-weight: bold;">Excitement:</span>
             <span class="star" data-value="1" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
             <span class="star" data-value="2" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
             <span class="star" data-value="3" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
             <span class="star" data-value="4" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
             <span class="star" data-value="5" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
           </div>
         </div>

        </div>

        <!-- Tab Buttons -->
        <div style="display: flex; border-bottom: 2px solid #ddd; margin-top: 20px;">
          <button id="highLevelTab" style="flex: 1; padding: 10px; background-color: #3f6afd;color: white; border: none; text-align: center; cursor: pointer; border-radius: 5px 5px 0 0; transition: background-color 0.3s;">
            Job Match
          </button>
          <button id="linkedinTab" style="flex: 1; padding: 10px; background-color: #f4f4f4; border: none; text-align: center; cursor: pointer; transition: background-color 0.3s;">
                       Linkedin Optimizer
                    </button>

        </div>

        <div id="warningMessage" style="
          display: none;
          margin: 20px auto;
          padding: 12px 20px;
          max-width: 80%;
          background-color: #ffe6e6;
          color: #cc0000;
          border: 1px solid #cc0000;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          font-size: 16px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        ">
        </div>

        <!-- Tabs Content -->
        <div id="tabsContent" style="flex: 1; overflow-y: auto; padding: 10px; box-sizing: border-box; margin-bottom: 60px">
          <div id="highLevelContent" style="padding: 10px;">

                 <!-- Hidden Form -->
            <div id="jobDetailsForm" style="display: none; margin-top: 10px; padding: 10px;">
              <label for="jobTitleInput" style="color: black;">Job Title:</label>
              <input type="text" id="jobTitleInput" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">

              <label for="companyNameInput" style="color: black; margin-top: 10px;">Company Name:</label>
              <input type="text" id="companyNameInput" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">

              <label for="jobUrlInput" style="color: black; margin-top: 10px;">Job URL:</label>
              <input type="url" id="jobUrlInput" placeholder="https://example.com/job-posting" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">

              <label for="locationInput" style="color: black; margin-top: 10px;">Location:</label>
              <input type="text" id="locationInput" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">

            <label for="descriptionInput" style="color: black; margin-top: 10px;">Description:</label>
            <input type="text" id="descriptionInput" required style="width: 100%; height: 270px; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">
     </div>


            <div style="display: flex; justify-content: space-between; align-items: center; margin-left: 5px;">
              <div style="flex: 1;">
                <h4 style="color: black; font-weight: bold;">Your Match:</h4>
                <ul id="alignment" style="color: black; padding-left: 0;">Loading YOUR alignment...</ul>
              </div>
              <div style="flex: 0 0 100px; text-align: center;">
                <div class="ring-graph" style="--percent: 0;">
                  <div class="percentage-text" id="scoreText">0%</div>
                </div>
              </div>
            </div>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

            <h4 style="color: black; font-weight: bold;">Keywords:</h4>
                                    <ul id="keywords" style="color: black; padding-left: 20px;">
                                      <li>Loading summary...</li>
                                    </ul>

                        <hr style="border: 1px solid #ddd; margin: 20px 0;" />

            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
              <div style="flex: 1; padding-right: 20px;">
                <h4 style="color: black; font-weight: bold;">Skills:</h4>
                <ul id="hardSkills" style="color: black; padding-left: 20px;">
                  <li>Loading skills...</li>
                </ul>
              </div>

              <hr style="border: 1px solid #ddd; margin: 20px 0;" />

              <div style="flex: 1; padding-left: 20px;">
                <h4 style="color: black; font-weight: bold;">Technical Skills:</h4>
                <ul id="softSkills" style="color: black; padding-left: 20px;">
                  <li>Loading skills...</li>
                </ul>
              </div>
            </div>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

            <h4 style="color: black; font-weight: bold;">Key Responsibilities:</h4>
            <ul id="jobSummary" style="color: black; padding-left: 20px;">
              <li>Loading summary...</li>
            </ul>



        </div>

        <div id="linkedinContent" style="padding: 10px; display: none;">
        <div id="warningMessage" style="color: red; margin-top: 10px; text-align: center; font-weight: bold; display: none;">You need to be on your linkedin profile to access ths feature <3</div>


                </div>

        <!-- Footer Section (Fixed) -->
        <div id="footer" style="position: fixed; bottom: 0; width: 100%; padding: 0 0; background-color: white; border-top: 2px solid black; z-index: 99999; display: flex; align-items: center;">
          <button id="saveButton" style="padding: 10px 20px; margin: 15px; margin-left: 50px; background-color: #3f6afd; color: white; border: none; border-radius: 20px;">Save</button>
          <button id="reviewButton" style="padding: 10px 20px; margin: 15px; background-color: #f4f4f4; color: black; border: none; border-radius: 20px;">Review</button>
          <button id="applyButton" style="padding: 10px 20px; margin: 15px; background-color: #f4f4f4; color: black; border: none; border-radius: 20px;">Apply</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const stars = document.querySelectorAll('#starRating .star');

    // Default rating
    let rating = 3;
    window.selectedStarRating = rating;

    // Set initial star appearance
    stars.forEach(s => {
      if (parseInt(s.getAttribute('data-value')) <= rating) {
        s.textContent = '★';
      } else {
        s.textContent = '☆';
      }
    });

    // Add click listeners
    stars.forEach(star => {
      star.addEventListener('click', () => {
        rating = parseInt(star.getAttribute('data-value'));

        stars.forEach(s => {
          if (parseInt(s.getAttribute('data-value')) <= rating) {
            s.textContent = '★';
          } else {
            s.textContent = '☆';
          }
        });

        window.selectedStarRating = rating;
        console.log('User selected rating:', rating);
      });
    });



    document.getElementById('reviewButton').addEventListener('mouseover', (event) => {
        showTooltip(event, "🚀 Review Coming Soon!");
    });

    document.getElementById('reviewButton').addEventListener('mousemove', (event) => {
        showTooltip(event, "🚀 Review Coming Soon!");
    });

    document.getElementById('reviewButton').addEventListener('mouseout', () => {
        removeTooltip();
    });

    document.getElementById('reviewButton').addEventListener('click', (event) => {
        event.preventDefault();
        alert("🚀 Review Feature Coming Soon!");
    });

    document.getElementById('applyButton').addEventListener('mouseover', (event) => {
        showTooltip(event, "🚀 Apply Coming Soon!");
    });

    document.getElementById('applyButton').addEventListener('mousemove', (event) => {
        showTooltip(event, "🚀 Apply Coming Soon!");
    });

    document.getElementById('applyButton').addEventListener('mouseout', () => {
        removeTooltip();
    });

    document.getElementById('applyButton').addEventListener('click', (event) => {
        event.preventDefault();
        alert("🚀 Apply Feature Coming Soon!");
    });

    document.getElementById('closeButton').addEventListener('click', () => {
          const container = document.getElementById('jobContainer');
          if (container) {
            document.body.removeChild(container);
          }
          const button = document.getElementById('jobButton');
          if (button) {
            button.style.display = 'block';
          }
        });

        document.querySelectorAll('.section-title').forEach(title => {
            title.addEventListener('click', () => {
                const sectionId = title.getAttribute('data-target');
                const section = document.getElementById(sectionId);
                if (section) {
                    section.style.display = section.style.display === 'block' ? 'none' : 'block';
                    title.classList.toggle('collapsed');
                }
            });
        });




    const tabs = document.querySelectorAll('#highLevelTab, #linkedinTab');
        const warningMessage = document.getElementById('warningMessage');
        const currentURL = window.location.href.toLowerCase(); // Get the full URL in lowercase

        tabs.forEach(tab => {
                  tab.addEventListener('mouseover', () => {
                    tab.style.backgroundColor = '#e0e0e0';
                    if (tab.classList.contains('active')) {
                      tab.style.backgroundColor = '#3f6afd';
                    }
                  }); // <-- Closing parenthesis and curly brace correctly placed


          tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabs.forEach(t => {
              t.style.backgroundColor = t.classList.contains('active') ? '#3f6afd' : '#f4f4f4';
              t.style.color = t.classList.contains('active') ? 'white' : 'black';
            });


              if (tab.id === 'linkedinTab') {
                showWarning("Try this feature on YOUR linkedin profile for the best results!");
              } else {
                showContent(tab.id);
              }

          });
        });

        // Function to show tab content
            function showForm(tabId) {
              // console.log("lets show form");
              document.getElementById("jobDetailsForm").style.display = "block";
              document.getElementById("alignment").style.display = "none";
              document.getElementById("hardSkills").style.display = "none";
              document.getElementById("softSkills").style.display = "none";
              document.getElementById("jobSummary").style.display = "none";
              document.getElementById("companyName").style.display = "none";
              document.getElementById("salary").style.display = "none";
              // Select all h4 elements inside the specific structure and hide them
              document.querySelectorAll("#highLevelContent > div:nth-child(2) > div:nth-child(1) > h4")
                  .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(4) > div:nth-child(1) > h4")
                            .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > h4")
                                          .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(2) > div:nth-child(1) > h4")
                                                        .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(2) > div:nth-child(2) > div")
                                                                  .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(4) > div:nth-child(3) > h4")
                                                                  .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > hr:nth-child(5)")
                                                                            .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > hr:nth-child(3)")
                                                                            .forEach(el => el.style.display = "none");
              document.getElementById('highLevelContent').style.display = tabId === 'highLevelTab' ? 'block' : 'none';
                // Hide Skills title
                const skillsTitle = document.querySelector("#highLevelContent > div:nth-of-type(3) > div:nth-of-type(1) > h4");
                if (skillsTitle) skillsTitle.style.display = "none";

                // Hide Skills list
                const skillsList = document.getElementById("hardSkills");
                if (skillsList) skillsList.style.display = "none";

                // Hide Technical Skills title
                const technicalSkillsTitle = document.querySelector("#highLevelContent > div:nth-of-type(3) > div:nth-of-type(2) > h4");
                if (technicalSkillsTitle) technicalSkillsTitle.style.display = "none";

                // Hide Technical Skills list
                const technicalSkillsList = document.getElementById("softSkills");
                if (technicalSkillsList) technicalSkillsList.style.display = "none";

              // Hide warning message
              warningMessage.style.display = 'none';
              warningMessage.innerText = "";

              // 2. Hide the "Loading summary..." list
                            const keywordsList = document.getElementById("keywords");
                            if (keywordsList) keywordsList.style.display = "none";

                            // 2. Hide the "Loading summary..." list
                                          const rate = document.getElementById("starRating");
                                          if (rate) rate.style.display = "none";

                            const hrs = document.querySelectorAll("#highLevelContent > hr");
                            hrs.forEach(hr => hr.style.display = "none");

                            document.getElementById("jobTitle").textContent = 'Enter job manually';


            }

        // Function to show tab content
        function showContent(tabId) {
          document.getElementById('highLevelContent').style.display = tabId === 'highLevelTab' ? 'block' : 'none';

          // Hide warning message
          warningMessage.style.display = 'none';
          warningMessage.innerText = "";
        }

        // Function to show a warning message
        function showWarning(message) {
          warningMessage.innerText = message;
          warningMessage.style.display = 'block';

          // Hide all tab content
          document.getElementById('highLevelContent').style.display = 'none';
        }

      document.getElementById('highLevelTab').click();

      const jobelement = document.querySelector('#jobDescriptionText');
      let jobText = jobelement ? jobelement.innerText : "Try again";

      // console.log("Extracted Job Details:", jobText);

      let datafrombubble;

      async function main() {
         // console.log("in main");
          datafrombubble = await sendJobDetailsToBubble(jobTitle, companyName, jobText);
          console.log("Job Data from Bubble:", datafrombubble);
          // console.log("main done");

          // console.log("time to parse data from bubble for indeed", datafrombubble);
                const datajson = JSON.stringify(datafrombubble);
                const summary = JSON.parse(datajson);
                // console.log("summary: ", summary);
                // console.log(typeof datafrombubble);
                // console.log(typeof datajson);
                // console.log(typeof summary);
                // console.log("Available keys in summary:", Object.keys(summary));

                // Parse the job_data field if it's a string
                if (typeof summary["job_data"] === "string") {
                  try {
                    summary["job_data"] = JSON.parse(summary["job_data"]); // Convert to an object
                  } catch (error) {
                    // console.error("Error parsing job_data JSON:", error);
                  }
                }

                // console.log("Value of summary['Salary']:", summary["Salary"]);
                // console.log("Value of summary['Salary']:", summary["job_data"]?.["Salary"]);

                if (datafrombubble) {
                  // console.log("will display data from bubble now:");
                  const jobDetails = document.querySelector('#highLevelContent');
                  jobDetails.style.display = 'block';


                  const salaryMatch = summary["job_data"]?.["Salary"] || "Not provided";
                  const alignment = summary["job_data"]?.["alignment_with_user_profile"] || "Not provided";
                  const score = summary["job_data"]?.["job_match_score"] || "Not provided";

                  // console.log(salaryMatch);


                  if (salaryMatch) {
                    document.getElementById('salary').innerText = salaryMatch;
                    if (salaryMatch == "Not provided") {
                         document.getElementById('salary').innerText = '';
                    }
                  }
                  if (alignment) {
                    document.getElementById('alignment').innerText = alignment;
                  }

                  if (score) {
                    // console.log(typeof score, score);
                    // console.log(score.replace('%', ''));
                    let numericScore = parseInt(score.replace('%', ''));
                    // console.log(typeof numericScore, numericScore);

                    // Update the ring graph
                    const ringGraph = document.querySelector('.ring-graph');
                    ringGraph.style.setProperty('--percent', numericScore);
                    document.getElementById('scoreText').textContent = score;
                  }

                  if (summary["job_data"]?.["skills"]) {
                    const skillsList = summary["job_data"]?.["skills"]
                      .map(skill => `<li>${skill}</li>`)
                      .join('');
                    document.getElementById('hardSkills').innerHTML = skillsList;
                  }

                  if (summary["job_data"]?.["technical_skills"]) {
                            const skillsList = summary["job_data"]?.["technical_skills"]
                              .map(skill => `<li>${skill}</li>`)
                              .join('');
                            document.getElementById('softSkills').innerHTML = skillsList;
                          }

                  if (summary["job_data"]?.["top_responsibilities"]) {
                    const responsibilitiesList = summary["job_data"]?.["top_responsibilities"]
                      .map(task => `<li>${task}</li>`)
                      .join('');
                    document.getElementById('jobSummary').innerHTML = responsibilitiesList;
                  }

                  if (summary["job_data"]?.["keywords"]) {
                                      const responsibilitiesList = summary["job_data"]?.["keywords"]
                                        .map(task => `<li>${task}</li>`)
                                        .join('');
                                      document.getElementById('keywords').innerHTML = responsibilitiesList;
                                    }

                }
      }

      // Call the function
      main();

       // Function to wait for an element to appear in the DOM
              async function waitForElement(selector, timeout = 5000) {
                  return new Promise((resolve, reject) => {
                      const interval = 100;
                      let elapsedTime = 0;

                      const checkElement = setInterval(() => {
                          let element = document.querySelector(selector);
                          if (element) {
                              clearInterval(checkElement);
                              resolve(element);
                          }
                          elapsedTime += interval;
                          if (elapsedTime >= timeout) {
                              clearInterval(checkElement);
                              reject(new Error(`Timeout: ${selector} not found`));
                          }
                      }, interval);
                  });
              }

              // Main function to extract job details
              async function extractJobDetails() {
                  try {
                      // console.log("🔎 Waiting for job details to load...");

                      // Wait for and assign global variables
                      jobTitleElement = await waitForElement('h2[data-testid="simpler-jobTitle"]', 5000);


                      // Extract text or image URL
                      jobTitle = jobTitleElement ? jobTitleElement.innerText.trim() : "";

                      // Debugging logs
                      // console.log("📌 Job Title:", jobTitle);
                      // console.log("🏢 Company Name:", companyName);
                      // console.log("📍 Job Location:", jobLocation);
                      // console.log("🖼️ Company Logo URL:", companyLogoUrl);
                  } catch (error) {
                      // console.error("❌ Error extracting job details:", error.message);
                  }
              }

              // Execute the function
              await extractJobDetails();

              companyLogoElement = document.querySelector('div[data-testid="simpler-left-logo"] img');
              companyLogoUrl = companyLogoElement ? companyLogoElement.src : `chrome-extension://${chrome.runtime.id}/empty.png`;
              companyElement = document.querySelector('.jobsearch-JobInfoHeader-companyNameLink');
              jobLocationElement = document.querySelector('div[data-testid="jobsearch-JobInfoHeader-companyLocation"] div');
              companyName = companyElement ? companyElement.innerText.trim() : "";
              jobLocation = jobLocationElement ? jobLocationElement.innerText.trim() : "";
              document.getElementById('jobTitle').innerText = jobTitle;
              document.getElementById('companyName').innerText = companyName;
              document.getElementById('location').innerText = jobLocation;
              document.getElementById('companyLogo').src = companyLogoUrl;


    document.getElementById('saveButton').addEventListener('click', () => {
                // console.log("pressed save button");

                const highLevelTab = document.getElementById('highLevelTab');
                // console.log(highLevelTab);

               if (highLevelTab && highLevelTab.classList.contains('active')) {
                    // console.log("✅ Save button clicked on High-Level Tab");

                    // Extract job details
                    const jobTitle = document.getElementById('jobTitle')?.innerText.trim() || "N/A";
                    const companyName = document.getElementById('companyName')?.innerText.trim() || "N/A";
                    const location = document.getElementById('location')?.innerText.trim() || "N/A";
                    const salary = document.getElementById('salary')?.innerText.trim() || "N/A";
                    const alignment = document.getElementById('alignment')?.innerText.trim() || "N/A";
                    const jobMatchScore = document.getElementById('scoreText')?.innerText.trim() || "N/A";
                    const form1 = document.getElementById('jobTitleInput')?.value.trim() || "N/A";
                    const form2 = document.getElementById('companyNameInput')?.value.trim() || "N/A";
                    const form3 = document.getElementById('locationInput')?.value.trim() || "N/A";
                    const form4 = document.getElementById('descriptionInput')?.value.trim() || "N/A";

                    // Extract skills
                    const hardSkills = [...document.getElementById('hardSkills')?.querySelectorAll('li') || []]
                        .map(li => li.innerText.trim()).join(', ') || "N/A";

                    // Extract technical_skills
                    const softSkills = [...document.getElementById('softSkills')?.querySelectorAll('li') || []]
                        .map(li => li.innerText.trim()).join(', ') || "N/A";

                    // Extract Key Responsibilities
                    const keyResponsibilities = [...document.getElementById('jobSummary')?.querySelectorAll('li') || []]
                        .map(li => li.innerText.trim()).join('\n- ') || "N/A";

                    // Construct a formatted string with extracted information
                    const jobDetailsString = `
                        Job Title: ${jobTitle}
                        Company: ${companyName}
                        Location: ${location}
                        Salary: ${salary}
                        Alignment: ${alignment}
                        job_match_score: ${jobMatchScore}

                        skills: ${hardSkills}
                        technical_skills: ${softSkills}

                        Key Responsibilities:
                        - ${keyResponsibilities}

                        ${form1} ${form2} ${form3} ${form4}
                    `;

                    // console.log("🚀 Sending extracted High-Level Job Details to Bubble.io:", jobDetailsString + jobText);

                    async function saveJobDetails() {
                        try {
                            // Send extracted details to Bubble API
                            const result = await sendSaveJobDetailsToBubble(jobDetailsString + savedata, window.selectedStarRating, jobTitle, companyName);
                            console.log(result);

                            // Check the outcome
                            if (result?.outcome === "Pass") {
                                document.getElementById("saveButton").innerText = "Saved";
                                // console.log(document.getElementById("saveButton").innerText);
                                // console.log("Job details saved successfully!");
                                const messageerror = document.getElementById('warningMessage');
                                                                messageerror.style.display = 'none';
                            } else {
                                // console.log("Job details saving failed.");
                                const messageerror = document.getElementById('warningMessage');
                                                                messageerror.innerText = "Error: Please try saving again!";
                                                                messageerror.style.display = 'block';
                            }
                        } catch (error) {
                            // console.error("Error saving job details:", error);
                        }
                    }


                    // Call the function when needed
                    saveJobDetails();

                }
            });

    let buttons = document.querySelectorAll('#reviewButton, #applyButton');

    buttons.forEach(button => {
      button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#f4f4f4'; // Darker shade of blue
      });

      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#f4f4f4'; // Original color
      });
    });

     buttons = document.querySelectorAll('#saveButton');

        buttons.forEach(button => {
          button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#30A1FB'; // Darker shade of blue
          });

          button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#3f6afd'; // Original color
          });
        });



  });

  document.body.appendChild(button);

let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      // console.log('URL changed, resetting UI.');
      const container = document.getElementById('jobContainer');
      if (container) {
       document.body.removeChild(container);
      }

      const jobButton = document.getElementById('jobButton');
      if (jobButton) jobButton.click();
      currentUrl = window.location.href;
    }
  }, 500);
}

async function displayJobInfoSeek() {
  // console.log("on seek");


  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    @font-face {
      font-family: 'Inter';
      src: url('${chrome.runtime.getURL('fonts/Inter-Light.woff2')}') format('woff2');
      font-weight: normal;
      font-style: normal;
    }

    @font-face {
      font-family: 'InterBold';
      src: url('${chrome.runtime.getURL('fonts/Inter-Bold.woff2')}') format('woff2');
      font-weight: bold;
      font-style: normal;
    }

    #jobContainer, #jobContainer * {
      font-family: 'Inter', sans-serif !important;
      margin: 0;
      padding: 0;
      z-index: 2147483647;
      line-height: 1.2; /* Reduce space between lines */
    }

    #jobTitle, #companyName {
    font-family: 'InterBold', sans-serif !important;
    font-weight: bold;
    font-size: 16px;
    }

    #location, #salary {
       font-weight: normal;
       font-size: 14px;
    }

    body {
     font-family: 'Inter', sans-serif;
       font-weight: normal;
       font-size: 14px;
     }

    h3 {
      font-family: 'InterBold', sans-serif !important;
      font-weight: bold;
      font-size: 16px;
    }

    h1 {
          font-family: 'InterBold', sans-serif !important;
          font-weight: bold;
          font-size: 16px;
        }
    h2 {
          font-family: 'InterBold', sans-serif !important;
          font-weight: bold;
          font-size: 16px;
        }
    h4 {
          font-family: 'InterBold', sans-serif !important;
          font-weight: bold;
          font-size: 16px;
        }

    /* Ring Graph Styles */
    .ring-graph {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: conic-gradient(#3f6afd calc(var(--percent) * 1%), #ddd 0);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ring-graph::after {
      content: '';
      position: absolute;
      width: 70%;
      height: 70%;
      border-radius: 50%;
      background: white;
    }

    .percentage-text {
      position: relative;
      z-index: 99999;
      font-size: 16px;
      font-weight: bold;
      color: black;
    }

     .section-title {
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: black;
                font-weight: bold;
                padding: 10px 0;
            }
            .dropdown-icon {
                font-size: 14px;
                transition: transform 0.3s;
            }
            .collapsed .dropdown-icon {
                transform: rotate(180deg);
            }
            .content {
                display: none;
                padding-left: 20px;
                color: black;
            }
            hr {
                border: 1px solid #ddd;
                margin: 20px 0;
            }
  `;

  document.head.appendChild(styleElement); // Add style to head
  document.body.appendChild(styleElement); // Add style to head

  const button = document.createElement('button');
  button.id = 'jobButton';
  button.style.position = 'fixed';
  button.style.top = '50%';
  button.style.right = '10px';
  button.style.transform = 'translateY(-50%)';
  button.style.backgroundColor = '#FFFFFF';
  button.style.border = 'none';
  button.style.padding = '0';
  button.style.borderRadius = '10px';
  button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  button.style.zIndex = '99999';
  button.style.width = '60px';
  button.style.height = '60px';
  button.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/icon48.png" alt="Logo" style="width: 100%; height: 100%;" />`;

  let isDragging = false;

  button.addEventListener('mousedown', (e) => {
    isDragging = true;
    const offsetY = e.clientY - button.getBoundingClientRect().top;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
    });

    function onMouseMove(e) {
      if (isDragging) {
        const topPosition = e.clientY - offsetY;
        button.style.top = `${topPosition}px`; // Adjust vertical position
        button.style.right = '0';  // Keep button fixed on the right edge
      }
    }
  });



  button.addEventListener('click',async () => {
    button.style.display = 'none';

    const container = document.createElement('div');
    container.id = 'jobContainer';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.right = '0';
    container.style.height = '100%';
    container.style.backgroundColor = '#FFFFFF';
    container.style.padding = '0';
    container.style.borderRadius = '0px';
    container.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    container.style.zIndex = '99999';
    container.style.maxWidth = '400px';
    container.style.width = '400px';
    container.style.overflowY = 'auto';



    const currentlink = window.location.href.toLowerCase();

      // Global variables
      let jobTitleElement, companyElement, jobLocationElement, companyLogoElement;
      let jobTitle = "", companyName = "", jobLocation = "", companyLogoUrl = "";




    container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100vh; box-sizing: border-box;">
              <!-- Header Section -->
              <div style="background-color: black; padding: 15px; display: flex; align-items: center; justify-content: flex-start; width: 100%; box-sizing: border-box; position: sticky; top: 0; height:70px; z-index: 99999;">
                <img src="chrome-extension://${chrome.runtime.id}/icon48.png" alt="Logo" style="width: 40px; height: 40px; margin-right: 10px;" />
                <h3 style="margin: 0; font-size: 26px; font-weight: bold;">
                  <span style="color: white;">JOB</span><span style="color: white;">GEN.AI</span>
                </h3>
              </div>
      <hr style="border: none; border-top: 2px solid black; margin: 0;">

              <!-- Close Button (positioned in top-right corner of header) -->
              <button id="closeButton" style="position: absolute; top: 15px; right: 15px; padding: 5px; background-color: black; border: none; border-radius: 5px; z-index: 100000;">
                <img src="chrome-extension://${chrome.runtime.id}/cross.png" alt="Close" style="width: 30px; height: 30px;">
              </button>


        <div style="display: flex; align-items: center; margin-top: 10px;">
         <div style="display: flex; align-items: center; justify-content: center; margin-right: 30px; margin-left: 20px; width: 80px; height: 80px;">
           <img id="companyLogo" src="${companyLogoUrl}" alt="Company Logo" style="width: 100%; height: 100%; object-fit: contain;" />
         </div>


         <div style="display: flex; flex-direction: column; align-items: flex-start;">
           <p id="jobTitle" style="color: #002F8D; margin: 0;">${jobTitle}</p>
           <p id="companyName" style="color: black; margin: 0;">${companyName}</p>
           <p id="location" style="color: black; margin: 0;">${jobLocation}</p>
           <p id="salary" style="color: black; margin: 0;"></p>

           <!-- Excitement Text and Clickable Star Rating on Same Line -->
           <div id="starRating" style="margin-top: 8px; display: flex; align-items: center;">
             <span style="margin-right: 8px; font-weight: bold;">Excitement:</span>
             <span class="star" data-value="1" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
             <span class="star" data-value="2" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
             <span class="star" data-value="3" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
             <span class="star" data-value="4" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
             <span class="star" data-value="5" style="font-size: 20px; cursor: pointer; color: gold;">★</span>
           </div>
         </div>

        </div>

        <!-- Tab Buttons -->
        <div style="display: flex; border-bottom: 2px solid #ddd; margin-top: 20px;">
          <button id="highLevelTab" style="flex: 1; padding: 10px; background-color:color: white; #3f6afd; border: none; text-align: center; cursor: pointer; border-radius: 5px 5px 0 0; transition: background-color 0.3s;">
            Job Match
          </button>
          <button id="linkedinTab" style="flex: 1; padding: 10px; background-color: #f4f4f4; border: none; text-align: center; cursor: pointer; transition: background-color 0.3s;">
                       Linkedin Optimizer
                    </button>

        </div>

        <div id="warningMessage" style="
          display: none;
          margin: 20px auto;
          padding: 12px 20px;
          max-width: 80%;
          background-color: #ffe6e6;
          color: #cc0000;
          border: 1px solid #cc0000;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          font-size: 16px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        ">
        </div>

        <!-- Tabs Content -->
        <div id="tabsContent" style="flex: 1; overflow-y: auto; padding: 10px; box-sizing: border-box; margin-bottom: 60px">
          <div id="highLevelContent" style="padding: 10px;">

                 <!-- Hidden Form -->
            <div id="jobDetailsForm" style="display: none; margin-top: 10px; padding: 10px;">
              <label for="jobTitleInput" style="color: black;">Job Title:</label>
              <input type="text" id="jobTitleInput" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">

              <label for="companyNameInput" style="color: black; margin-top: 10px;">Company Name:</label>
              <input type="text" id="companyNameInput" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">

              <label for="jobUrlInput" style="color: black; margin-top: 10px;">Job URL:</label>
              <input type="url" id="jobUrlInput" placeholder="https://example.com/job-posting" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">

              <label for="locationInput" style="color: black; margin-top: 10px;">Location:</label>
              <input type="text" id="locationInput" style="width: 100%; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">
<label for="descriptionInput" style="color: black; margin-top: 10px;">Description:</label>
<input type="text" id="descriptionInput" required style="width: 100%; height: 270px; padding: 12px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">
  </div>


            <div style="display: flex; justify-content: space-between; align-items: center; margin-left: 5px;">
              <div style="flex: 1;">
                <h4 style="color: black; font-weight: bold;">Your Match:</h4>
                <ul id="alignment" style="color: black; padding-left: 0;">Loading YOUR alignment...</ul>
              </div>
              <div style="flex: 0 0 100px; text-align: center;">
                <div class="ring-graph" style="--percent: 0;">
                  <div class="percentage-text" id="scoreText">0%</div>
                </div>
              </div>
            </div>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

            <h4 style="color: black; font-weight: bold;">Keywords:</h4>
                        <ul id="keywords" style="color: black; padding-left: 20px;">
                          <li>Loading summary...</li>
                        </ul>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />



            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
              <div style="flex: 1; padding-right: 20px;">
                <h4 style="color: black; font-weight: bold;">Skills:</h4>
                <ul id="hardSkills" style="color: black; padding-left: 20px;">
                  <li>Loading skills...</li>
                </ul>
              </div>

              <hr style="border: 1px solid #ddd; margin: 20px 0;" />

              <div style="flex: 1; padding-left: 20px;">
               <h4 style="color: black; font-weight: bold;">Technical Skills:</h4>
                <ul id="softSkills" style="color: black; padding-left: 20px;">
                  <li>Loading skills...</li>
                </ul>
              </div>
            </div>

            <hr style="border: 1px solid #ddd; margin: 20px 0;" />

            <h4 style="color: black; font-weight: bold;">Key Responsibilities:</h4>
            <ul id="jobSummary" style="color: black; padding-left: 20px;">
              <li>Loading summary...</li>
            </ul>



        </div>

        <div id="linkedinContent" style="padding: 10px; display: none;">
                <div id="warningMessage" style="
                  margin: 20px auto;
                  padding: 12px 20px;
                  max-width: 80%;
                  background-color: #ffe6e6;
                  color: #cc0000;
                  border: 1px solid #cc0000;
                  border-radius: 8px;
                  font-weight: 600;
                  text-align: center;
                  font-size: 16px;
                  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                ">
                  You need to be on your LinkedIn profile to access this feature
                </div>


                        </div>

        <!-- Footer Section (Fixed) -->
        <div id="footer" style="position: fixed; bottom: 0; width: 100%; padding: 0 0; background-color: white; border-top: 2px solid black; z-index: 99999; display: flex; align-items: center;">
          <button id="saveButton" style="padding: 10px 20px; margin: 15px; margin-left: 50px; background-color: #3f6afd; color: white; border: none; border-radius: 20px;">Save</button>
          <button id="reviewButton" style="padding: 10px 20px; margin: 15px; background-color: #f4f4f4; color: black; border: none; border-radius: 20px;">Review</button>
          <button id="applyButton" style="padding: 10px 20px; margin: 15px; background-color: #f4f4f4; color: black; border: none; border-radius: 20px;">Apply</button>
        </div>
      </div>
    `;



    document.body.appendChild(container);

   const stars = document.querySelectorAll('#starRating .star');

   // Default rating
   let rating = 3;
   window.selectedStarRating = rating;

   // Set initial star appearance
   stars.forEach(s => {
     if (parseInt(s.getAttribute('data-value')) <= rating) {
       s.textContent = '★';
     } else {
       s.textContent = '☆';
     }
   });

   // Add click listeners
   stars.forEach(star => {
     star.addEventListener('click', () => {
       rating = parseInt(star.getAttribute('data-value'));

       stars.forEach(s => {
         if (parseInt(s.getAttribute('data-value')) <= rating) {
           s.textContent = '★';
         } else {
           s.textContent = '☆';
         }
       });

       window.selectedStarRating = rating;
       console.log('User selected rating:', rating);
     });
   });



    document.getElementById('reviewButton').addEventListener('mouseover', (event) => {
        showTooltip(event, "🚀 Review Coming Soon!");
    });

    document.getElementById('reviewButton').addEventListener('mousemove', (event) => {
        showTooltip(event, "🚀 Review Coming Soon!");
    });

    document.getElementById('reviewButton').addEventListener('mouseout', () => {
        removeTooltip();
    });

    document.getElementById('reviewButton').addEventListener('click', (event) => {
        event.preventDefault();
        alert("🚀 Review Feature Coming Soon!");
    });

    document.getElementById('applyButton').addEventListener('mouseover', (event) => {
        showTooltip(event, "🚀 Apply Coming Soon!");
    });

    document.getElementById('applyButton').addEventListener('mousemove', (event) => {
        showTooltip(event, "🚀 Apply Coming Soon!");
    });

    document.getElementById('applyButton').addEventListener('mouseout', () => {
        removeTooltip();
    });

    document.getElementById('applyButton').addEventListener('click', (event) => {
        event.preventDefault();
        alert("🚀 Apply Feature Coming Soon!");
    });

    document.getElementById('closeButton').addEventListener('click', () => {
          const container = document.getElementById('jobContainer');
          if (container) {
            document.body.removeChild(container);
          }
          const button = document.getElementById('jobButton');
          if (button) {
            button.style.display = 'block';
          }
        });

        document.querySelectorAll('.section-title').forEach(title => {
            title.addEventListener('click', () => {
                const sectionId = title.getAttribute('data-target');
                const section = document.getElementById(sectionId);
                if (section) {
                    section.style.display = section.style.display === 'block' ? 'none' : 'block';
                    title.classList.toggle('collapsed');
                }
            });
        });




    const tabs = document.querySelectorAll('#highLevelTab, #linkedinTab');
        const warningMessage = document.getElementById('warningMessage');
        const currentURL = window.location.href.toLowerCase(); // Get the full URL in lowercase

        tabs.forEach(tab => {
                  tab.addEventListener('mouseover', () => {
                    tab.style.backgroundColor = '#e0e0e0';
                    if (tab.classList.contains('active')) {
                      tab.style.backgroundColor = '#3f6afd';
                    }
                  }); // <-- Closing parenthesis and curly brace correctly placed


          tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabs.forEach(t => {
              t.style.backgroundColor = t.classList.contains('active') ? '#3f6afd' : '#f4f4f4';
              t.style.color = t.classList.contains('active') ? 'white' : 'black';
            });


              if (tab.id === 'linkedinTab') {
                showWarning("Try this feature on YOUR linkedin profile for the best results!");
              } else {
                showContent(tab.id);
              }

          });
        });

        // Function to show tab content
            function showForm(tabId) {
              // console.log("lets show form");
              document.getElementById("jobDetailsForm").style.display = "block";
              document.getElementById("alignment").style.display = "none";
              document.getElementById("hardSkills").style.display = "none";
              document.getElementById("softSkills").style.display = "none";
              document.getElementById("jobSummary").style.display = "none";
              document.getElementById("companyName").style.display = "none";
              document.getElementById("salary").style.display = "none";
              // Select all h4 elements inside the specific structure and hide them
              document.querySelectorAll("#highLevelContent > div:nth-child(2) > div:nth-child(1) > h4")
                  .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(4) > div:nth-child(1) > h4")
                            .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > h4")
                                          .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(2) > div:nth-child(1) > h4")
                                                        .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(2) > div:nth-child(2) > div")
                                                                  .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > div:nth-child(4) > div:nth-child(3) > h4")
                                                                  .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > hr:nth-child(5)")
                                                                            .forEach(el => el.style.display = "none");
              document.querySelectorAll("#highLevelContent > hr:nth-child(3)")
                                                                            .forEach(el => el.style.display = "none");
              document.getElementById('highLevelContent').style.display = tabId === 'highLevelTab' ? 'block' : 'none';

              // Hide warning message
              warningMessage.style.display = 'none';
              warningMessage.innerText = "";

              // Hide Skills title
              const skillsTitle = document.querySelector("#highLevelContent > div:nth-of-type(3) > div:nth-of-type(1) > h4");
              if (skillsTitle) skillsTitle.style.display = "none";

              // Hide Skills list
              const skillsList = document.getElementById("hardSkills");
              if (skillsList) skillsList.style.display = "none";

              // Hide Technical Skills title
              const technicalSkillsTitle = document.querySelector("#highLevelContent > div:nth-of-type(3) > div:nth-of-type(2) > h4");
              if (technicalSkillsTitle) technicalSkillsTitle.style.display = "none";

              // Hide Technical Skills list
              const technicalSkillsList = document.getElementById("softSkills");
              if (technicalSkillsList) technicalSkillsList.style.display = "none";

              // 2. Hide the "Loading summary..." list
                            const keywordsList = document.getElementById("keywords");
                            if (keywordsList) keywordsList.style.display = "none";

                            // 2. Hide the "Loading summary..." list
                                          const rate = document.getElementById("starRating");
                                          if (rate) rate.style.display = "none";

                            const hrs = document.querySelectorAll("#highLevelContent > hr");
                            hrs.forEach(hr => hr.style.display = "none");
                            document.getElementById("jobTitle").textContent = 'Enter job manually';


            }

        // Function to show tab content
        function showContent(tabId) {
          document.getElementById('highLevelContent').style.display = tabId === 'highLevelTab' ? 'block' : 'none';

          // Hide warning message
          warningMessage.style.display = 'none';
          warningMessage.innerText = "";
        }

        // Function to show a warning message
        function showWarning(message) {
          warningMessage.innerText = message;
          warningMessage.style.display = 'block';

          // Hide all tab content
          document.getElementById('highLevelContent').style.display = 'none';
        }

      document.getElementById('highLevelTab').click();
      let jobElement, jobText;
      let datafrombubble;

      async function main() {
         jobElement = await waitForElement('div[data-automation="jobAdDetails"]', 5000);
                       // console.log("Element found:", jobElement.innerText);

                       // Now assign jobElement to jobText
                       jobText = jobElement ? jobElement.innerText : "Try again";
                       // console.log("Extracted Job Details:", jobText);
         // console.log("in main");
          datafrombubble = await sendJobDetailsToBubble(jobTitle, companyName, jobText);
          console.log("Job Data from Bubble:", datafrombubble);
          // console.log("main done");

          // console.log("time to parse data from bubble for indeed", datafrombubble);
                const datajson = JSON.stringify(datafrombubble);
                const summary = JSON.parse(datajson);
                // console.log("summary: ", summary);
                // console.log(typeof datafrombubble);
                // console.log(typeof datajson);
                // console.log(typeof summary);
                // console.log("Available keys in summary:", Object.keys(summary));

                // Parse the job_data field if it's a string
                if (typeof summary["job_data"] === "string") {
                  try {
                    summary["job_data"] = JSON.parse(summary["job_data"]); // Convert to an object
                  } catch (error) {
                    // console.error("Error parsing job_data JSON:", error);
                  }
                }

                // console.log("Value of summary['Salary']:", summary["Salary"]);
                // console.log("Value of summary['Salary']:", summary["job_data"]?.["Salary"]);

                if (datafrombubble) {
                  // console.log("will display data from bubble now:");
                  const jobDetails = document.querySelector('#highLevelContent');
                  jobDetails.style.display = 'block';


                  const salaryMatch = summary["job_data"]?.["Salary"] || "Not provided";
                  const alignment = summary["job_data"]?.["alignment_with_user_profile"] || "Not provided";
                  const score = summary["job_data"]?.["job_match_score"] || "Not provided";

                  // console.log(salaryMatch);


                  if (salaryMatch) {
                    document.getElementById('salary').innerText = salaryMatch;
                    if (salaryMatch == "Not provided") {
                         document.getElementById('salary').innerText = '';
                    }
                  }
                  if (alignment) {
                    document.getElementById('alignment').innerText = alignment;
                  }

                  if (score) {
                    // console.log(typeof score, score);
                    // console.log(score.replace('%', ''));
                    let numericScore = parseInt(score.replace('%', ''));
                    // console.log(typeof numericScore, numericScore);

                    // Update the ring graph
                    const ringGraph = document.querySelector('.ring-graph');
                    ringGraph.style.setProperty('--percent', numericScore);
                    document.getElementById('scoreText').textContent = score;
                  }

                  if (summary["job_data"]?.["skills"]) {
                    const skillsList = summary["job_data"]?.["skills"]
                      .map(skill => `<li>${skill}</li>`)
                      .join('');
                    document.getElementById('hardSkills').innerHTML = skillsList;
                  }

                  if (summary["job_data"]?.["technical_skills"]) {
                            const skillsList = summary["job_data"]?.["technical_skills"]
                              .map(skill => `<li>${skill}</li>`)
                              .join('');
                            document.getElementById('softSkills').innerHTML = skillsList;
                          }

                  if (summary["job_data"]?.["top_responsibilities"]) {
                    const responsibilitiesList = summary["job_data"]?.["top_responsibilities"]
                      .map(task => `<li>${task}</li>`)
                      .join('');
                    document.getElementById('jobSummary').innerHTML = responsibilitiesList;
                  }

                  if (summary["job_data"]?.["keywords"]) {
                                                        const responsibilitiesList = summary["job_data"]?.["keywords"]
                                                          .map(task => `<li>${task}</li>`)
                                                          .join('');
                                                        document.getElementById('keywords').innerHTML = responsibilitiesList;
                                                      }

                }
      }

      // Call the function
      main();

      document.getElementById('saveButton').addEventListener('click', () => {
                  // console.log("pressed save button");

                  const highLevelTab = document.getElementById('highLevelTab');
                  // console.log(highLevelTab);

                 if (highLevelTab && highLevelTab.classList.contains('active')) {
                      // console.log("✅ Save button clicked on High-Level Tab");

                      // Extract job details
                      const jobTitle = document.getElementById('jobTitle')?.innerText.trim() || "N/A";
                      const companyName = document.getElementById('companyName')?.innerText.trim() || "N/A";
                      const location = document.getElementById('location')?.innerText.trim() || "N/A";
                      const salary = document.getElementById('salary')?.innerText.trim() || "N/A";
                      const alignment = document.getElementById('alignment')?.innerText.trim() || "N/A";
                      const jobMatchScore = document.getElementById('scoreText')?.innerText.trim() || "N/A";
                      const form1 = document.getElementById('jobTitleInput')?.value.trim() || "N/A";
                                          const form2 = document.getElementById('companyNameInput')?.value.trim() || "N/A";
                                          const form3 = document.getElementById('locationInput')?.value.trim() || "N/A";
                                          const form4 = document.getElementById('descriptionInput')?.value.trim() || "N/A";

                      // Extract skills
                      const hardSkills = [...document.getElementById('hardSkills')?.querySelectorAll('li') || []]
                          .map(li => li.innerText.trim()).join(', ') || "N/A";

                      // Extract technical_skills
                      const softSkills = [...document.getElementById('softSkills')?.querySelectorAll('li') || []]
                          .map(li => li.innerText.trim()).join(', ') || "N/A";

                      // Extract Key Responsibilities
                      const keyResponsibilities = [...document.getElementById('jobSummary')?.querySelectorAll('li') || []]
                          .map(li => li.innerText.trim()).join('\n- ') || "N/A";

                      // Construct a formatted string with extracted information
                      const jobDetailsString = `
                          Job Title: ${jobTitle}
                          Company: ${companyName}
                          Location: ${location}
                          Salary: ${salary}
                          Alignment: ${alignment}
                          job_match_score: ${jobMatchScore}

                          skills: ${hardSkills}
                          technical_skills: ${softSkills}

                          Key Responsibilities:
                          - ${keyResponsibilities}

                          ${form1} ${form2} ${form3} ${form4}
                      `;

                      // console.log("🚀 Sending extracted High-Level Job Details to Bubble.io:", jobDetailsString + jobText);

                      async function saveJobDetails() {
                          try {
                              // Send extracted details to Bubble API
                              const result = await sendSaveJobDetailsToBubble(jobDetailsString + savedata, window.selectedStarRating, jobTitle, companyName);
                              console.log(result);

                              // Check the outcome
                              if (result?.outcome === "Pass") {
                                  document.getElementById("saveButton").innerText = "Saved";
                                  // console.log(document.getElementById("saveButton").innerText);
                                  // console.log("Job details saved successfully!");
                                  const messageerror = document.getElementById('warningMessage');
                                                                  messageerror.style.display = 'none';
                              } else {
                                  // console.log("Job details saving failed.");
                                  const messageerror = document.getElementById('warningMessage');
                                                                  messageerror.innerText = "Error: Please try saving again!";
                                                                  messageerror.style.display = 'block';
                              }
                          } catch (error) {
                              // console.error("Error saving job details:", error);
                          }
                      }

                      // Call the function when needed
                      saveJobDetails();

                  }
              });

      // Function to wait for an element to appear
                  async function waitForElement(selector, timeout = 5000) {
                      return new Promise((resolve, reject) => {
                          const intervalTime = 100; // Check every 100ms
                          let elapsedTime = 0;

                          const interval = setInterval(() => {
                              let element = document.querySelector(selector);
                              if (element) {
                                  clearInterval(interval);
                                  // console.log(`✅ Found element: ${selector}`);
                                  resolve(element);
                              }

                              elapsedTime += intervalTime;
                              if (elapsedTime >= timeout) {
                                  clearInterval(interval);
                                  // console.error(`⏳ Timeout: Element '${selector}' not found`);
                                  reject(new Error(`Timeout: Element '${selector}' not found`));
                              }
                          }, intervalTime);
                      });
                  }

                  // Main function to extract job details
                  async function extractJobDetails() {
                      try {
                          // console.log("🔎 Waiting for job details to load...");

                          // Wait for and assign global variables
                          jobTitleElement = await waitForElement('h1[data-automation="job-detail-title"]', 5000);

                          // Extract text or image URL
                          jobTitle = jobTitleElement ? jobTitleElement.innerText.trim() : "";

                          // Debugging logs
                          // console.log("📌 Job Title:", jobTitle);
                          // console.log("🏢 Company Name:", companyName);
                          // console.log("📍 Job Location:", jobLocation);
                          // console.log("🖼️ Company Logo URL:", companyLogoUrl);
                      } catch (error) {
                          // console.error("❌ Error extracting job details:", error.message);
                      }
                  }

          await extractJobDetails();
          companyElement = document.querySelector('span[data-automation="advertiser-name"]');
           jobLocationElement = document.querySelector('span[data-automation="job-detail-location"]');
          companyLogoElement = document.querySelector('div[data-testid="bx-logo-image"] img');
         companyName = companyElement ? companyElement.innerText.trim() : "";
         jobLocation = jobLocationElement ? jobLocationElement.innerText.trim() : "";
           companyLogoUrl = companyLogoElement ? companyLogoElement.src : `chrome-extension://${chrome.runtime.id}/empty.png`;
         document.getElementById('jobTitle').innerText = jobTitle;
                       document.getElementById('companyName').innerText = companyName;
                       document.getElementById('location').innerText = jobLocation;
                       document.getElementById('companyLogo').src = companyLogoUrl;


    let buttons = document.querySelectorAll('#reviewButton, #applyButton');

    buttons.forEach(button => {
      button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#f4f4f4'; // Darker shade of blue
      });

      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#f4f4f4'; // Original color
      });
    });

     buttons = document.querySelectorAll('#saveButton');

        buttons.forEach(button => {
          button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#30A1FB'; // Darker shade of blue
          });

          button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#3f6afd'; // Original color
          });
        });

  });

  document.body.appendChild(button);

let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      // console.log('URL changed, resetting UI.');
      const container = document.getElementById('jobContainer');
      if(container) {
       document.body.removeChild(container);
      }
      const jobButton = document.getElementById('jobButton');
      if (jobButton) jobButton.click();
      currentUrl = window.location.href;
    }
  }, 500);
}

window.onload = async () => {
  const currentpage = window.location.href.toLowerCase();
  if (currentpage.includes("linkedin")) {
    await displayJobInfoLinkedin();
  } else if (currentpage.includes("indeed")) {
    await displayJobInfoIndeed();
  } else if (currentpage.includes("seek")) {
    await displayJobInfoSeek();
  }
};