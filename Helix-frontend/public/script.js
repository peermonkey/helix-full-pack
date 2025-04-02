// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded. Initializing application...');
  
  // Initialize the application
  initApp();
  
  // Setup form submission
  const itemForm = document.getElementById('item-form');
  if (itemForm) {
    itemForm.addEventListener('submit', submitItem);
  } else {
    console.error('Item form not found in the DOM');
  }
});

// Initialize the application
function initApp() {
  console.log('Initializing application...');
  
  // Get the items container
  const container = document.getElementById('items-container');
  
  if (!container) {
    console.error('Items container not found in the DOM');
    return;
  }
  
  // Set loading message
  container.innerHTML = '<p>Loading items from MongoDB...</p>';
  
  // Fetch items
  fetchItems();
}

// Fetch all items from the API
function fetchItems() {
  console.log('Fetching items from API...');
  
  // Fetch data from our API
  fetch('/api/items')
    .then(response => {
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return response.json();
    })
    .then(items => {
      console.log('Items received:', items);
      displayItems(items);
    })
    .catch(error => {
      console.error('Error fetching items:', error);
      const container = document.getElementById('items-container');
      if (container) {
        container.innerHTML = `
          <p class="error">Failed to load items. Please try again later.</p>
          <p class="error-details">${error.message}</p>
        `;
      }
    });
}

// Display items in the DOM
function displayItems(items) {
  console.log('Displaying items. Count:', items.length);
  
  const container = document.getElementById('items-container');
  if (!container) {
    console.error('Items container not found when displaying items');
    return;
  }
  
  // Handle empty items
  if (!items || items.length === 0) {
    console.log('No items to display');
    container.innerHTML = '<p>No items found. Add some items!</p>';
    return;
  }
  
  try {
    console.log('Building items HTML');
    const itemsHTML = items.map(item => `
      <div class="item-card">
        <h3>${item.name}</h3>
        <p>${item.description || 'No description'}</p>
        <p class="price">$${item.price.toFixed(2)}</p>
        <p class="date">Added: ${new Date(item.createdAt).toLocaleDateString()}</p>
      </div>
    `).join('');
    
    console.log('Setting innerHTML');
    container.innerHTML = itemsHTML;
    console.log('Items displayed successfully');
  } catch (error) {
    console.error('Error displaying items:', error);
    container.innerHTML = `<p class="error">Error displaying items: ${error.message}</p>`;
  }
}

// Submit a new item
function submitItem(e) {
  e.preventDefault();
  
  const nameInput = document.getElementById('item-name');
  const descInput = document.getElementById('item-description');
  const priceInput = document.getElementById('item-price');
  
  if (!nameInput || !descInput || !priceInput) {
    console.error('Form inputs not found');
    return;
  }
  
  const newItem = {
    name: nameInput.value,
    description: descInput.value,
    price: parseFloat(priceInput.value)
  };
  
  console.log('Submitting new item:', newItem);
  
  fetch('/api/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newItem)
  })
  .then(response => {
    console.log('POST response status:', response.status);
    
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || `HTTP error! Status: ${response.status}`);
      });
    }
    
    return response.json();
  })
  .then(data => {
    console.log('Item created successfully:', data);
    
    // Clear form
    nameInput.value = '';
    descInput.value = '';
    priceInput.value = '';
    
    // Refresh items list
    fetchItems();
  })
  .catch(error => {
    console.error('Error adding item:', error);
    alert(`Failed to add item: ${error.message}`);
  });
} 