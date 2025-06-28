
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loan, Collection } from "@/hooks/useFinanceData";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Customer Statement - {loan.customerName} (ID: {loan.id})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-red-600 to-pink-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Disbursed</CardTitle>
                <TrendingDown className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalOutflow)}</div>
                <p className="text-xs text-red-100">Money given to customer</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Collected</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalInflow)}</div>
                <p className="text-xs text-emerald-100">Money received from customer</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
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

            <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
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

          {/* Loan Details */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-700">Original Loan Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(loan.loanAmount)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Net Amount Given</p>
                  <p className="text-lg font-bold">{formatCurrency(loan.netGiven)}</p>
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
                  <p className="text-lg font-bold">{formatCurrency(loan.dailyPay)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Term (Days)</p>
                  <p className="text-lg font-bold">{loan.days}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Deduction</p>
                  <p className="text-lg font-bold">{formatCurrency(loan.deduction)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collections History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Payment History ({collections.length} payment{collections.length !== 1 ? 's' : ''})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {collections.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
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
                        <tr key={collection.id} className="border-b hover:bg-slate-50">
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
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
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
