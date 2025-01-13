(function () {
    const scheduleData = [];

    // Extract employee name
    const employeeElement = document.querySelector('input#combo_inptxt[aria-label]');
    if (!employeeElement) {
        console.error('Employee name input element not found!');
        return;
    }
    const employeeName = employeeElement.getAttribute('aria-label').trim();

    let daysProcessed = 0; // Count processed days (max 7 for Mon-Sun)

    for (let i = 0; daysProcessed < 7; i++) {
        // Extract date
        const dateElement = document.querySelector(`span[name="content"][id="${i}_date"]`);
        if (!dateElement) {
            console.warn(`Date span with id="${i}_date" not found`);
            continue;
        }
        const date = dateElement.textContent.trim();

        // Skip the first Sunday
        if (daysProcessed === 0 && date.startsWith("Sun ")) {
            console.info(`Skipping extra Sunday: ${date}`);
            continue;
        }

        daysProcessed += 1; // Increment the days processed only after skipping the first Sunday

        // Extract Punch In
        const inPunchSpan = document.querySelector(`span[name="content"][id="${i}_inpunch"]`);
        const inPunch = inPunchSpan ? inPunchSpan.textContent.trim() : null;

        // Extract Punch Out
        const outPunchSpan = document.querySelector(`span[name="content"][id="${i}_outpunch"]`);
        const outPunch = outPunchSpan ? outPunchSpan.textContent.trim() : null;

        // Handle empty punches gracefully
        if (!inPunch || !outPunch) {
            console.info(`No punches for id="${i}_date": In Punch = ${inPunch}, Out Punch = ${outPunch}`);
            scheduleData.push({ id: `${i}_date`, date, inPunch, outPunch, totalHours: "0.00", ot1_5: "0.00", ot2: "0.00", equivalentOT: "0.00" });
            continue;
        }

        // Calculate total hours and overtime
        const parseTime = (time) => {
            const match = time ? time.match(/(\d+):(\d+)\s?(AM|PM)/i) : null;
            if (!match) return null; // Return null if the time is invalid
            const [hour, minute, period] = match.slice(1);
            let hours24 = parseInt(hour, 10) % 12;
            if (period.toUpperCase() === 'PM') hours24 += 12;
            return hours24 + parseInt(minute, 10) / 60;
        };

        const start = parseTime(inPunch);
        const end = parseTime(outPunch);

        if (start === null || end === null) {
            console.warn(`Invalid time format for id="${i}_date": In Punch = ${inPunch}, Out Punch = ${outPunch}`);
            scheduleData.push({ id: `${i}_date`, date, inPunch, outPunch, totalHours: "0.00", ot1_5: "0.00", ot2: "0.00", equivalentOT: "0.00" });
            continue;
        }

        const totalHours = end > start ? end - start : 24 - start + end;
        let ot1_5 = Math.max(0, Math.min(totalHours - 8, 4));
        let ot2 = Math.max(0, totalHours - 12);

        // Add golden hour if totalHours >= 16
        let goldenHour = totalHours >= 16 ? 1 : 0;

        // Calculate equivalent OT including the golden hour
        const equivalentOT = (ot1_5 * 1.5 + ot2 * 2 + goldenHour).toFixed(2);

        // Store the extracted data with equivalent OT hours
        scheduleData.push({
            id: `${i}_date`,
            date,
            inPunch,
            outPunch,
            totalHours: totalHours.toFixed(2),
            ot1_5: ot1_5.toFixed(2),
            ot2: ot2.toFixed(2),
            equivalentOT,
            goldenHour: goldenHour.toFixed(2) // Optional: log golden hour for clarity
        });
    }

    // Aggregate totals
    const totals = scheduleData.reduce(
        (acc, { totalHours, ot1_5, ot2, equivalentOT }) => {
            acc.totalHours += parseFloat(totalHours);
            acc.ot1_5 += parseFloat(ot1_5);
            acc.ot2 += parseFloat(ot2);
            acc.equivalentOT += parseFloat(equivalentOT);
            return acc;
        },
        { totalHours: 0, ot1_5: 0, ot2: 0, equivalentOT: 0 }
    );

    const output = {
        employeeName: employeeName,
        schedule: scheduleData,
        totals: {
            totalHours: totals.totalHours.toFixed(2),
            ot1_5: totals.ot1_5.toFixed(2),
            ot2: totals.ot2.toFixed(2),
            equivalentOT: totals.equivalentOT.toFixed(2)
        }
    };

    // Log the complete data
    console.log("Extracted Data:", output);
})();
