let activityData = [];
let currentTab = null;
let startTime = null;

// Load saved data from storage
chrome.storage.local.get(['activityData'], (result) => {
  if (result.activityData) {
    activityData = result.activityData;
  }
});

// Track tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateCurrentTab(activeInfo.tabId);
});

// Track URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    updateCurrentTab(tabId, changeInfo.url);
  }
});

// Track window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // No window is focused (user switched to another app)
    recordActivity(null, 'inactive');
  } else {
    chrome.tabs.query({active: true, windowId: windowId}, (tabs) => {
      if (tabs[0]) {
        updateCurrentTab(tabs[0].id);
      }
    });
  }
});

// Track idle state
chrome.idle.onStateChanged.addListener((newState) => {
  if (newState === 'idle') {
    recordActivity(null, 'idle');
  }
});

function updateCurrentTab(tabId, newUrl) {
  chrome.tabs.get(tabId, (tab) => {
    // Record previous activity
    if (currentTab && startTime) {
      recordActivity(currentTab);
    }
    
    // Start tracking new tab
    currentTab = {
      id: tab.id,
      url: newUrl || tab.url,
      title: tab.title
    };
    startTime = new Date();
  });
}

function recordActivity(tab, activityType = 'browsing') {
  if (!startTime) return;

  const endTime = new Date();
  const duration = (endTime - startTime) / 1000; // in seconds
  
  const activity = {
    type: activityType,
    url: tab?.url || null,
    title: tab?.title || null,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: duration
  };

  activityData.push(activity);
  
  // Keep only last 1000 entries to prevent excessive storage use
  if (activityData.length > 1000) {
    activityData = activityData.slice(-1000);
  }

  // Save to storage
  chrome.storage.local.set({ activityData });
  
  // Reset for next activity
  startTime = activityType === 'browsing' ? endTime : null;
}

// Save data before extension unload
chrome.runtime.onSuspend.addListener(() => {
  if (currentTab && startTime) {
    recordActivity(currentTab);
  }
});
