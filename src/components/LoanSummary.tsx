
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loan, Collection } from "@/hooks/useFinanceData";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoanSummaryProps {
  loans: Loan[];
  collections: Collection[];
  onAddLoan: (loan: Omit<Loan, 'totalToReceive' | 'collected' | 'balance' | 'status' | 'profit'>) => void;
  onUpdateLoan: (loanId: string, updates: Partial<Loan>) => void;
}

const LoanSummary: React.FC<LoanSummaryProps> = ({ loans, collections, onAddLoan, onUpdateLoan }) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    customerName: '',
    date: '',
    loanAmount: '',
    deduction: '',
    dailyPay: '',
    days: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id || !formData.customerName || !formData.loanAmount || !formData.dailyPay || !formData.days) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const loanAmount = parseFloat(formData.loanAmount);
    const deduction = parseFloat(formData.deduction) || 0;
    const netGiven = loanAmount - deduction;

    const newLoan = {
      id: formData.id,
      customerName: formData.customerName,
      date: formData.date || new Date().toISOString().split('T')[0],
      loanAmount: loanAmount,
      deduction: deduction,
      netGiven: netGiven,
      dailyPay: parseFloat(formData.dailyPay),
      days: parseInt(formData.days),
    };

    onAddLoan(newLoan);
    setFormData({
      id: '',
      customerName: '',
      date: '',
      loanAmount: '',
      deduction: '',
      dailyPay: '',
      days: '',
    });
    setShowForm(false);
    
    toast({
      title: "Success",
      description: "Loan added successfully",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Loan Summary</h2>
          <p className="text-slate-600">Manage and track all loan records</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Loan
        </Button>
      </div>

      {showForm && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Add New Loan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loanId">Loan ID *</Label>
                <Input
                  id="loanId"
                  value={formData.id}
                  onChange={(e) => handleInputChange('id', e.target.value)}
                  placeholder="Enter loan ID"
                />
              </div>
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="loanAmount">Loan Amount *</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  step="0.01"
                  value={formData.loanAmount}
                  onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                  placeholder="Enter loan amount"
                />
              </div>
              <div>
                <Label htmlFor="deduction">Deduction</Label>
                <Input
                  id="deduction"
                  type="number"
                  step="0.01"
                  value={formData.deduction}
                  onChange={(e) => handleInputChange('deduction', e.target.value)}
                  placeholder="Enter deduction (optional)"
                />
              </div>
              <div>
                <Label htmlFor="dailyPay">Daily Pay *</Label>
                <Input
                  id="dailyPay"
                  type="number"
                  step="0.01"
                  value={formData.dailyPay}
                  onChange={(e) => handleInputChange('dailyPay', e.target.value)}
                  placeholder="Enter daily payment"
                />
              </div>
              <div>
                <Label htmlFor="days">Days *</Label>
                <Input
                  id="days"
                  type="number"
                  value={formData.days}
                  onChange={(e) => handleInputChange('days', e.target.value)}
                  placeholder="Enter number of days"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Add Loan
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle>All Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-2 font-semibold text-slate-700">Loan ID</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Customer</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Date</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Amount</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Net Given</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Daily Pay</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Days</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Total to Receive</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Collected</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Balance</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Status</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Profit</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2 font-medium text-slate-800">{loan.id}</td>
                    <td className="p-2 text-slate-700">{loan.customerName}</td>
                    <td className="p-2 text-slate-600">{loan.date}</td>
                    <td className="p-2 text-slate-700">${loan.loanAmount.toLocaleString()}</td>
                    <td className="p-2 text-slate-700">${loan.netGiven.toLocaleString()}</td>
                    <td className="p-2 text-slate-700">${loan.dailyPay.toLocaleString()}</td>
                    <td className="p-2 text-slate-700">{loan.days}</td>
                    <td className="p-2 text-slate-700">${loan.totalToReceive.toLocaleString()}</td>
                    <td className="p-2 text-emerald-600 font-medium">${loan.collected.toLocaleString()}</td>
                    <td className="p-2 text-red-600 font-medium">${loan.balance.toLocaleString()}</td>
                    <td className="p-2">
                      <Badge variant={loan.status === 'Completed' ? 'default' : 'secondary'}>
                        {loan.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-purple-600 font-medium">${loan.profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loans.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No loans recorded yet. Add your first loan above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanSummary;
