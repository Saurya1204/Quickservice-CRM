import * as XLSX from 'xlsx';

export function parseExcelBuffer(buffer: Buffer): any[] {
  try {
    // Attempt standard XLSX / XLS / HTML reading via SheetJS
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (sheetName) {
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (json && json.length > 0) {
        return json;
      }
    }
  } catch (e) {
    console.warn('SheetJS standard read failed, attempting raw HTML table parse:', e);
  }

  // Fallback: Parse HTML table directly if legacy .xls was created by an ASP.NET RenderControl
  const text = buffer.toString('utf-8');
  if (text.includes('<table') || text.includes('<tr')) {
    const rows: any[] = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let headers: string[] = [];
    let trMatch;

    while ((trMatch = trRegex.exec(text)) !== null) {
      const rowContent = trMatch[1];
      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      const cells: string[] = [];
      let cellMatch;

      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        // Strip inner tags and decode html entities
        const cleanCell = cellMatch[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();
        cells.push(cleanCell);
      }

      if (cells.length === 0) continue;

      if (headers.length === 0) {
        headers = cells;
      } else {
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cells[idx] || '';
        });
        rows.push(rowObj);
      }
    }

    if (rows.length > 0) return rows;
  }

  return [];
}
