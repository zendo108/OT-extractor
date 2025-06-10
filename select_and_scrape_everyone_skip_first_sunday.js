/**
 * KRONOS MULTI-WORKER TIMESHEET SCRAPER
 * 
 * PURPOSE:
 * This script automates the extraction of timesheet data from Kronos for multiple workers.
 * It processes each worker sequentially, scrapes their timesheet data, and combines all data
 * into a single CSV file for easy analysis and filtering.
 * 
 * KEY FEATURES:
 * - Processes multiple workers defined in the ACTIVE_WORKERS array
 * - Selects workers from the dropdown menu automatically
 * - Skips Sunday records if they are the first day (for third-shift workers)
 * - Collects all workers' data into a single combined CSV
 * - Shows visual progress through a floating UI element
 * - Handles errors gracefully, continuing to next worker if one fails
 * 
 * USAGE:
 * 1. Navigate to the timesheet view in Kronos
 * 2. Open browser developer console (F12)
 * 3. Paste and run this script
 * 4. Wait for process to complete
 * 5. Download the combined CSV when prompted
 * 
 * LAST UPDATED: May 2025
 */

(function() {
  // List of active workers to process - replace with your actual worker names
  // These should match the text in the worker selection dropdown
  const ACTIVE_WORKERS = [
    "Begley, Michael",
    "Buonassisi, David M",
    "Caulfield, Sean P",
    "Degrange, Christopher",
    "Desjardins, Kenneth S",
    "Morancie, David"
    // Add all other active workers here
  ];
  
  
  // Define columns for CSV
  const columns = [
    "date", "name", "amount",
    "inpunch", "transfer", "outpunch",
    "inpunch2", "transfer2", "outpunch2",
    "workedshifttotal", "dailytotal", "cumulativetotal",
    "absence", "scheduleshift"
  ];
  
  // Helper function to escape row IDs in selectors
  const escapeRowId = (row) => {
    return row.toString().split('').map(d => `\\3${d} `).join('');
  };
  
  // Get cell value with fallback
  const getCellValue = (row, col) => {
    const selector = `#${escapeRowId(row)}_${col}`;
    const el = document.querySelector(selector);
    if (!el) return '""';
    const val = el.getAttribute("title") || "";
    return `"${val.replace(/"/g, '""')}"`;
  };
  
  // Create UI for progress tracking
  const createProgressUI = () => {
    const div = document.createElement('div');
    div.id = 'kronos-scraper-status';
    div.style.position = 'fixed';
    div.style.top = '10px';
    div.style.right = '10px';
    div.style.padding = '12px';
    div.style.background = 'rgba(0, 0, 0, 0.8)';
    div.style.color = 'white';
    div.style.borderRadius = '6px';
    div.style.zIndex = '9999';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.fontSize = '14px';
    div.style.lineHeight = '1.4';
    div.style.maxWidth = '300px';
    div.innerHTML = 'Initializing...';
    document.body.appendChild(div);
    return div;
  };
  
  const updateProgress = (message) => {
    let indicator = document.getElementById('kronos-scraper-status');
    if (!indicator) {
      indicator = createProgressUI();
    }
    indicator.innerHTML = message;
    console.log(message.replace(/<br>/g, '\n')); // Log to console too
  };
  
  // Function to select a worker from the available list
  const selectWorker = (workerName) => {
    return new Promise((resolve, reject) => {
      try {
        // Look for li elements with numbered IDs
        let workerElement = null;
        let index = 0;
        
        // Try up to 20 possible worker indices
        while (!workerElement && index < 20) {
          const li = document.querySelector(`#combo_li${index}`);
          if (li) {
            const a = li.querySelector('a');
            if (a && a.getAttribute('aria-label')) {
              const ariaLabel = a.getAttribute('aria-label');
              
              // Match based on the last name and first name
              const nameParts = workerName.split(',');
              if (nameParts.length > 0) {
                const lastName = nameParts[0].trim();
                // Handle case where aria-label might have slight differences in the first name
                // For example: "Buonassisi, David M" vs "Buonassisi, Dave M"
                if (ariaLabel.startsWith(lastName + ',')) {
                  // If first name is provided, check that the first few characters match
                  if (nameParts.length > 1) {
                    const firstName = nameParts[1].trim().split(' ')[0];
                    // Only need to match the first 3-4 characters of the first name to handle nicknames
                    if (ariaLabel.includes(firstName.substring(0, 3))) {
                      workerElement = a;
                      console.log(`Found worker "${workerName}" as "${ariaLabel}"`);
                      break;
                    }
                  } else {
                    // If only last name was provided, match just on that
                    workerElement = a;
                    console.log(`Found worker by last name "${lastName}" as "${ariaLabel}"`);
                    break;
                  }
                }
              }
            }
          }
          index++;
        }
        
        if (!workerElement) {
          console.log("Worker not found. Listing all available workers in dropdown:");
          for (let i = 0; i < 20; i++) {
            const li = document.querySelector(`#combo_li${i}`);
            if (li) {
              const a = li.querySelector('a');
              if (a && a.getAttribute('aria-label')) {
                console.log(`Worker option ${i}: ${a.getAttribute('aria-label')}`);
              }
            }
          }
          reject(`Worker "${workerName}" not found in any of the worker selectors. See console for available options.`);
          return;
        }
        
        // Click the anchor to select the worker
        workerElement.click();
        
        // Allow time for UI to update after worker selection
        setTimeout(() => {
          resolve();
        }, 3000); // Increased timeout for UI update
      } catch (error) {
        reject(`Error selecting worker: ${error.message}`);
      }
    });
  };
  
  // Storage for all collected data
  let collectedRows = {};
  let processedDateRange = { start: null, end: null };
  let targetLateDate = new Date('4/14/2025');
  let scrollAttempts = 0;
  let maxScrollAttempts = 15;
  let prevRowCount = 0;
  let stuckCounter = 0;
  let currentWorker = "";
  let sundaySkipped = false;
  
  // Array to hold all workers' data for combined CSV
  let combinedWorkerData = [];
  
  // Reset data for new worker
  const resetData = () => {
    collectedRows = {};
    processedDateRange = { start: null, end: null };
    scrollAttempts = 0;
    prevRowCount = 0;
    stuckCounter = 0;
    
    // Track whether we've skipped a Sunday
    sundaySkipped = false;
  };
  
  // Initial data scrape - get what's already visible
  const initialScrape = () => {
    updateProgress(`Starting initial data scrape for ${currentWorker}...`);
    
    // Get any visible rows
    const initialData = scrapeCurrentRows();
    prevRowCount = initialData.rowCount;
    
    updateProgress(`
      <strong>Initial scan complete for ${currentWorker}</strong><br>
      Found ${initialData.rowCount} rows<br>
      Date range: ${initialData.startDate || 'None'} to ${initialData.endDate || 'None'}<br>
      <br>Starting scroll process to find later data...
    `);
    
    // Start scrolling for additional data
    setTimeout(scrollForLaterData, 1000);
  };
  
  // Function to scrape currently visible rows
  const scrapeCurrentRows = () => {
    let row = 0;
    let maxRows = 15000;
    let rowCount = 0;
    let dateRange = { start: null, end: null };
    let allDates = new Set();
    
    while (row < maxRows) {
      const dateSelector = `#${escapeRowId(row)}_date`;
      const dateEl = document.querySelector(dateSelector);
      
      if (!dateEl) {
        row++;
        continue;
      }
      
      // Get the date value
      const dateValue = dateEl.getAttribute("title") || "";
      if (dateValue) {
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            // Skip Sundays from previous week
            // Check if this is the first date we're seeing AND it's a Sunday
            const isFirstDate = dateRange.start === null;
            const isSunday = date.getDay() === 0; // 0 = Sunday in JavaScript
            
            if (isFirstDate && isSunday) {
              console.log(`Skipping previous week Sunday: ${dateValue}`);
              row++;
              continue;
            }
            
            allDates.add(dateValue);
            
            // Update date range
            if (!dateRange.start || date < new Date(dateRange.start)) {
              dateRange.start = dateValue;
            }
            if (!dateRange.end || date > new Date(dateRange.end)) {
              dateRange.end = dateValue;
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
      
      // Only store if we don't already have this row
      if (!collectedRows[row]) {
        // Collect row data
        const rowData = {};
        columns.forEach(col => {
          if (col === "name") {
            // Set name to current worker being processed
            rowData[col] = currentWorker;
          } else {
            rowData[col] = getCellValue(row, col).replace(/^"|"$/g, '');
          }
        });
        
        // Check if this is a Sunday from previous week before adding
        const rowDate = new Date(rowData.date);
        const isFirstDate = Object.keys(collectedRows).length === 0;
        const isSunday = rowDate.getDay() === 0; // 0 = Sunday in JavaScript
        
        if (!(isFirstDate && isSunday)) {
          collectedRows[row] = rowData;
          rowCount++;
        }
      }
      
      row++;
    }
    
    // Update process tracking
    if (dateRange.start) {
      if (!processedDateRange.start || new Date(dateRange.start) < new Date(processedDateRange.start)) {
        processedDateRange.start = dateRange.start;
      }
    }
    if (dateRange.end) {
      if (!processedDateRange.end || new Date(dateRange.end) > new Date(processedDateRange.end)) {
        processedDateRange.end = dateRange.end;
      }
    }
    
    return { 
      rowCount,
      startDate: dateRange.start,
      endDate: dateRange.end,
      uniqueDates: allDates.size
    };
  };
  
  // Scroll to find later data
  const scrollForLaterData = () => {
    scrollAttempts++;
    
    // First, capture any newly visible rows
    const newData = scrapeCurrentRows();
    
    // Check if we're stuck
    if (newData.rowCount === prevRowCount) {
      stuckCounter++;
    } else {
      stuckCounter = 0;
      prevRowCount = newData.rowCount;
    }
    
    // Check if we've found our target late date
    const haveLateData = processedDateRange.end && 
                         new Date(processedDateRange.end) >= targetLateDate;
    
    // Update progress
    updateProgress(`
      <strong>${currentWorker}</strong> - Scroll attempt ${scrollAttempts}/${maxScrollAttempts}<br>
      Total rows collected: ${Object.keys(collectedRows).length}<br>
      Current date range: ${processedDateRange.start || 'None'} to ${processedDateRange.end || 'None'}<br>
      Late data (4/14/2025): ${haveLateData ? '✓ Found' : '❌ Still searching'}<br>
      ${stuckCounter > 2 ? '<span style="color:#ffa502">⚠️ Not finding new data</span>' : ''}
    `);
    
    // Stop if we've found our target date, hit max attempts, or are stuck
    if (haveLateData || scrollAttempts >= maxScrollAttempts || stuckCounter >= 4) {
      if (haveLateData) {
        updateProgress(`<strong style='color:#4cd137'>✓ Successfully found all target dates for ${currentWorker}!</strong><br>Preparing data...`);
      } else {
        updateProgress(`<strong style='color:#ffa502'>⚠️ Could not find all target dates for ${currentWorker}</strong><br>Using available data...`);
      }
      
      setTimeout(prepareFinalData, 1000);
      return;
    }
    
    // Try to scroll to later dates
    const rows = document.querySelectorAll('[id$="_date"]');
    if (rows.length > 0) {
      // Scroll to last row to try to load later data
      const lastRow = rows[rows.length - 1];
      lastRow.scrollIntoView({ behavior: 'smooth', block: 'end' });
      
      // Every third attempt, try a different approach
      if (scrollAttempts % 3 === 0 && rows.length > 10) {
        // Try scrolling to 80% down the list
        const targetIndex = Math.floor(rows.length * 0.8);
        rows[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    // Continue the process
    setTimeout(scrollForLaterData, 2000);
  };
  
  // Prepare final data and create CSV
  const prepareFinalData = () => {
    // Sort rows by date for better organization
    const sortedRows = Object.values(collectedRows).sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date) - new Date(b.date);
    });
    
    // Count unique dates
    const uniqueDates = new Set();
    sortedRows.forEach(row => {
      if (row.date) uniqueDates.add(row.date);
    });
    
    // Add current worker's data to our combined data array
    combinedWorkerData = combinedWorkerData.concat(sortedRows);
    
    // Final report for this worker
    updateProgress(`
      <strong style='color:#4cd137'>✓ Process complete for ${currentWorker}!</strong><br>
      Total rows: ${sortedRows.length}<br>
      Date range: ${processedDateRange.start || 'None'} to ${processedDateRange.end || 'None'}<br>
      Unique dates: ${uniqueDates.size}<br>
      <br>
      Data collected and will be included in final CSV.
    `);
    
    // Log details to console
    console.log(`Process complete for ${currentWorker}. Total rows: ${sortedRows.length}`);
    console.log(`Date range: ${processedDateRange.start} to ${processedDateRange.end}`);
    
    // Process next worker or finish
    setTimeout(processNextWorker, 2000);
  };
  
  // Process workers one by one
  let workerIndex = 0;
  
  const processNextWorker = async () => {
    if (workerIndex >= ACTIVE_WORKERS.length) {
      // All workers processed, create the combined CSV
      updateProgress(`
        <strong style='color:#4cd137'>✓ ALL WORKERS PROCESSED!</strong><br>
        Total workers processed: ${ACTIVE_WORKERS.length}<br>
        Total data rows: ${combinedWorkerData.length}<br>
        <br>
        Creating combined CSV file...
      `);
      
      // Generate the combined CSV
      const csvRows = [columns.join(',')]; // Header
      
      // Sort combined data by worker name and then date
      const sortedCombinedData = combinedWorkerData.sort((a, b) => {
        // First sort by name
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        
        // Then by date
        if (!a.date || !b.date) return 0;
        return new Date(a.date) - new Date(b.date);
      });
      
      // Add rows to CSV
      sortedCombinedData.forEach(rowData => {
        const csvRow = columns.map(col => `"${(rowData[col] || '').replace(/"/g, '""')}"`).join(',');
        csvRows.push(csvRow);
      });
      
      // Convert to CSV string
      const csv = csvRows.join('\n');
      
      // Create downloadable file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kronos_timesheet_all_workers_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      
      updateProgress(`
        <strong style='color:#4cd137'>✓ COMBINED CSV CREATED!</strong><br>
        Total workers: ${ACTIVE_WORKERS.length}<br>
        Total rows: ${combinedWorkerData.length}<br>
        <br>
        Combined CSV file has been downloaded.
      `);
      
      // Clean up UI after a delay
      setTimeout(() => {
        const indicator = document.getElementById('kronos-scraper-status');
        if (indicator) {
          indicator.style.opacity = '0';
          indicator.style.transition = 'opacity 1s';
          setTimeout(() => {
            if (indicator && indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
          }, 1000);
        }
      }, 8000);
      
      return;
    }
    
    // Set current worker and reset data collection
    currentWorker = ACTIVE_WORKERS[workerIndex];
    resetData();
    workerIndex++;
    
    updateProgress(`
      <strong>Processing worker ${workerIndex} of ${ACTIVE_WORKERS.length}</strong><br>
      Current worker: ${currentWorker}<br>
      <br>
      Selecting worker in dropdown...
    `);
    
    try {
      // Select the worker in the dropdown
      await selectWorker(currentWorker);
      
      // Start scraping for this worker
      setTimeout(initialScrape, 1000);
    } catch (error) {
      console.error("Error selecting worker:", error);
      updateProgress(`
        <strong style='color:#e84118'>❌ Error processing ${currentWorker}</strong><br>
        Error: ${error}<br>
        <br>
        Skipping to next worker...
      `);
      
      // Skip to next worker
      setTimeout(processNextWorker, 2000);
    }
  };
  
  // Start the multi-worker process
  updateProgress(`
    <strong>Kronos Multi-Worker Timesheet Scraper</strong><br>
    Found ${ACTIVE_WORKERS.length} workers to process<br>
    <br>
    Starting process...
  `);
  
  // Begin with the first worker
  setTimeout(processNextWorker, 1000);
})();
