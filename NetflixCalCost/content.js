function calculateAndDisplayCost() {
  console.log('Content script loaded and running.');

  chrome.storage.sync.get(['costPerAttendee'], (result) => {
    const costPerAttendee = result.costPerAttendee || 72.12; // Default hourly rate
    console.log('Cost per attendee:', costPerAttendee);

    // Find the event details container
    const eventDetailsContainer = document.querySelector('.some-event-details-class'); // Adjust the selector as needed
    if (eventDetailsContainer) {
      console.log('Event details container found.');

      // Extract the number of attendees from the event details
      const attendeesElement = eventDetailsContainer.querySelector('.some-attendees-class'); // Adjust the selector as needed
      const attendees = attendeesElement ? attendeesElement.childElementCount : 0;
      console.log('Number of attendees:', attendees);

      const totalCost = attendees * costPerAttendee;

      const costElement = document.createElement('div');
      costElement.textContent = `Meeting Cost: $${totalCost.toFixed(2)}`;
      costElement.style.color = 'red';
      costElement.style.fontWeight = 'bold';

      const buttonElement = document.createElement('button');
      buttonElement.textContent = 'Send email instead';
      buttonElement.style.marginLeft = '10px';
      buttonElement.addEventListener('click', () => {
        alert('Send email instead clicked!');
      });

      const meetOptions = eventDetailsContainer.querySelector('.some-meet-options-class'); // Adjust the selector as needed
      if (meetOptions) {
        console.log('Appending cost and button elements.');
        meetOptions.appendChild(costElement);
        meetOptions.appendChild(buttonElement);
      } else {
        console.log('Meet options element not found.');
      }
    } else {
      console.log('Event details container not found.');
    }
  });
}

// Observe changes to the DOM to detect when event details are loaded
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.matches('.some-event-details-class')) { // Adjust the selector as needed
          calculateAndDisplayCost();
        }
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
