(() => {
    function generateOTComparisonCSV(electricians) {
        const headers = [
            "Electrician",
            "Monday (x1.5 / x2 / Total)",
            "Tuesday (x1.5 / x2 / Total)",
            "Wednesday (x1.5 / x2 / Total)",
            "Thursday (x1.5 / x2 / Total)",
            "Friday (x1.5 / x2 / Total)",
            "Saturday (x1.5 / x2 / Total)",
            "Sunday (x1.5 / x2 / Total)",
            "Weekly Total (x1.5 / x2 / Total)"
        ];

        // Map rows for each electrician
        const rows = electricians.map(electrician => {
            let weeklyOT15 = 0;
            let weeklyOT2 = 0;
            let weeklyTotalOT = 0;

            // Create daily data row
            const dailyData = electrician.schedule.slice(0, 7).map(day => {
                const ot1_5 = parseFloat(day.ot1_5 || 0);
                const ot2 = parseFloat(day.ot2 || 0);
                const totalOT = parseFloat(day.equivalentOT || 0);

                weeklyOT15 += ot1_5;
                weeklyOT2 += ot2;
                weeklyTotalOT += totalOT;

                // Format as "x1.5 / x2 / Total"
                return `"${ot1_5.toFixed(2)} / ${ot2.toFixed(2)} / ${totalOT.toFixed(2)}"`;
            });

            // Add weekly totals at the end
            const weeklyTotal = `"${weeklyOT15.toFixed(2)} / ${weeklyOT2.toFixed(2)} / ${weeklyTotalOT.toFixed(2)}"`;
            return [`"${electrician.employeeName}"`, ...dailyData, weeklyTotal];
        });

        // Combine headers and rows into CSV format
        const csvContent = [
            headers.map(h => `"${h}"`).join(","), // Add headers with quotes
            ...rows.map(row => row.join(",")) // Add data rows
        ].join("\n");

        console.log("Generated CSV:\n" + csvContent); // Log the CSV string to console
        return csvContent;
    }

    // Example JSON for all electricians
    const electricians = [
        {
            "employeeName": "Morancie, David",
            "schedule": [
                { "id": "1_date", "date": "Mon 1/06", "ot1_5": "0.03", "ot2": "0.00", "equivalentOT": "0.05" },
                { "id": "2_date", "date": "Tue 1/07", "ot1_5": "0.63", "ot2": "0.00", "equivalentOT": "0.95" },
                { "id": "3_date", "date": "Wed 1/08", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" },
                { "id": "4_date", "date": "Thu 1/09", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" },
                { "id": "5_date", "date": "Fri 1/10", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" },
                { "id": "6_date", "date": "Sat 1/11", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" },
                { "id": "7_date", "date": "Sun 1/12", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" }
            ],
            "totals": { "ot1_5": "0.66", "ot2": "0.00", "equivalentOT": "1.00" }
        },
        {
            "employeeName": "Begley, Michael",
            "schedule": [
                { "id": "1_date", "date": "Mon 1/06", "ot1_5": "0.48", "ot2": "0.00", "equivalentOT": "0.72" },
                { "id": "2_date", "date": "Tue 1/07", "ot1_5": "0.50", "ot2": "0.00", "equivalentOT": "0.75" },
                { "id": "3_date", "date": "Wed 1/08", "ot1_5": "0.52", "ot2": "0.00", "equivalentOT": "0.78" },
                { "id": "4_date", "date": "Thu 1/09", "ot1_5": "0.60", "ot2": "0.00", "equivalentOT": "0.90" },
                { "id": "5_date", "date": "Fri 1/10", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" },
                { "id": "6_date", "date": "Sat 1/11", "ot1_5": "4.00", "ot2": "0.00", "equivalentOT": "6.00" },
                { "id": "7_date", "date": "Sun 1/12", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" }
            ],
            "totals": { "ot1_5": "6.10", "ot2": "0.00", "equivalentOT": "9.15" }
        },
        {
            "employeeName": "Degrange, Chris",
            "schedule": [
                { "id": "1_date", "date": "Mon 1/06", "ot1_5": "1.00", "ot2": "0.50", "equivalentOT": "2.25" },
                { "id": "2_date", "date": "Tue 1/07", "ot1_5": "0.75", "ot2": "0.25", "equivalentOT": "1.50" },
                { "id": "3_date", "date": "Wed 1/08", "ot1_5": "0.50", "ot2": "0.00", "equivalentOT": "0.75" },
                { "id": "4_date", "date": "Thu 1/09", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" },
                { "id": "5_date", "date": "Fri 1/10", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" },
                { "id": "6_date", "date": "Sat 1/11", "ot1_5": "3.00", "ot2": "1.00", "equivalentOT": "5.00" },
                { "id": "7_date", "date": "Sun 1/12", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" }
            ],
            "totals": { "ot1_5": "5.25", "ot2": "1.75", "equivalentOT": "10.50" }
        },
        {
            "employeeName": "Buonassisi, David",
            "schedule": [
                { "id": "1_date", "date": "Mon 1/06", "ot1_5": "0.60", "ot2": "0.10", "equivalentOT": "0.90" },
                { "id": "2_date", "date": "Tue 1/07", "ot1_5": "0.80", "ot2": "0.20", "equivalentOT": "1.40" },
                { "id": "3_date", "date": "Wed 1/08", "ot1_5": "0.70", "ot2": "0.30", "equivalentOT": "1.25" },
                { "id": "4_date", "date": "Thu 1/09", "ot1_5": "0.50", "ot2": "0.00", "equivalentOT": "0.75" },
                { "id": "5_date", "date": "Fri 1/10", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" },
                { "id": "6_date", "date": "Sat 1/11", "ot1_5": "3.00", "ot2": "1.00", "equivalentOT": "5.00" },
                { "id": "7_date", "date": "Sun 1/12", "ot1_5": "0.00", "ot2": "0.00", "equivalentOT": "0.00" }
            ],
            "tot
