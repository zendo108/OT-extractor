// Extract data from the time card HTML
document.addEventListener("DOMContentLoaded", () => {
  const employeeName = document.querySelector("div[data-employee-name]").textContent.trim();
  const rows = document.querySelectorAll("table tr");

  const scheduleData = [];

  rows.forEach((row, index) => {
    // Skip the header row
    if (index === 0) return;

    const cells = row.querySelectorAll("td");
    if (cells.length > 0) {
      const date = cells[0].textContent.trim();
      const inTime = cells[1].textContent.trim();
      const outTime = cells[2].textContent.trim();
      const payCode = cells[3]?.textContent.trim() || null;
      const hours = parseFloat(cells[4]?.textContent.trim()) || 0;

      scheduleData.push({
        date,
        inTime,
        outTime,
        payCode,
        hours
      });
    }
  });

  function calculateHoursAndOT(inTime, outTime, hours) {
    if (!inTime || !outTime) {
      return { totalHours: hours, ot1_5: 0, ot2: 0, goldenHour: 0 };
    }

    const parseTime = (time) => {
      const [hour, minute, period] = time.match(/(\d+):(\d+)\s?(AM|PM)/i).slice(1);
      let hours24 = parseInt(hour, 10) % 12;
      if (period.toUpperCase() === "PM") hours24 += 12;
      return hours24 + parseInt(minute, 10) / 60;
    };

    const start = parseTime(inTime);
    const end = parseTime(outTime);
    const totalHours = end > start ? end - start : 24 - start + end;

    const ot1_5 = Math.max(0, Math.min(totalHours - 8, 4));
    const ot2 = Math.max(0, Math.min(totalHours - 12, 4));
    const goldenHour = totalHours > 16 ? 2 : 0;

    return {
      totalHours,
      ot1_5,
      ot2: ot2 + Math.max(0, totalHours - 16),
      goldenHour
    };
  }

  const processedData = scheduleData.map(({ date, inTime, outTime, payCode, hours }) => {
    const otData = calculateHoursAndOT(inTime, outTime, hours);
    return { date, inTime, outTime, payCode, hours, ...otData };
  });

  const totals = processedData.reduce(
    (acc, { totalHours, ot1_5, ot2, goldenHour }) => {
      acc.totalHours += totalHours;
      acc.ot1_5 += ot1_5;
      acc.ot2 += ot2;
      acc.goldenHour += goldenHour;
      return acc;
    },
    { totalHours: 0, ot1_5: 0, ot2: 0, goldenHour: 0 }
  );

  // Create table to display results
  const table = document.createElement("table");
  table.border = "1";
  const headerRow = table.insertRow();
  ["Date", "In Time", "Out Time", "Pay Code", "Hours", "OT x1.5", "OT x2", "Golden Hour"].forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });

  processedData.forEach(({ date, inTime, outTime, payCode, hours, ot1_5, ot2, goldenHour }) => {
    const row = table.insertRow();
    [date, inTime, outTime, payCode, hours.toFixed(2), ot1_5.toFixed(2), ot2.toFixed(2), goldenHour.toFixed(2)].forEach((cellData) => {
      const cell = row.insertCell();
      cell.textContent = cellData;
    });
  });

  // Add totals row
  const totalsRow = table.insertRow();
  ["Total", "", "", "", totals.totalHours.toFixed(2), totals.ot1_5.toFixed(2), totals.ot2.toFixed(2), totals.goldenHour.toFixed(2)].forEach((cellData) => {
    const cell = totalsRow.insertCell();
    cell.textContent = cellData;
    if (cellData === "Total") cell.colSpan = 4;
  });

  document.body.appendChild(table);

  console.log("Employee Name:", employeeName);
  console.log("Processed Schedule Data:", processedData);
  console.log("Total Aggregation:", totals);
});
