document.addEventListener('DOMContentLoaded', () => {
  const costInput = document.getElementById('cost');
  const saveButton = document.getElementById('save');

  if (costInput && saveButton) {
    chrome.storage.sync.get(['costPerAttendee'], (result) => {
      const costPerAttendee = result.costPerAttendee || 72.12; // Default hourly rate
      costInput.value = costPerAttendee;
    });

    saveButton.addEventListener('click', () => {
      const cost = costInput.value;
      chrome.storage.sync.set({ costPerAttendee: cost }, () => {
        alert('Cost per attendee saved!');
      });
    });
  } else {
    console.error('Failed to find cost input or save button elements.');
  }
});
