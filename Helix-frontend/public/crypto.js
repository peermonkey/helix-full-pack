// Global variables
let priceChart = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Crypto Data Viewer initialized');
  
  // Set up event listeners
  const fetchButton = document.getElementById('fetch-data-btn');
  if (fetchButton) {
    fetchButton.addEventListener('click', fetchCryptoData);
  }
  
  // Initialize the chart with empty data
  initChart();
});

// Initialize the price chart
function initChart() {
  const ctx = document.getElementById('price-chart').getContext('2d');
  
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Price',
        data: [],
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#3498db',
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Price Chart',
          font: {
            size: 16
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: $${parseFloat(context.raw).toFixed(2)}`;
            }
          }
        },
        legend: {
          position: 'top',
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          grid: {
            borderDash: [2, 2]
          },
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      }
    }
  });
}

// Fetch cryptocurrency data from the API
async function fetchCryptoData() {
  // Get values from the form
  const coin = document.getElementById('coin-select').value;
  const timeframe = document.getElementById('timeframe-select').value;
  const limit = document.getElementById('limit-select').value;
  
  console.log(`Fetching data for ${coin} with timeframe ${timeframe}, limit: ${limit}`);
  
  // Show loading state
  const dataContainer = document.getElementById('data-container');
  dataContainer.innerHTML = '<div class="loading">Loading cryptocurrency data...</div>';
  
  try {
    // Fetch data from our API
    const response = await fetch(`/api/crypto/${coin}/${timeframe}?limit=${limit}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    console.log(`Received ${data.length} records`);
    
    // Sort data by openTime (ascending) for proper display
    data.sort((a, b) => a.openTime - b.openTime);
    
    // Update the chart
    updateChart(data, coin, timeframe);
    
    // Display the data table
    displayDataTable(data, coin);
    
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    dataContainer.innerHTML = `
      <div class="error">
        <strong>Error:</strong> ${error.message || 'Failed to fetch cryptocurrency data'}
      </div>
    `;
  }
}

// Update the price chart with new data
function updateChart(data, coin, timeframe) {
  const labels = data.map(item => {
    const date = new Date(parseInt(item.openTime));
    return formatDateByTimeframe(date, timeframe);
  });
  
  const prices = data.map(item => parseFloat(item.close));
  
  // Update chart data
  priceChart.data.labels = labels;
  priceChart.data.datasets[0].data = prices;
  
  // Update chart title
  const coinName = coin.toUpperCase();
  priceChart.options.plugins.title.text = `${coinName} Price (${timeframe})`;
  
  // Update the chart
  priceChart.update();
}

// Display data in a table format
function displayDataTable(data, coin) {
  const dataContainer = document.getElementById('data-container');
  const coinUpper = coin.toUpperCase();
  
  let tableHtml = `
    <h2>${coinUpper} Data</h2>
    <div style="overflow-x: auto;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>Open</th>
            <th>High</th>
            <th>Low</th>
            <th>Close</th>
            <th>Volume</th>
            <th>Trades</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Add each data row
  data.forEach(item => {
    const openTime = new Date(parseInt(item.openTime));
    const formattedDate = openTime.toLocaleString();
    
    // Determine if price went up or down
    const openPrice = parseFloat(item.open);
    const closePrice = parseFloat(item.close);
    const priceClass = closePrice >= openPrice ? 'price-up' : 'price-down';
    
    tableHtml += `
      <tr>
        <td>${formattedDate}</td>
        <td>$${parseFloat(item.open).toFixed(2)}</td>
        <td>$${parseFloat(item.high).toFixed(2)}</td>
        <td>$${parseFloat(item.low).toFixed(2)}</td>
        <td class="${priceClass}">$${parseFloat(item.close).toFixed(2)}</td>
        <td>${parseFloat(item.volume).toFixed(4)}</td>
        <td>${item.trades}</td>
      </tr>
    `;
  });
  
  tableHtml += `
        </tbody>
      </table>
    </div>
  `;
  
  dataContainer.innerHTML = tableHtml;
}

// Format date based on timeframe
function formatDateByTimeframe(date, timeframe) {
  const options = { hour: '2-digit', minute: '2-digit' };
  
  // For timeframes of 1d or longer, show date without time
  if (['1d', '1w', '1M'].includes(timeframe)) {
    return date.toLocaleDateString();
  }
  
  // For 1h or longer, show date and time
  if (['1h', '4h', '6h', '8h', '12h'].includes(timeframe)) {
    return date.toLocaleString();
  }
  
  // For shorter timeframes, just show time
  return date.toLocaleTimeString([], options);
} 