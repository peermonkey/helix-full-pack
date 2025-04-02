// Config
const REFRESH_INTERVAL = 1000; // 10 seconds
const TRADES_LIMIT = 50; // Number of trades to fetch
const MAX_CHART_POINTS = 100; // Maximum number of points on the chart

// Global variables
let btcChart = null;
let ethChart = null;
let btcPriceHistory = [];
let ethPriceHistory = [];
let btcRefreshTimer = null;
let ethRefreshTimer = null;
let lastBtcPrice = null;
let lastEthPrice = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Real-time Price Viewer initialized');
  
  // Initialize charts
  initChart('btc-chart', btcPriceHistory).then(chart => {
    btcChart = chart;
  });
  
  initChart('eth-chart', ethPriceHistory).then(chart => {
    ethChart = chart;
  });
  
  // Set up event listeners
  document.getElementById('btc-refresh').addEventListener('click', () => fetchPriceData('btc'));
  document.getElementById('eth-refresh').addEventListener('click', () => fetchPriceData('eth'));
  
  document.getElementById('btc-auto-refresh').addEventListener('change', event => {
    toggleAutoRefresh('btc', event.target.checked);
  });
  
  document.getElementById('eth-auto-refresh').addEventListener('change', event => {
    toggleAutoRefresh('eth', event.target.checked);
  });
  
  // Initial data fetch
  fetchPriceData('btc');
  fetchPriceData('eth');
  
  // Start auto-refresh
  toggleAutoRefresh('btc', true);
  toggleAutoRefresh('eth', true);
});

// Initialize the price chart
async function initChart(canvasId, priceHistory) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  // Generate empty data if none exists
  if (priceHistory.length === 0) {
    const now = Date.now();
    for (let i = 0; i < MAX_CHART_POINTS; i++) {
      priceHistory.push({
        time: new Date(now - (MAX_CHART_POINTS - i) * 1000),
        price: null
      });
    }
  }
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: priceHistory.map(item => formatTime(item.time)),
      datasets: [{
        label: 'Price (USD)',
        data: priceHistory.map(item => item.price),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 10,
        tension: 0.2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `$${parseFloat(context.raw).toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      },
      animation: {
        duration: 500
      }
    }
  });
  
  return chart;
}

// Toggle auto-refresh for a specific coin
function toggleAutoRefresh(coin, enabled) {
  const timerRef = coin === 'btc' ? 'btcRefreshTimer' : 'ethRefreshTimer';
  
  // Clear existing timer
  if (window[timerRef]) {
    clearInterval(window[timerRef]);
    window[timerRef] = null;
  }
  
  // Set new timer if enabled
  if (enabled) {
    window[timerRef] = setInterval(() => fetchPriceData(coin), REFRESH_INTERVAL);
  }
}

// Fetch cryptocurrency price data from the API
async function fetchPriceData(coin) {
  console.log(`Fetching ${coin} price data...`);
  
  try {
    // Fetch data from our API
    const response = await fetch(`/api/prices/${coin}?limit=${TRADES_LIMIT}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    console.log(`Received ${data.prices.length} trades for ${coin}`);
    
    // Update the UI
    updatePriceDisplay(coin, data);
    updateTradesTable(coin, data.prices);
    updatePriceChart(coin, data.prices);
    updateLastFetchedTime(coin, data.fetchedAt);
    
  } catch (error) {
    console.error(`Error fetching ${coin} price data:`, error);
    document.getElementById(`${coin}-trades-container`).innerHTML = `
      <div class="error">
        <strong>Error:</strong> ${error.message || 'Failed to fetch price data'}
      </div>
    `;
  }
}

// Update the price display
function updatePriceDisplay(coin, data) {
  const priceElement = document.getElementById(`${coin}-price`);
  const changeElement = document.getElementById(`${coin}-change`);
  
  if (!priceElement || !changeElement) return;
  
  const currentPrice = parseFloat(data.latestPrice);
  
  // Format and display the current price
  priceElement.textContent = `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Get the last price for comparison
  const lastPrice = coin === 'btc' ? lastBtcPrice : lastEthPrice;
  
  // Update the stored last price
  if (coin === 'btc') {
    lastBtcPrice = currentPrice;
  } else {
    lastEthPrice = currentPrice;
  }
  
  // If there's a previous price, show the change
  if (lastPrice) {
    const change = currentPrice - lastPrice;
    const changePercent = (change / lastPrice) * 100;
    
    // Use font color to indicate price direction
    const direction = change >= 0 ? 'up' : 'down';
    const sign = change >= 0 ? '+' : '';
    
    changeElement.className = `price-change price-${direction}`;
    changeElement.textContent = `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  }
}

// Update the trades table
function updateTradesTable(coin, trades) {
  const containerElement = document.getElementById(`${coin}-trades-container`);
  
  if (!containerElement) return;
  
  if (trades.length === 0) {
    containerElement.innerHTML = '<p>No recent trades found.</p>';
    return;
  }
  
  let tableHtml = `
    <table class="trades-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Type</th>
          <th>Trade ID</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  // Add table rows
  trades.slice(0, 10).forEach(trade => {
    const tradeTime = new Date(trade.time);
    const tradeType = trade.isBuyerMaker ? 'Sell' : 'Buy';
    const typeClass = trade.isBuyerMaker ? 'sell' : 'buy';
    
    tableHtml += `
      <tr>
        <td>${tradeTime.toLocaleString()}</td>
        <td>$${parseFloat(trade.price).toFixed(2)}</td>
        <td>${parseFloat(trade.quantity).toFixed(6)}</td>
        <td class="${typeClass}">${tradeType}</td>
        <td>${trade.tradeId}</td>
      </tr>
    `;
  });
  
  tableHtml += `
      </tbody>
    </table>
  `;
  
  containerElement.innerHTML = tableHtml;
}

// Update the price chart
function updatePriceChart(coin, trades) {
  const chart = coin === 'btc' ? btcChart : ethChart;
  const priceHistory = coin === 'btc' ? btcPriceHistory : ethPriceHistory;
  
  if (!chart) return;
  
  // Process trades to get time and price data
  const priceData = trades.map(trade => ({
    time: new Date(trade.time),
    price: parseFloat(trade.price)
  })).sort((a, b) => a.time - b.time);
  
  // Update price history
  if (priceData.length > 0) {
    // Add new data points
    for (const point of priceData) {
      priceHistory.push(point);
    }
    
    // Keep only the last MAX_CHART_POINTS items
    while (priceHistory.length > MAX_CHART_POINTS) {
      priceHistory.shift();
    }
    
    // Update chart data
    chart.data.labels = priceHistory.map(item => formatTime(item.time));
    chart.data.datasets[0].data = priceHistory.map(item => item.price);
    
    // Update the chart
    chart.update();
  }
}

// Update the last fetched time display
function updateLastFetchedTime(coin, fetchedAt) {
  const updateTimeElement = document.getElementById(`${coin}-update-time`);
  
  if (!updateTimeElement) return;
  
  const fetchTime = new Date(fetchedAt);
  updateTimeElement.textContent = `Last updated: ${fetchTime.toLocaleString()}`;
}

// Format time for display
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
} 