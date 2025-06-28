
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loan, Collection } from "@/hooks/useFinanceData";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download } from "lucide-react";

interface LoanCashFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string | null;
  getLoanCashFlow: (loanId: string) => any;
}

const LoanCashFlowModal: React.FC<LoanCashFlowModalProps> = ({
  isOpen,
  onClose,
  loanId,
  getLoanCashFlow
}) => {
  const cashFlowData = loanId ? getLoanCashFlow(loanId) : null;

  if (!cashFlowData) return null;

  const { loan, collections, totalInflow, totalOutflow, netFlow, profit } = cashFlowData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const downloadPDFStatement = () => {
    // Create PDF content as HTML that can be printed to PDF
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Customer Statement - ${loan.customerName}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4;
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .statement-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .loan-info { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .info-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #e9ecef;
        }
        .info-title {
            font-weight: bold;
            color: #495057;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            padding: 3px 0;
        }
        .info-label { 
            font-weight: 500; 
            color: #6c757d;
        }
        .info-value { 
            font-weight: bold; 
            color: #212529;
        }
        .payments-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            border: 1px solid #dee2e6;
        }
        .payments-table th, .payments-table td { 
            border: 1px solid #dee2e6; 
            padding: 12px 8px; 
            text-align: left; 
        }
        .payments-table th { 
            background-color: #e9ecef; 
            font-weight: bold;
            color: #495057;
        }
        .payments-table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .amount { 
            font-weight: bold; 
            color: #28a745;
        }
        .no-payments {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 20px;
        }
        .summary-box {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 5px;
            padding: 15px;
            margin-top: 20px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .summary-label {
            font-weight: 500;
            color: #2563eb;
        }
        .summary-value {
            font-weight: bold;
            color: #1e40af;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            border-top: 1px solid #dee2e6;
            padding-top: 15px;
        }
        @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">FINANCIAL SERVICES</div>
        <div class="statement-title">CUSTOMER STATEMENT</div>
        <div>Customer: ${loan.customerName} | Loan ID: ${loan.id}</div>
        <div>Generated on: ${new Date().toLocaleDateString('en-IN')}</div>
    </div>

    <div class="loan-info">
        <div class="info-section">
            <div class="info-title">Loan Details</div>
            <div class="info-row">
                <span class="info-label">Loan Amount:</span>
                <span class="info-value">${formatCurrency(loan.loanAmount)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Net Amount Given:</span>
                <span class="info-value">${formatCurrency(loan.netGiven)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Daily Payment:</span>
                <span class="info-value">${formatCurrency(loan.dailyPay)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Term:</span>
                <span class="info-value">${loan.days} days</span>
            </div>
        </div>
        
        <div class="info-section">
            <div class="info-title">Account Status</div>
            <div class="info-row">
                <span class="info-label">Total to Receive:</span>
                <span class="info-value">${formatCurrency(loan.totalToReceive)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Amount Collected:</span>
                <span class="info-value amount">${formatCurrency(totalInflow)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Outstanding Balance:</span>
                <span class="info-value" style="color: #dc3545;">${formatCurrency(loan.balance)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">${loan.status}</span>
            </div>
        </div>
    </div>

    <h3 style="color: #495057; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;">Payment History</h3>
    
    ${collections.length > 0 ? `
    <table class="payments-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Amount Paid</th>
                <th>Collected By</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            ${collections
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(c => `
                <tr>
                    <td>${new Date(c.date).toLocaleDateString('en-IN')}</td>
                    <td class="amount">${formatCurrency(c.amountPaid)}</td>
                    <td>${c.collectedBy}</td>
                    <td>${c.remarks || '-'}</td>
                </tr>
              `).join('')}
        </tbody>
    </table>
    
    <div class="summary-box">
        <div class="summary-row">
            <span class="summary-label">Total Payments:</span>
            <span class="summary-value">${collections.length}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Total Amount Collected:</span>
            <span class="summary-value">${formatCurrency(totalInflow)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Outstanding Balance:</span>
            <span class="summary-value">${formatCurrency(loan.balance)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Collection Rate:</span>
            <span class="summary-value">${loan.totalToReceive > 0 ? ((totalInflow / loan.totalToReceive) * 100).toFixed(1) : '0'}%</span>
        </div>
    </div>
    ` : `
    <div class="no-payments">
        No payments have been recorded for this loan yet.
    </div>
    `}

    <div class="footer">
        This is a computer-generated statement. For any queries, please contact our customer service.
    </div>
</body>
</html>
    `.trim();

    // Create a new window with the PDF content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing
          printWindow.onafterprint = () => {
            printWindow.close();
          };
        }, 100);
      };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
        <DialogHeader className="border-b border-blue-200 pb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold text-slate-800">
              Customer Statement - {loan.customerName} (ID: {loan.id})
            </DialogTitle>
            <Button
              onClick={downloadPDFStatement}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF Statement
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Cards - Light Theme */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-red-400 to-pink-500 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Disbursed</CardTitle>
                <TrendingDown className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalOutflow)}</div>
                <p className="text-xs text-red-100">Money given to customer</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Collected</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalInflow)}</div>
                <p className="text-xs text-emerald-100">Money received from customer</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-white' : 'text-red-200'}`}>
                  {formatCurrency(netFlow)}
                </div>
                <p className="text-xs text-blue-100">Total net position</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(profit)}</div>
                <p className="text-xs text-purple-100">Profit earned</p>
              </CardContent>
            </Card>
          </div>

          {/* Loan Details - Light Theme */}
          <Card className="bg-white shadow-lg border border-slate-200">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-blue-100 border-b border-slate-200">
              <CardTitle className="text-slate-800">Loan Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-700">Original Loan Amount</p>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(loan.loanAmount)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Net Amount Given</p>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(loan.netGiven)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Remaining Balance</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(loan.balance)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Status</p>
                  <Badge variant={loan.status === 'Completed' ? 'default' : loan.status === 'Disabled' ? 'destructive' : 'secondary'}>
                    {loan.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4">
                <div>
                  <p className="font-semibold text-slate-700">Daily Payment</p>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(loan.dailyPay)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Term (Days)</p>
                  <p className="text-lg font-bold text-slate-800">{loan.days}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Deduction</p>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(loan.deduction)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collections History - Light Theme */}
          <Card className="bg-white shadow-lg border border-slate-200">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-blue-100 border-b border-slate-200">
              <CardTitle className="flex items-center text-slate-800">
                <Calendar className="mr-2 h-5 w-5" />
                Payment History ({collections.length} payment{collections.length !== 1 ? 's' : ''})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {collections.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left p-2 font-semibold text-slate-700">Date</th>
                        <th className="text-left p-2 font-semibold text-slate-700">Amount</th>
                        <th className="text-left p-2 font-semibold text-slate-700">Collected By</th>
                        <th className="text-left p-2 font-semibold text-slate-700">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collections
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((collection) => (
                        <tr key={collection.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-2 text-slate-700">
                            {new Date(collection.date).toLocaleDateString()}
                          </td>
                          <td className="p-2 text-emerald-600 font-bold">
                            {formatCurrency(collection.amountPaid)}
                          </td>
                          <td className="p-2 text-slate-700">{collection.collectedBy}</td>
                          <td className="p-2 text-slate-600">{collection.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Summary Row */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-slate-100 to-blue-100 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Total Collected:</span>
                      <span className="text-xl font-bold text-emerald-600">
                        {formatCurrency(totalInflow)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-semibold text-slate-700">Remaining Balance:</span>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(loan.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg">No payments recorded yet</p>
                  <p className="text-sm">Payments will appear here once collections are made</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoanCashFlowModal;
