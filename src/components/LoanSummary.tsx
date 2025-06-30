import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loan, Collection } from "@/hooks/useFinanceData";
import { Plus, Trash2, Power, Eye, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoanCashFlowModal from "./LoanCashFlowModal";

interface LoanSummaryProps {
  loans: Loan[];
  collections: Collection[];
  onAddLoan: (loan: Omit<Loan, 'totalToReceive' | 'collected' | 'balance' | 'status' | 'profit'>) => void;
  onUpdateLoan: (loanId: string, updates: Partial<Loan>) => void;
  deleteLoan: (loanId: string) => void;
  toggleLoanStatus: (loanId: string) => void;
  getLoanCashFlow: (loanId: string) => any;
  addBulkCollection: (loanId: string, collectedBy: string, remarks: string) => void;
}

const LoanSummary: React.FC<LoanSummaryProps> = ({ 
  loans, 
  collections, 
  onAddLoan, 
  onUpdateLoan, 
  deleteLoan, 
  toggleLoanStatus, 
  getLoanCashFlow,
  addBulkCollection
}) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [showCashFlow, setShowCashFlow] = useState(false);
  const [bulkCollectionData, setBulkCollectionData] = useState({
    loanId: '',
    collectedBy: '',
    remarks: '',
  });
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    customerName: '',
    date: '',
    loanAmount: '',
    deduction: '',
    dailyPay: '',
    days: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleBulkCollection = (loanId: string) => {
    setBulkCollectionData({ loanId, collectedBy: '', remarks: '' });
    setShowBulkForm(true);
  };

  const submitBulkCollection = () => {
    if (!bulkCollectionData.loanId) return;
    
    addBulkCollection(
      bulkCollectionData.loanId, 
      bulkCollectionData.collectedBy, 
      bulkCollectionData.remarks || '100 days bulk collection'
    );
    
    setShowBulkForm(false);
    setBulkCollectionData({ loanId: '', collectedBy: '', remarks: '' });
    
    toast({
      title: "Success",
      description: "Bulk collection completed successfully",
    });
  };

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

  const handleDelete = (loanId: string, customerName: string) => {
    if (window.confirm(`Are you sure you want to delete the loan for ${customerName}? This action cannot be undone.`)) {
      deleteLoan(loanId);
      toast({
        title: "Success",
        description: "Loan deleted successfully",
      });
    }
  };

  const handleToggleStatus = (loanId: string, currentStatus: string) => {
    toggleLoanStatus(loanId);
    toast({
      title: "Success",
      description: `Loan ${currentStatus === 'Disabled' ? 'enabled' : 'disabled'} successfully`,
    });
  };

  const handleViewCashFlow = (loanId: string) => {
    setSelectedLoanId(loanId);
    setShowCashFlow(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 shadow-2xl text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Loan Management</h2>
            <p className="text-purple-100">Comprehensive loan tracking and management</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setShowBulkForm(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold"
            >
              <Zap className="mr-2 h-5 w-5" />
              Bulk Collection
            </Button>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-white text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-xl shadow-lg font-semibold"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add New Loan
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Collection Modal */}
      {showBulkForm && (
        <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <CardTitle className="text-xl">100 Days Bulk Collection</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label>Select Loan</Label>
                <select 
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  value={bulkCollectionData.loanId}
                  onChange={(e) => setBulkCollectionData(prev => ({ ...prev, loanId: e.target.value }))}
                >
                  <option value="">Select a loan</option>
                  {loans.filter(loan => loan.balance > 0).map(loan => (
                    <option key={loan.id} value={loan.id}>
                      {loan.id} - {loan.customerName} (Balance: {formatCurrency(loan.balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Collected By</Label>
                <Input
                  value={bulkCollectionData.collectedBy}
                  onChange={(e) => setBulkCollectionData(prev => ({ ...prev, collectedBy: e.target.value }))}
                  placeholder="Enter collector name"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label>Remarks</Label>
                <Input
                  value={bulkCollectionData.remarks}
                  onChange={(e) => setBulkCollectionData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Additional notes"
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={submitBulkCollection}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl"
                  disabled={!bulkCollectionData.loanId}
                >
                  Complete Collection
                </Button>
                <Button 
                  onClick={() => setShowBulkForm(false)}
                  variant="outline"
                  className="px-6 py-2 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Enhanced Loans Table */}
      <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
          <CardTitle className="text-xl">All Loans</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full table-auto min-w-[1400px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Actions</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Loan ID</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Customer</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Date</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Amount</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Net Given</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Daily Pay</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Days</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Total to Receive</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Collected</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Balance</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Status</th>
                  <th className="text-left p-4 font-semibold text-slate-700 border-b">Expected Profit</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan, index) => (
                  <tr key={loan.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors ${loan.isDisabled ? 'opacity-60' : ''}`}>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleBulkCollection(loan.id)}
                          className="h-8 w-8 p-0 bg-emerald-500 hover:bg-emerald-600 text-white"
                          title="100 Days Collection"
                          disabled={loan.balance <= 0}
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewCashFlow(loan.id)}
                          className="h-8 w-8 p-0"
                          title="View Cash Flow"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(loan.id, loan.status)}
                          className={`h-8 w-8 p-0 ${loan.isDisabled ? 'text-green-600 hover:text-green-700' : 'text-orange-600 hover:text-orange-700'}`}
                          title={loan.isDisabled ? 'Enable Loan' : 'Disable Loan'}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(loan.id, loan.customerName)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Delete Loan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-800">{loan.id}</td>
                    <td className="p-4 text-slate-700">{loan.customerName}</td>
                    <td className="p-4 text-slate-600">{loan.date}</td>
                    <td className="p-4 text-slate-700 font-semibold">{formatCurrency(loan.loanAmount)}</td>
                    <td className="p-4 text-blue-600 font-semibold">{formatCurrency(loan.netGiven)}</td>
                    <td className="p-4 text-slate-700">{formatCurrency(loan.dailyPay)}</td>
                    <td className="p-4 text-slate-700">{loan.days}</td>
                    <td className="p-4 text-purple-600 font-semibold">{formatCurrency(loan.totalToReceive)}</td>
                    <td className="p-4 text-emerald-600 font-bold">{formatCurrency(loan.collected)}</td>
                    <td className="p-4 text-red-600 font-bold">{formatCurrency(loan.balance)}</td>
                    <td className="p-4">
                      <Badge variant={
                        loan.status === 'Completed' ? 'default' : 
                        loan.status === 'Disabled' ? 'destructive' : 
                        'secondary'
                      }>
                        {loan.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-indigo-600 font-bold">{formatCurrency(loan.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loans.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Wallet className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg">No loans recorded yet</p>
                <p className="text-sm">Add your first loan above to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <LoanCashFlowModal 
        isOpen={showCashFlow}
        onClose={() => setShowCashFlow(false)}
        loanId={selectedLoanId}
        getLoanCashFlow={getLoanCashFlow}
      />
    </div>
  );
};

export default LoanSummary;
