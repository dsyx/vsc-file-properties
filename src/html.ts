export class HTMLTableBuilder {
    public constructor(headers?: string[], rows?: string[][]) {
        this.headers = headers ? headers : [];
        this.rows = rows ? rows : [];
    }

    public addHeader(header: string): void {
        this.headers.push(header);
    }

    public addRow(row: string[]) {
        this.rows.push(row);
    }

    public build(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style type="text/css">
        .html-table {
            border-collapse: collapse;
            width: 100%;
        }
        .html-table th, .html-table td {
            border: 2px double;
            padding: 8px;
            text-align: left;
        }
    </style>
</head>
<body>
    ${this.buildTable()}
</body>
</html>`;
    }

    private buildTable(): string {
        return `<table class="html-table">${[this.buildTableHeader(), this.buildTableRow()].join("")}</table>`;
    }

    private buildTableHeader(): string {
        return `<thead><tr>${this.headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>`;
    }

    private buildTableRow(): string {
        return `<tbody>${this.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>`;
    }

    private headers: string[];
    private rows: string[][];
}
