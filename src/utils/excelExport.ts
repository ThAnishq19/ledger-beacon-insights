
import * as XLSX from 'xlsx';
import { Loan, Collection, Fund } from '@/hooks/useFinanceData';

export const exportToExcel = (loans: Loan[], collections: Collection[], funds: Fund[]) => {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Loan Summary Sheet
  const loanData = loans.map(loan => ({
    'Loan ID': loan.id,
    'Customer Name': loan.customerName,
    'Date': loan.date,
    'Loan Amount': loan.loanAmount,
    'Deduction': loan.deduction,
    'Net Given': loan.netGiven,
    'Daily Pay': loan.dailyPay,
    'Days': loan.days,
    'Total to Receive': loan.totalToReceive,
    'Collected': loan.collected,
    'Balance': loan.balance,
    'Status': loan.status,
    'Profit': loan.profit,
  }));

  const loanSheet = XLSX.utils.json_to_sheet(loanData);
  XLSX.utils.book_append_sheet(workbook, loanSheet, 'Loan Summary');

  // Daily Collections Sheet
  const collectionData = collections.map(collection => ({
    'Date': collection.date,
    'Loan ID': collection.loanId,
    'Customer': collection.customer,
    'Amount Paid': collection.amountPaid,
    'Collected By': collection.collectedBy,
    'Remarks': collection.remarks,
  }));

  const collectionSheet = XLSX.utils.json_to_sheet(collectionData);
  XLSX.utils.book_append_sheet(workbook, collectionSheet, 'Daily Collections');

  // Fund Tracker Sheet
  const fundData = funds.map(fund => ({
    'Date': fund.date,
    'Description': fund.description,
    'Inflow': fund.inflow,
    'Outflow': fund.outflow,
    'Balance': fund.balance,
  }));

  const fundSheet = XLSX.utils.json_to_sheet(fundData);
  XLSX.utils.book_append_sheet(workbook, fundSheet, 'Fund Tracker');

  // Generate filename with current date
  const date = new Date().toISOString().split('T')[0];
  const filename = `Financial_Dashboard_${date}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, filename);
};

export const exportSheet = (data: any[], sheetName: string, filename: string) => {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${date}.xlsx`;
  
  XLSX.writeFile(workbook, fullFilename);
};
