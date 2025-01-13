# Time Card Data Extraction and OT Calculation

## Project Description
This project processes employee time card data to calculate overtime (OT) and generate a tabular display of daily and aggregate OT details. The tool extracts schedule information directly from an HTML page and computes OT based on the following rules:

- **OT x1.5**: Hours exceeding 8 in a day, up to 12 hours.
- **OT x2**: Hours exceeding 12 in a day, up to 16 hours.
- **Golden Hour**: 16th hour worked counts as 2 OT hours.
- Additional hours beyond 16 count as OT x2.

## Features
- Extracts schedule data directly from an HTML table.
- Computes total hours, OT x1.5, OT x2, and golden hour for each day.
- Displays results in a dynamically generated HTML table.
- Includes an aggregate row summarizing total hours and OT.

## Installation and Setup
1. Add the JavaScript file to your project.
2. Ensure the HTML page contains the required table structure and employee name data.
3. Include the script in your HTML file:

```html
<script src="path/to/your/script.js"></script>
```

## Usage
1. Ensure the HTML contains:
   - A `div` with the employee name (`data-employee-name` attribute).
   - A `table` element with rows containing date, in time, out time, pay code, and hours worked.

2. When the page loads, the script automatically:
   - Extracts the employee name and schedule data.
   - Calculates daily and aggregate OT details.
   - Appends a table with the processed data and totals to the page body.

## Output
- A dynamic HTML table showing:
  - **Date**: The workday date.
  - **In Time**: The start time.
  - **Out Time**: The end time.
  - **Pay Code**: Additional information (if any).
  - **Hours**: Total hours worked.
  - **OT x1.5**: Overtime at 1.5x rate.
  - **OT x2**: Overtime at 2x rate.
  - **Golden Hour**: Special OT for the 16th hour worked.

## Example Table
| Date       | In Time  | Out Time | Pay Code       | Hours | OT x1.5 | OT x2 | Golden Hour |
|------------|----------|----------|----------------|-------|---------|-------|-------------|
| 01/01/2025 | 8:00 AM | 5:00 PM  | Regular        | 9.00  | 1.00    | 0.00  | 0.00        |
| 01/02/2025 | 7:00 AM | 7:30 PM  | Regular        | 12.50 | 4.00    | 0.50  | 0.00        |
| **Total**  |          |          |                | 21.50 | 5.00    | 0.50  | 0.00        |

## Development Notes
- **Time Parsing**: The script supports `hh:mm AM/PM` format for `inTime` and `outTime`.
- **Dynamic Table**: The generated table automatically calculates and displays totals.

## Contribution
Contributions are welcome! Please fork the repository and submit a pull request.

## License
This project is licensed under the MIT License.

