document.addEventListener('DOMContentLoaded', () => {
  const costInput = document.getElementById('cost');
  const saveButton = document.getElementById('save');
  const successMessage = document.getElementById('success');

  // Load saved cost value from storage
  chrome.storage.sync.get(['costPerAttendee'], (result) => {
    const costPerAttendee = result.costPerAttendee || 72.12; // Default hourly rate if not set
    costInput.value = costPerAttendee;
  });

  // Save button click handler
  saveButton.addEventListener('click', () => {
    const cost = parseFloat(costInput.value);
    
    // Validate the input
    if (isNaN(cost) || cost < 0) {
      alert('Please enter a valid cost (must be a positive number).');
      return;
    }
    
    // Save to Chrome storage
    chrome.storage.sync.set({ costPerAttendee: cost }, () => {
      // Show success message
      successMessage.style.display = 'block';
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 2000);
      
      // Try to update any open calendar tabs
      updateOpenCalendarTabs();
    });
  });
  
  // Update any open calendar tabs with the new cost
  function updateOpenCalendarTabs() {
    chrome.tabs.query({ url: '*://calendar.google.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'updateCost' })
          .catch(error => console.log('Could not update tab:', error));
      });
    });
  }
});
