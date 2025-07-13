document.addEventListener('DOMContentLoaded', () => {
    const totalTimeElement = document.getElementById('total-time');
    const sitesVisitedElement = document.getElementById('sites-visited');
    const viewDetailsButton = document.getElementById('view-details');
    const clearDataButton = document.getElementById('clear-data');
  
    // Load and display stats
    chrome.storage.local.get(['activityData'], (result) => {
      const activityData = result.activityData || [];
      updateStats(activityData);
    });
  
    // View details button
    viewDetailsButton.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup/details.html') });
    });
  
    // Clear data button
    clearDataButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all tracking data?')) {
        chrome.storage.local.set({ activityData: [] }, () => {
          updateStats([]);
        });
      }
    });
  
    function updateStats(activityData) {
      // Calculate total time
      const totalSeconds = activityData.reduce((sum, activity) => {
        return sum + (activity.duration || 0);
      }, 0);
      
      // Calculate unique sites visited
      const uniqueSites = new Set(
        activityData
          .filter(activity => activity.url)
          .map(activity => new URL(activity.url).hostname)
      ).size;
  
      // Format and display
      totalTimeElement.textContent = formatTime(totalSeconds);
      sitesVisitedElement.textContent = uniqueSites;
    }
  
    function formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else {
        return `${Math.floor(seconds)}s`;
      }
    }
  });
  