function calculateAndDisplayCost() {
  console.log('Meeting Cost Calculator: Content script loaded and running.');

  chrome.storage.sync.get(['costPerAttendee'], (result) => {
    const costPerAttendee = result.costPerAttendee || 72.12; // Default hourly rate
    console.log('Cost per attendee:', costPerAttendee);

    // Wait for Google Calendar to fully load the event details
    setTimeout(() => {
      try {
        // Find the meeting duration
        const timeElements = document.querySelectorAll('[data-text-as-pseudo-element]');
        let durationHours = 1; // Default to 1 hour if we can't find duration
        
        timeElements.forEach(element => {
          const timeText = element.getAttribute('data-text-as-pseudo-element');
          if (timeText && timeText.includes('am') && timeText.includes('pm')) {
            // Try to extract duration from time text (e.g., "11:00am - 12:00pm")
            const times = timeText.match(/(\d+):(\d+)([ap]m)\s*-\s*(\d+):(\d+)([ap]m)/i);
            if (times) {
              const startHour = parseInt(times[1]);
              const startMinute = parseInt(times[2]);
              const startPeriod = times[3].toLowerCase();
              
              const endHour = parseInt(times[4]);
              const endMinute = parseInt(times[5]);
              const endPeriod = times[6].toLowerCase();
              
              // Convert to 24-hour format
              let start = startHour;
              if (startPeriod === 'pm' && startHour !== 12) start += 12;
              if (startPeriod === 'am' && startHour === 12) start = 0;
              
              let end = endHour;
              if (endPeriod === 'pm' && endHour !== 12) end += 12;
              if (endPeriod === 'am' && endHour === 12) end = 0;
              
              // Calculate duration in hours
              durationHours = (end - start) + (endMinute - startMinute) / 60;
              if (durationHours < 0) durationHours += 24; // Handle next day events
              
              console.log('Meeting duration (hours):', durationHours);
            }
          }
        });
        
        // Find the number of attendees
        // Look for elements that are likely to contain attendee information
        const attendeeSection = document.querySelector('[aria-label="Guests invited to this event"]');
        let attendeeCount = 0;
        
        if (attendeeSection) {
          // Try to count the guests by looking at the guest list
          const guests = attendeeSection.querySelectorAll('[role="listitem"]');
          attendeeCount = guests.length;
        } else {
          // Fallback: try to find elements with "Going" or similar text
          const guestIndicators = document.querySelectorAll('[data-guest-id]');
          attendeeCount = guestIndicators.length;
        }
        
        // If we still can't find attendees, look for other indicators
        if (attendeeCount === 0) {
          // Try to find "Add guests" button which indicates there are no guests yet
          const addGuestsButton = document.querySelector('[aria-label="Add guests"]');
          if (!addGuestsButton) {
            // If there's no "Add guests" button but we're in an event, assume at least 1 attendee (the owner)
            attendeeCount = 1;
          }
        }
        
        console.log('Number of attendees:', attendeeCount);

        // Calculate the total cost
        const totalCost = attendeeCount * costPerAttendee * durationHours;
        console.log('Calculated total cost:', totalCost);

        // Find or create container to display the cost
        // Look for elements that are near the bottom of event details
        const meetingOptions = document.querySelector('[role="button"][aria-label="Join with Google Meet"]');
        if (meetingOptions) {
          // Check if our cost display already exists
          const existingCost = document.getElementById('meeting-cost-display');
          if (existingCost) {
            existingCost.remove(); // Remove existing to prevent duplicates
          }
          
          // Create container for our cost display
          const costContainer = document.createElement('div');
          costContainer.id = 'meeting-cost-display';
          costContainer.style.display = 'flex';
          costContainer.style.alignItems = 'center';
          costContainer.style.margin = '10px 0';
          costContainer.style.padding = '8px 0';
          
          // Create cost display element
          const costElement = document.createElement('div');
          costElement.textContent = `$${totalCost.toFixed(2)} cost of meeting`;
          costElement.style.color = '#DB4437'; // Google red color
          costElement.style.fontWeight = 'bold';
          costElement.style.marginRight = '10px';
          
          // Create "Send an Email Instead" button
          const buttonElement = document.createElement('button');
          buttonElement.textContent = 'Send an Email Instead';
          buttonElement.style.backgroundColor = '#1A73E8'; // Google blue
          buttonElement.style.color = 'white';
          buttonElement.style.border = 'none';
          buttonElement.style.borderRadius = '4px';
          buttonElement.style.padding = '8px 12px';
          buttonElement.style.cursor = 'pointer';
          buttonElement.style.fontSize = '14px';
          
          buttonElement.addEventListener('click', () => {
            // Get the event title and attendees for the email
            const titleElement = document.querySelector('[aria-label="Title"]');
            const title = titleElement ? titleElement.textContent : 'Meeting';
            
            // Compose a mailto URL
            let emailAddresses = [];
            const guests = document.querySelectorAll('[data-guest-id]');
            guests.forEach(guest => {
              const email = guest.getAttribute('data-guest-id');
              if (email) emailAddresses.push(email);
            });
            
            const subject = encodeURIComponent(`${title} - Email Discussion Instead of Meeting`);
            const body = encodeURIComponent(`Hi team,\n\nInstead of having a meeting, let's discuss this via email to save time and resources.\n\nThanks!`);
            
            window.open(`mailto:${emailAddresses.join(',')}?subject=${subject}&body=${body}`);
          });
          
          // Add elements to the container
          costContainer.appendChild(costElement);
          costContainer.appendChild(buttonElement);
          
          // Find the right place to insert our container
          const parentElement = meetingOptions.closest('div[role="presentation"]');
          if (parentElement) {
            parentElement.insertAdjacentElement('afterend', costContainer);
            console.log('Successfully added cost display and button.');
          } else {
            // Fallback: insert after the Meet button
            meetingOptions.insertAdjacentElement('afterend', costContainer);
            console.log('Inserted cost display as fallback position.');
          }
        } else {
          console.log('Could not find Google Meet join button.');
        }
      } catch (error) {
        console.error('Error calculating and displaying meeting cost:', error);
      }
    }, 1000); // Wait 1 second for the page to load
  });
}

// Run when the page loads
calculateAndDisplayCost();

// Set up observer to detect changes in the DOM
const observer = new MutationObserver(() => {
  // Check if we're on a calendar event page
  const isCalendarEvent = window.location.href.includes('calendar.google.com') && 
                          (window.location.href.includes('/eventedit') || 
                           window.location.href.includes('/event'));
  
  if (isCalendarEvent) {
    calculateAndDisplayCost();
  }
});

// Start observing changes to the DOM
observer.observe(document.body, { 
  childList: true, 
  subtree: true 
});

// Also recalculate when URL changes (for single page apps like Google Calendar)
let lastUrl = window.location.href;
setInterval(() => {
  if (lastUrl !== window.location.href) {
    lastUrl = window.location.href;
    calculateAndDisplayCost();
  }
}, 1000);
