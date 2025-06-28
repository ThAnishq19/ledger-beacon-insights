
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

  const downloadStatement = () => {
    const statementData = {
      customerName: loan.customerName,
      loanId: loan.id,
      loanAmount: loan.loanAmount,
      netGiven: loan.netGiven,
      deduction: loan.deduction,
      dailyPay: loan.dailyPay,
      days: loan.days,
      totalToReceive: loan.totalToReceive,
      balance: loan.balance,
      status: loan.status,
      totalCollected: totalInflow,
      totalDisbursed: totalOutflow,
      netCashFlow: netFlow,
      profit: profit,
      collections: collections.map(c => ({
        date: c.date,
        amount: c.amountPaid,
        collectedBy: c.collectedBy,
        remarks: c.remarks
      }))
    };

    const content = `
CUSTOMER STATEMENT
==================

Customer: ${loan.customerName}
Loan ID: ${loan.id}
Date: ${new Date().toLocaleDateString()}

LOAN DETAILS
------------
Original Loan Amount: ${formatCurrency(loan.loanAmount)}
Net Amount Given: ${formatCurrency(loan.netGiven)}
Deduction: ${formatCurrency(loan.deduction)}
Daily Payment: ${formatCurrency(loan.dailyPay)}
Term: ${loan.days} days
Total to Receive: ${formatCurrency(loan.totalToReceive)}
Status: ${loan.status}

FINANCIAL SUMMARY
-----------------
Total Disbursed: ${formatCurrency(totalOutflow)}
Total Collected: ${formatCurrency(totalInflow)}
Outstanding Balance: ${formatCurrency(loan.balance)}
Net Cash Flow: ${formatCurrency(netFlow)}
Profit Earned: ${formatCurrency(profit)}

PAYMENT HISTORY
---------------
${collections.length === 0 ? 'No payments recorded' : collections
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .map(c => `${c.date} | ${formatCurrency(c.amountPaid)} | ${c.collectedBy} | ${c.remarks || '-'}`)
  .join('\n')}

SUMMARY
-------
Recovery Rate: ${totalOutflow > 0 ? ((totalInflow / totalOutflow) * 100).toFixed(1) : '0'}%
Outstanding: ${formatCurrency(loan.balance)}

Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${loan.customerName}_Statement_${loan.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              onClick={downloadStatement}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Statement
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
