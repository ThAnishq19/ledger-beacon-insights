
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Cash Flow Details - {loan.customerName} (ID: {loan.id})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-red-600 to-pink-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outflow</CardTitle>
                <TrendingDown className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalOutflow.toLocaleString()}</div>
                <p className="text-xs text-red-100">Amount disbursed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inflow</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalInflow.toLocaleString()}</div>
                <p className="text-xs text-emerald-100">Amount collected</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-white' : 'text-red-200'}`}>
                  ${netFlow.toLocaleString()}
                </div>
                <p className="text-xs text-blue-100">Net cash flow</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${profit.toLocaleString()}</div>
                <p className="text-xs text-purple-100">Total profit</p>
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
                  <p className="font-semibold text-slate-700">Loan Amount</p>
                  <p className="text-lg font-bold">${loan.loanAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Net Given</p>
                  <p className="text-lg font-bold">${loan.netGiven.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Daily Pay</p>
                  <p className="text-lg font-bold">${loan.dailyPay.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Status</p>
                  <Badge variant={loan.status === 'Completed' ? 'default' : loan.status === 'Disabled' ? 'destructive' : 'secondary'}>
                    {loan.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collections History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Collection History ({collections.length} transactions)
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
                          <td className="p-2 text-slate-700">{collection.date}</td>
                          <td className="p-2 text-emerald-600 font-bold">${collection.amountPaid.toLocaleString()}</td>
                          <td className="p-2 text-slate-700">{collection.collectedBy}</td>
                          <td className="p-2 text-slate-600">{collection.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No collections recorded yet</p>
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
