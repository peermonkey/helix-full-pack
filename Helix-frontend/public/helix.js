// Config
const REFRESH_INTERVAL = 1000; // 1 second refresh interval
const DATA_LIMIT = 50; // Number of data points to fetch
const MAX_CHART_POINTS = 30; // Maximum number of points on the chart
const CHART_COLORS = {
  helix: '#5D5FEF', // Primary color
  cumulative: '#3B82F6', // Info color
  btcDelta: '#F97316', // Warning color
  ethDelta: '#22C55E' // Secondary color
};

// Global variables
let helixChart = null;
let deltaChart = null;
let helixData = [];
let refreshTimer = null;
let selectedTimeframe = '1d';
let themeMode = localStorage.getItem('helixTheme') || 'light';
let isDataLoading = false;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Helix Data Viewer initialized');
  
  // Initialize charts with loading animation
  try {
    const [helixChartInstance, deltaChartInstance] = await Promise.all([
      initHelixChart(),
      initDeltaChart()
    ]);
    
    helixChart = helixChartInstance;
    deltaChart = deltaChartInstance;
    
    console.log('Charts initialized successfully');
  } catch (error) {
    console.error('Error initializing charts:', error);
    showNotification('error', 'Failed to initialize charts. Please refresh the page.');
  }
  
  // Set up event listeners with debounce
  document.getElementById('refresh-btn').addEventListener('click', debounce(() => {
    showLoading();
    fetchHelixData();
  }, 300));
  
  document.getElementById('timeframe-select').addEventListener('change', debounce((event) => {
    selectedTimeframe = event.target.value;
    showLoading();
    fetchHelixData();
  }, 300));
  
  document.getElementById('auto-refresh').addEventListener('change', event => {
    toggleAutoRefresh(event.target.checked);
  });

  document.getElementById('export-btn').addEventListener('click', debounce(exportHelixData, 300));
  
  // Initial data fetch with timeout
  try {
    showLoading();
    const initialFetchPromise = fetchHelixData();
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Initial data load timed out')), 15000)
    );
    
    await Promise.race([initialFetchPromise, timeout]);
  } catch (error) {
    console.error('Initial data fetch error:', error);
    hideLoading();
    showNotification('error', 'Could not connect to server. Please try again later.');
  }
  
  // Start auto-refresh
  toggleAutoRefresh(document.getElementById('auto-refresh').checked);
  
  // Setup global functions
  window.filterTable = debounce(filterTable, 300);
  window.changePage = changePage;
  window.sortTable = debounce(sortTable, 300);
});

// Show loading overlay
function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('active');
}

// Hide loading overlay
function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('active');
  isDataLoading = false;
}

// Show notification message
function showNotification(type, message) {
  // Remove any existing notification
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create new notification
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  let icon = '';
  switch (type) {
    case 'info': icon = '<i class="fas fa-info-circle"></i>'; break;
    case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
    case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
    case 'error': icon = '<i class="fas fa-times-circle"></i>'; break;
  }
  
  notification.innerHTML = `
    ${icon}
    <div>${message}</div>
  `;
  
  // Add to main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.insertAdjacentElement('afterbegin', notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Initialize the helix chart with async pattern
async function initHelixChart() {
  return new Promise((resolve) => {
    const ctx = document.getElementById('helix-chart').getContext('2d');
    
    // Create initial empty data
    const labels = [];
    const helixValues = [];
    const cumulativeValues = [];
    
    for (let i = 0; i < MAX_CHART_POINTS; i++) {
      labels.push('');
      helixValues.push(null);
      cumulativeValues.push(null);
    }
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Helix Value',
            data: helixValues,
            borderColor: CHART_COLORS.helix,
            backgroundColor: `${CHART_COLORS.helix}20`,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 7,
            yAxisID: 'y'
          },
          {
            label: 'Cumulative Helix',
            data: cumulativeValues,
            borderColor: CHART_COLORS.cumulative,
            backgroundColor: `${CHART_COLORS.cumulative}20`,
            borderWidth: 3,
            borderDash: [5, 5],
            tension: 0.4,
            fill: false,
            pointRadius: 3,
            pointHoverRadius: 6,
            yAxisID: 'y'
          }
        ]
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
            position: 'top',
            labels: {
              boxWidth: 15,
              padding: 15,
              font: {
                size: 13
              },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(4)}`;
              }
            },
            padding: 12,
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 13
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              padding: 8,
              font: {
                size: 12
              }
            },
            grid: {
              display: false
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Value',
              font: {
                size: 14
              },
              padding: {
                bottom: 10
              }
            },
            grid: {
              borderDash: [2, 4]
            }
          }
        },
        animation: {
          duration: 500,
          easing: 'easeOutQuart'
        }
      }
    });
    
    // Resolve the promise with the chart instance
    resolve(chart);
  });
}

// Initialize the delta comparison chart with async pattern
async function initDeltaChart() {
  return new Promise((resolve) => {
    const ctx = document.getElementById('delta-chart').getContext('2d');
    
    // Create initial empty data
    const labels = [];
    const btcDeltaValues = [];
    const ethDeltaValues = [];
    
    for (let i = 0; i < MAX_CHART_POINTS; i++) {
      labels.push('');
      btcDeltaValues.push(null);
      ethDeltaValues.push(null);
    }
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'BTC Delta %',
            data: btcDeltaValues,
            borderColor: CHART_COLORS.btcDelta,
            backgroundColor: `${CHART_COLORS.btcDelta}20`,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 7
          },
          {
            label: 'ETH Delta %',
            data: ethDeltaValues,
            borderColor: CHART_COLORS.ethDelta,
            backgroundColor: `${CHART_COLORS.ethDelta}20`,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 7
          }
        ]
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
            position: 'top',
            labels: {
              boxWidth: 15,
              padding: 15,
              font: {
                size: 13
              },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(4)}%`;
              }
            },
            padding: 12,
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 13
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            cornerRadius: 8
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'x',
            }
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              padding: 8,
              font: {
                size: 12
              }
            },
            grid: {
              display: false
            }
          },
          y: {
            type: 'linear',
            display: true,
            title: {
              display: true,
              text: 'Delta %',
              font: {
                size: 14
              },
              padding: {
                bottom: 10
              }
            },
            grid: {
              borderDash: [2, 4]
            }
          }
        },
        animation: {
          duration: 500,
          easing: 'easeOutQuart'
        }
      }
    });
    
    // Resolve the promise with the chart instance
    resolve(chart);
  });
}

// Update chart theme based on current mode
function updateChartTheme(chart) {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const fontColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  chart.options.scales.x.ticks.color = fontColor;
  chart.options.scales.y.ticks.color = fontColor;
  chart.options.scales.y.grid.color = gridColor;
  chart.options.plugins.legend.labels.color = fontColor;
  
  if (chart.options.plugins.title) {
    chart.options.plugins.title.color = fontColor;
  }
  
  chart.update();
}

// Toggle auto-refresh
function toggleAutoRefresh(enabled) {
  // Clear existing timer
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  
  // Set new timer if enabled
  if (enabled) {
    refreshTimer = setInterval(fetchHelixData, REFRESH_INTERVAL);
    document.getElementById('refresh-btn').classList.add('active');
  } else {
    document.getElementById('refresh-btn').classList.remove('active');
  }
}

// Fetch Helix data from the API using async/await
async function fetchHelixData() {
  // If already loading, don't start another fetch
  if (isDataLoading) return;
  isDataLoading = true;
  
  const timeframe = document.getElementById('timeframe-select').value;
  selectedTimeframe = timeframe;
  console.log(`Fetching Helix data for ${timeframe} timeframe...`);
  
  try {
    // Fetch data from our API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`/api/helix/${timeframe}?limit=${DATA_LIMIT}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      throw new Error(errorMessage);
    }
    
    // Parse the JSON response
    const responseData = await response.json();
    console.log(`Received ${responseData.data.length} helix data points for ${timeframe}`);
    
    // Validate response data
    if (!responseData.data || !Array.isArray(responseData.data) || responseData.data.length === 0) {
      throw new Error('No data received from server');
    }
    
    // Store the data
    helixData = responseData.data;
    
    // Sort data by time (ascending)
    helixData.sort((a, b) => new Date(a.time) - new Date(b.time));
    
    // Update the UI with animations
    await Promise.all([
      updateDashboard(responseData.latestData),
      updateHelixChart(helixData),
      updateDeltaChart(helixData),
      updateHistoricalTable(helixData),
      updatePerformanceSummary(helixData)
    ]);
    
    updateLastFetchedTime(responseData.fetchedAt);
    hideLoading();
    
  } catch (error) {
    console.error('Error fetching Helix data:', error);
    
    // Show error notification
    if (error.name === 'AbortError') {
      showNotification('error', 'Request timed out. Server may be unavailable.');
    } else {
      showNotification('error', error.message || 'Failed to fetch Helix data');
    }
    
    hideLoading();
  }
}

// Update the dashboard
async function updateDashboard(latestData) {
  if (!latestData) return;
  
  // Update helix values
  const currentHelixElement = document.getElementById('current-helix');
  const cumulativeHelixElement = document.getElementById('cumulative-helix');
  const btcDeltaElement = document.getElementById('btc-delta');
  const ethDeltaElement = document.getElementById('eth-delta');
  
  if (currentHelixElement) {
    const helixValue = latestData.helixValue;
    currentHelixElement.textContent = helixValue.toFixed(4);
    currentHelixElement.className = helixValue > 0 ? 'stat-value positive' : helixValue < 0 ? 'stat-value negative' : 'stat-value neutral';
    
    // Update trend
    const helixTrend = document.getElementById('helix-trend');
    if (helixTrend) {
      helixTrend.innerHTML = `<i class="fas fa-arrow-${helixValue > 0 ? 'up' : 'down'}"></i> ${Math.abs(helixValue).toFixed(2)}%`;
      helixTrend.className = `stat-trend trend-${helixValue > 0 ? 'up' : 'down'}`;
    }
  }
  
  if (cumulativeHelixElement) {
    const cumulativeValue = latestData.cumulativeHelixValue;
    cumulativeHelixElement.textContent = cumulativeValue.toFixed(4);
    cumulativeHelixElement.className = cumulativeValue > 0 ? 'stat-value positive' : cumulativeValue < 0 ? 'stat-value negative' : 'stat-value neutral';
    
    // Update trend
    const cumulativeTrend = document.getElementById('cumulative-trend');
    if (cumulativeTrend) {
      cumulativeTrend.innerHTML = `<i class="fas fa-arrow-${cumulativeValue > 0 ? 'up' : 'down'}"></i> ${Math.abs(cumulativeValue).toFixed(2)}%`;
      cumulativeTrend.className = `stat-trend trend-${cumulativeValue > 0 ? 'up' : 'down'}`;
    }
  }
  
  if (btcDeltaElement) {
    const btcDelta = latestData.btcDelta;
    btcDeltaElement.textContent = btcDelta.toFixed(2) + '%';
    btcDeltaElement.className = btcDelta > 0 ? 'stat-value positive' : 'stat-value negative';
    
    // Update trend
    const btcTrend = document.getElementById('btc-trend');
    if (btcTrend) {
      btcTrend.innerHTML = `<i class="fas fa-arrow-${btcDelta > 0 ? 'up' : 'down'}"></i> ${Math.abs(btcDelta).toFixed(2)}%`;
      btcTrend.className = `stat-trend trend-${btcDelta > 0 ? 'up' : 'down'}`;
    }
  }
  
  if (ethDeltaElement) {
    const ethDelta = latestData.ethDelta;
    ethDeltaElement.textContent = ethDelta.toFixed(2) + '%';
    ethDeltaElement.className = ethDelta > 0 ? 'stat-value positive' : 'stat-value negative';
    
    // Update trend
    const ethTrend = document.getElementById('eth-trend');
    if (ethTrend) {
      ethTrend.innerHTML = `<i class="fas fa-arrow-${ethDelta > 0 ? 'up' : 'down'}"></i> ${Math.abs(ethDelta).toFixed(2)}%`;
      ethTrend.className = `stat-trend trend-${ethDelta > 0 ? 'up' : 'down'}`;
    }
  }
  
  // Display interpretation
  const interpretationElement = document.getElementById('interpretation');
  if (interpretationElement) {
    interpretationElement.textContent = latestData.interpretation;
    
    // Apply appropriate class
    if (latestData.interpretation.toLowerCase().includes('btc')) {
      interpretationElement.className = 'interpretation-value interpretation-btc';
    } else if (latestData.interpretation.toLowerCase().includes('eth')) {
      interpretationElement.className = 'interpretation-value interpretation-eth';
    } else {
      interpretationElement.className = 'interpretation-value';
    }
  }
}

// Update the Helix chart with new data
async function updateHelixChart(data) {
  if (!helixChart || data.length === 0) return;
  
  // Get last MAX_CHART_POINTS items
  const chartData = data.slice(-MAX_CHART_POINTS);
  
  // Prepare data for chart
  const labels = chartData.map(item => formatTime(new Date(item.time)));
  const helixValues = chartData.map(item => item.helixValue);
  const cumulativeValues = chartData.map(item => item.cumulativeHelixValue);
  
  // Update chart data
  helixChart.data.labels = labels;
  helixChart.data.datasets[0].data = helixValues;
  helixChart.data.datasets[1].data = cumulativeValues;
  
  // Update chart
  helixChart.update();
}

// Update the Delta comparison chart
async function updateDeltaChart(data) {
  if (!deltaChart || data.length === 0) return;
  
  // Get last MAX_CHART_POINTS items
  const chartData = data.slice(-MAX_CHART_POINTS);
  
  // Prepare data for chart
  const labels = chartData.map(item => formatTime(new Date(item.time)));
  const btcDeltaValues = chartData.map(item => item.btcDelta);
  const ethDeltaValues = chartData.map(item => item.ethDelta);
  
  // Update chart data
  deltaChart.data.labels = labels;
  deltaChart.data.datasets[0].data = btcDeltaValues;
  deltaChart.data.datasets[1].data = ethDeltaValues;
  
  // Update chart
  deltaChart.update();
}

// Update performance summary with analytics
async function updatePerformanceSummary(data) {
  if (data.length === 0) return;
  
  // Count interpretations
  const interpretations = data.map(item => item.interpretation);
  const interpretationCounts = {};
  
  interpretations.forEach(interp => {
    interpretationCounts[interp] = (interpretationCounts[interp] || 0) + 1;
  });
  
  // Find dominant trend
  let dominantTrend = 'None';
  let maxCount = 0;
  
  Object.entries(interpretationCounts).forEach(([interp, count]) => {
    if (count > maxCount) {
      dominantTrend = interp;
      maxCount = count;
    }
  });
  
  const dominantPercentage = ((maxCount / interpretations.length) * 100).toFixed(1);
  
  // Update DOM elements
  const dominantTrendElement = document.getElementById('dominant-trend');
  if (dominantTrendElement) {
    dominantTrendElement.textContent = dominantTrend;
    
    // Apply style based on trend
    if (dominantTrend.toLowerCase().includes('btc')) {
      dominantTrendElement.className = 'stat-value interpretation-btc';
    } else if (dominantTrend.toLowerCase().includes('eth')) {
      dominantTrendElement.className = 'stat-value interpretation-eth';
    }
  }
  
  // Update percentage
  const domPercentageElement = document.getElementById('dom-percentage');
  if (domPercentageElement) {
    domPercentageElement.textContent = `${dominantPercentage}% of samples`;
  }
}

// Update the historical data table
async function updateHistoricalTable(data) {
  const container = document.getElementById('historical-container');
  if (!container || data.length === 0) return;
  
  // Create table data
  const tableData = [...data].reverse(); // Show most recent data first
  
  // Store for pagination
  window.helixTableData = tableData;
  window.currentPage = 0;
  window.itemsPerPage = 10;
  window.sortColumn = 0;
  window.sortDirection = -1; // Descending
  
  // Add first page of data
  const pageData = tableData.slice(0, window.itemsPerPage);
  
  // Build table HTML
  const tbody = document.querySelector('.data-table tbody');
  if (tbody) {
    tbody.innerHTML = buildTableRows(pageData);
    updatePageIndicator();
  }
}

// Build table rows from data
function buildTableRows(data) {
  let html = '';
  
  data.forEach(item => {
    const timestamp = new Date(item.time);
    const helixClass = item.helixValue > 0 ? 'positive' : item.helixValue < 0 ? 'negative' : '';
    const cumulativeClass = item.cumulativeHelixValue > 0 ? 'positive' : item.cumulativeHelixValue < 0 ? 'negative' : '';
    const btcClass = item.btcDelta > 0 ? 'positive' : 'negative';
    const ethClass = item.btcDelta > 0 ? 'positive' : 'negative';
    
    let interpretationClass = '';
    if (item.interpretation.toLowerCase().includes('btc')) {
      interpretationClass = 'interpretation-btc';
    } else if (item.interpretation.toLowerCase().includes('eth')) {
      interpretationClass = 'interpretation-eth';
    }
    
    html += `
      <tr>
        <td>${timestamp.toLocaleString()}</td>
        <td class="${helixClass}">${item.helixValue.toFixed(4)}</td>
        <td class="${cumulativeClass}">${item.cumulativeHelixValue.toFixed(4)}</td>
        <td class="${btcClass}">${item.btcDelta.toFixed(4)}%</td>
        <td class="${ethClass}">${item.ethDelta.toFixed(4)}%</td>
        <td><span class="${interpretationClass}">${item.interpretation}</span></td>
      </tr>
    `;
  });
  
  return html || '<tr><td colspan="6" class="text-center">No data available</td></tr>';
}

// Update the last fetched time display
function updateLastFetchedTime(fetchedAt) {
  const updateTimeElement = document.getElementById('update-time');
  
  if (!updateTimeElement) return;
  
  const fetchTime = new Date(fetchedAt);
  updateTimeElement.textContent = `Last updated: ${fetchTime.toLocaleString()}`;
}

// Format time for display
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Format date for filename
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Export Helix data to CSV
function exportHelixData() {
  if (!helixData || helixData.length === 0) {
    showNotification('warning', 'No data available to export');
    return;
  }
  
  try {
    const headers = ['Time', 'Helix Value', 'Cumulative Helix', 'BTC Delta (%)', 'ETH Delta (%)', 'Interpretation'];
    
    let csvContent = headers.join(',') + '\n';
    
    helixData.forEach(item => {
      const timestamp = new Date(item.time).toLocaleString();
      const row = [
        `"${timestamp}"`,
        item.helixValue.toFixed(4),
        item.cumulativeHelixValue.toFixed(4),
        item.btcDelta.toFixed(4),
        item.ethDelta.toFixed(4),
        `"${item.interpretation}"`
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `helix_${selectedTimeframe}_${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('success', 'Data exported successfully!');
  } catch (error) {
    console.error('Error exporting data:', error);
    showNotification('error', 'Failed to export data');
  }
}

// Filter the table data based on search input
function filterTable() {
  const input = document.getElementById('table-search');
  if (!input) return;
  
  const filter = input.value.toLowerCase();
  const filteredData = window.helixTableData.filter(item => 
    item.interpretation.toLowerCase().includes(filter)
  );
  
  // Reset to first page
  window.currentPage = 0;
  
  // Update table with filtered data
  const tbody = document.querySelector('.data-table tbody');
  if (tbody) {
    tbody.innerHTML = buildTableRows(filteredData.slice(0, window.itemsPerPage));
  }
  
  // Update pagination
  updatePageIndicator(filteredData.length);
}

// Change the current page of the table
function changePage(direction) {
  const input = document.getElementById('table-search');
  const filter = input ? input.value.toLowerCase() : '';
  
  const filteredData = filter ? 
    window.helixTableData.filter(item => item.interpretation.toLowerCase().includes(filter)) : 
    window.helixTableData;
  
  const newPage = window.currentPage + direction;
  const maxPage = Math.ceil(filteredData.length / window.itemsPerPage) - 1;
  
  if (newPage >= 0 && newPage <= maxPage) {
    window.currentPage = newPage;
    
    // Update table with new page data
    const start = window.currentPage * window.itemsPerPage;
    const end = start + window.itemsPerPage;
    const tbody = document.querySelector('.data-table tbody');
    if (tbody) {
      tbody.innerHTML = buildTableRows(filteredData.slice(start, end));
    }
    
    // Update pagination controls
    updatePageIndicator(filteredData.length);
  }
}

// Update pagination indicators
function updatePageIndicator(totalItems) {
  const total = totalItems || (window.helixTableData ? window.helixTableData.length : 0);
  const maxPage = Math.ceil(total / window.itemsPerPage) || 1;
  
  const indicator = document.getElementById('page-indicator');
  if (indicator) {
    indicator.textContent = `Page ${window.currentPage + 1} of ${maxPage}`;
  }
  
  const prevBtn = document.getElementById('prev-page');
  if (prevBtn) {
    prevBtn.disabled = window.currentPage === 0;
  }
  
  const nextBtn = document.getElementById('next-page');
  if (nextBtn) {
    nextBtn.disabled = window.currentPage >= maxPage - 1;
  }
}

// Sort the table by column
function sortTable(columnIndex) {
  // Toggle sort direction if same column
  if (window.sortColumn === columnIndex) {
    window.sortDirection *= -1;
  } else {
    window.sortColumn = columnIndex;
    window.sortDirection = 1; // Ascending by default for new column
  }
  
  // Sort the data
  window.helixTableData.sort((a, b) => {
    let valueA, valueB;
    
    switch(columnIndex) {
      case 0: // Time
        valueA = new Date(a.time).getTime();
        valueB = new Date(b.time).getTime();
        break;
      case 1: // Helix Value
        valueA = a.helixValue;
        valueB = b.helixValue;
        break;
      case 2: // Cumulative
        valueA = a.cumulativeHelixValue;
        valueB = b.cumulativeHelixValue;
        break;
      case 3: // BTC Delta
        valueA = a.btcDelta;
        valueB = b.btcDelta;
        break;
      case 4: // ETH Delta
        valueA = a.ethDelta;
        valueB = b.ethDelta;
        break;
      default:
        return 0;
    }
    
    return (valueA - valueB) * window.sortDirection;
  });
  
  // Update sort indicators
  const icons = document.querySelectorAll('.sort-icon');
  icons.forEach((icon, index) => {
    if (index === columnIndex) {
      icon.innerHTML = window.sortDirection === 1 ? '↑' : '↓';
    } else {
      icon.innerHTML = '';
    }
  });
  
  // Reset to first page and update table
  window.currentPage = 0;
  filterTable();
} 