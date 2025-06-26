
import * as XLSX from 'xlsx';
import { Loan, Collection, Fund } from '@/hooks/useFinanceData';

// Helper function to generate complete fund tracker data
const generateFundTrackerData = (loans: Loan[], collections: Collection[], funds: Fund[]) => {
  const transactions: any[] = [];
  
  // Add manual fund entries
  funds.forEach(fund => {
    transactions.push({
      Date: fund.date,
      Description: fund.description,
      Inflow: fund.inflow,
      Outflow: fund.outflow,
      Balance: 0, // Will be calculated later
      Type: fund.description === 'Initial Balance' ? 'Opening' : 'Manual'
    });
  });

  // Add loan disbursements as outflows (using netGiven - actual cash out)
  loans.forEach(loan => {
    transactions.push({
      Date: loan.date,
      Description: `Loan disbursed to ${loan.customerName} (ID: ${loan.id})`,
      Inflow: 0,
      Outflow: loan.netGiven, // Use netGiven instead of loanAmount
      Balance: 0, // Will be calculated later
      Type: 'Loan Disbursement'
    });
  });

  // Group collections by date and add as inflows
  const collectionsByDate = collections.reduce((acc, collection) => {
    if (!acc[collection.date]) {
      acc[collection.date] = [];
    }
    acc[collection.date].push(collection);
    return acc;
  }, {} as { [date: string]: Collection[] });

  Object.entries(collectionsByDate).forEach(([date, dayCollections]) => {
    const totalAmount = dayCollections.reduce((sum, c) => sum + c.amountPaid, 0);
    const loanIds = [...new Set(dayCollections.map(c => c.loanId))];
    
    transactions.push({
      Date: date,
      Description: `Daily collections from ${loanIds.length} loan(s): ${loanIds.join(', ')}`,
      Inflow: totalAmount,
      Outflow: 0,
      Balance: 0, // Will be calculated later
      Type: 'Collection'
    });
  });

  // Sort by date
  transactions.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

  // Calculate running balance
  let runningBalance = 0;
  transactions.forEach(transaction => {
    runningBalance += transaction.Inflow - transaction.Outflow;
    transaction.Balance = runningBalance;
  });

  return transactions;
};

export const exportToExcel = (loans: Loan[], collections: Collection[], funds: Fund[]) => {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Loan Summary Sheet with corrected calculations
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
    'Notes': 'Invested Amount = Net Given, Profit = Deduction + Collection Interest'
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

  // Enhanced Fund Tracker Sheet with corrected cash flow tracking
  const fundTrackerData = generateFundTrackerData(loans, collections, funds);
  const fundSheet = XLSX.utils.json_to_sheet(fundTrackerData);
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
