import ExcelJS from 'exceljs';

export async function generateTimetableTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Timetable Template');

  sheet.columns = [
    { header: 'Module Code', key: 'moduleCode', width: 18 },
    { header: 'Module Name', key: 'moduleName', width: 35 },
    { header: 'Class Name', key: 'className', width: 15 },
    { header: 'Class Type (DEGREE/OD)', key: 'classType', width: 22 },
    { header: 'Day (1=Mon..7=Sun)', key: 'dayOfWeek', width: 20 },
    { header: 'Start Time (HH:MM)', key: 'startTime', width: 18 },
    { header: 'End Time (HH:MM)', key: 'endTime', width: 18 },
    { header: 'Room', key: 'room', width: 15 },
  ];

  sheet.addRow({
    moduleCode: 'COU 07202',
    moduleName: 'Microprocessor Technologies',
    className: 'BTIT II',
    classType: 'DEGREE',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '11:00',
    room: 'Lab 2',
  });

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generateClaimExcel(lecturer: any, sessions: any[], claim: any, allClaimsForYear: any[] = []): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Monthly Claim Form
  const sheet = workbook.addWorksheet(`Claim_${claim.month}_${claim.year}`);

  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').value = 'DAR ES SALAAM INSTITUTE OF TECHNOLOGY';
  sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: '003366' } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:D2');
  sheet.getCell('A2').value = `${lecturer.department?.name?.toUpperCase() || 'COMPUTER STUDIES DEPARTMENT'}`;
  sheet.getCell('A2').font = { bold: true, size: 12 };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  sheet.mergeCells('A3:D3');
  sheet.getCell('A3').value = 'CONSULTANCY / PART-TIME TEACHING CLAIM FORM';
  sheet.getCell('A3').font = { bold: true, size: 11 };
  sheet.getCell('A3').alignment = { horizontal: 'center' };

  sheet.addRow([]);
  sheet.addRow(['LECTURER/TUTOR NAME:', `${lecturer.firstName} ${lecturer.lastName}`]);
  sheet.addRow(['ADDRESS', 'P.O.BOX 2958 DAR ES SALAAM']);
  sheet.addRow(['DEPARTMENT:', lecturer.department?.name || 'Computer Studies']);
  sheet.addRow([]);
  sheet.addRow(['BANK DETAILS:', lecturer.bankName || 'CRDB']);
  sheet.addRow(['', lecturer.bankAccountName || lecturer.firstName + ' ' + lecturer.lastName]);
  sheet.addRow(['', lecturer.accountNumber || '0150000000000']);
  sheet.addRow([]);
  sheet.addRow(['ACADEMIC YEAR:', '2025/2026']);
  sheet.addRow(['RATE PER HOUR:', `${lecturer.degreeRate || 15000} TZS`, 'DEGREE PROGRAM']);
  sheet.addRow(['TRANSPORT:', `${lecturer.transportRate || 10000} TZS`, 'Per teaching day']);
  sheet.addRow([]);

  const headerRow = sheet.addRow(['Date', 'Module', 'Class', 'Hours', 'Tuition (TZS)', 'Transport (TZS)', 'Gross (TZS)']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };

  sessions.forEach(s => {
    sheet.addRow([
      s.date,
      `${s.module?.code} - ${s.module?.name}`,
      s.class?.name || '',
      s.hours,
      s.tuition,
      s.transport,
      s.gross,
    ]);
  });

  sheet.addRow([]);
  const totalRow = sheet.addRow([
    'TOTAL',
    '',
    '',
    claim.totalHours,
    claim.totalTuition,
    claim.totalTransport,
    claim.totalGross,
  ]);
  totalRow.font = { bold: true };

  sheet.addRow([]);
  sheet.addRow(['Claimant:']);
  sheet.addRow([`Name: ${lecturer.firstName} ${lecturer.lastName}`, '', `Signature: ________________`, `Date: ${new Date().toLocaleDateString()}`]);
  sheet.addRow([]);
  sheet.addRow(['Checked by Head of Section:']);
  sheet.addRow(['I certify that the above claim is valid and tasks were executed satisfactorily.']);
  sheet.addRow(['Name: ________________________', '', 'Signature: ________________', 'Date: ____________']);
  sheet.addRow([]);
  sheet.addRow(['Approval by HoD:']);
  sheet.addRow(['I certify that the above claim is valid and tasks were executed satisfactorily.']);
  sheet.addRow(['Name: ________________________', '', 'Signature: ________________', 'Date: ____________']);

  // Sheet 2: Annual Summary
  const summarySheet = workbook.addWorksheet('Annual Summary');
  summarySheet.mergeCells('A1:D1');
  summarySheet.getCell('A1').value = 'DAR ES SALAAM INSTITUTE OF TECHNOLOGY';
  summarySheet.getCell('A1').font = { bold: true, size: 14, color: { argb: '003366' } };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };

  summarySheet.mergeCells('A2:D2');
  summarySheet.getCell('A2').value = 'SUMMARY OF CONSULTANCY CLAIM FORM - ANNUAL BREAKDOWN';
  summarySheet.getCell('A2').font = { bold: true, size: 12 };
  summarySheet.getCell('A2').alignment = { horizontal: 'center' };

  summarySheet.addRow([]);
  summarySheet.addRow(['Lecturer:', `${lecturer.firstName} ${lecturer.lastName}`]);
  summarySheet.addRow(['Department:', lecturer.department?.name || 'Computer Studies']);
  summarySheet.addRow([]);

  const sumHeader = summarySheet.addRow(['MONTH', 'TUITION PAYMENT (TSHS)', 'TRANSPORT (TSHS)', 'TOTAL (TSHS)']);
  sumHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  sumHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };

  let sumTuition = 0;
  let sumTransport = 0;
  let sumGross = 0;

  allClaimsForYear.forEach(c => {
    const monthName = new Date(c.year, c.month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    summarySheet.addRow([monthName, c.totalTuition, c.totalTransport, c.totalGross]);
    sumTuition += c.totalTuition;
    sumTransport += c.totalTransport;
    sumGross += c.totalGross;
  });

  const sumTotalRow = summarySheet.addRow(['TOTAL AMOUNT', sumTuition, sumTransport, sumGross]);
  sumTotalRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generateAdminSummaryExcel(claims: any[], sessions: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Institutional Claims Summary');

  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = 'DAR ES SALAAM INSTITUTE OF TECHNOLOGY - INSTITUTIONAL CLAIMS SUMMARY';
  sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: '003366' } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.addRow([]);

  const header = sheet.addRow(['Lecturer Name', 'Department', 'Month/Year', 'Total Hours', 'Total Tuition (TZS)', 'Status']);
  header.font = { bold: true, color: { argb: 'FFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };

  claims.forEach(c => {
    sheet.addRow([
      `${c.lecturer.firstName} ${c.lecturer.lastName}`,
      c.lecturer.department?.name || 'N/A',
      `${c.month}/${c.year}`,
      c.totalHours,
      c.totalTuition,
      c.status,
    ]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
