
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collection, Loan } from "@/hooks/useFinanceData";
import { Plus, Calendar, DollarSign, TrendingUp, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DailyCollectionsProps {
  collections: Collection[];
  loans: Loan[];
  onAddCollection: (collection: Collection) => void;
}

const DailyCollections: React.FC<DailyCollectionsProps> = ({ collections, loans, onAddCollection }) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    loanId: '',
    customer: '',
    amountPaid: '',
    collectedBy: '',
    remarks: '',
  });

  // Memoize today's date to avoid recalculation
  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Memoize today's collections
  const todaysCollections = useMemo(() => {
    return collections.filter(c => c.date === todayDate);
  }, [collections, todayDate]);

  // Memoize collection summary
  const collectionSummary = useMemo(() => {
    const summary: { [loanId: string]: number } = {};
    collections.forEach(collection => {
      summary[collection.loanId] = (summary[collection.loanId] || 0) + collection.amountPaid;
    });
    return summary;
  }, [collections]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const generate100DaysStatement = (loanId: string) => {
    const selectedLoan = loans.find(loan => loan.id === loanId);
    if (!selectedLoan) return;

    const startDate = new Date();
    const statementData = [];
    
    for (let i = 0; i < 100; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      statementData.push({
        date: currentDate.toISOString().split('T')[0],
        day: i + 1,
        amount: selectedLoan.dailyPay,
        status: 'Pending'
      });
    }

    // Generate and display the statement
    const statementHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>100 Days Collection Statement - ${selectedLoan.customerName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .loan-details { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .summary { margin-top: 20px; background: #e7f3ff; padding: 15px; border-radius: 5px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>100 Days Collection Statement</h1>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
        
        <div class="loan-details">
          <h3>Loan Details</h3>
          <p><strong>Loan ID:</strong> ${selectedLoan.id}</p>
          <p><strong>Customer:</strong> ${selectedLoan.customerName}</p>
          <p><strong>Daily Payment:</strong> ${formatCurrency(selectedLoan.dailyPay)}</p>
          <p><strong>Statement Period:</strong> ${startDate.toLocaleDateString('en-IN')} to ${new Date(startDate.getTime() + 99 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Date</th>
              <th>Amount Due</th>
              <th>Status</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            ${statementData.map(item => `
              <tr>
                <td>${item.day}</td>
                <td>${new Date(item.date).toLocaleDateString('en-IN')}</td>
                <td>${formatCurrency(item.amount)}</td>
                <td>${item.status}</td>
                <td style="width: 100px;"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <h3>Summary</h3>
          <p><strong>Total Amount Expected:</strong> ${formatCurrency(selectedLoan.dailyPay * 100)}</p>
          <p><strong>Total Days:</strong> 100</p>
          <p><strong>Daily Amount:</strong> ${formatCurrency(selectedLoan.dailyPay)}</p>
        </div>
      </body>
      </html>
    `;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(statementHTML);
      newWindow.document.close();
    }

    toast({
      title: "Statement Generated",
      description: "100-day collection statement opened in new window",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.loanId || !formData.amountPaid) {
      toast({
        title: "Validation Error",
        description: "Please fill in Loan ID and Amount Paid",
        variant: "destructive",
      });
      return;
    }

    const selectedLoan = loans.find(loan => loan.id === formData.loanId);
    if (!selectedLoan) {
      toast({
        title: "Error",
        description: "Selected loan not found",
        variant: "destructive",
      });
      return;
    }

    const newCollection: Collection = {
      id: Date.now().toString(),
      date: formData.date || todayDate,
      loanId: formData.loanId,
      customer: formData.customer || selectedLoan.customerName,
      amountPaid: parseFloat(formData.amountPaid),
      collectedBy: formData.collectedBy,
      remarks: formData.remarks,
    };

    onAddCollection(newCollection);
    setFormData({
      date: '',
      loanId: '',
      customer: '',
      amountPaid: '',
      collectedBy: '',
      remarks: '',
    });
    setShowForm(false);
    
    toast({
      title: "Success",
      description: "Collection recorded successfully",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-fill customer name when loan ID is selected
      if (field === 'loanId' && value) {
        const selectedLoan = loans.find(loan => loan.id === value);
        if (selectedLoan) {
          updated.customer = selectedLoan.customerName;
        }
      }
      
      return updated;
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-2 sm:p-4">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Daily Collections</h2>
            <p className="text-emerald-200 text-sm sm:text-base">Record and track daily loan collections</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-white text-emerald-800 hover:bg-emerald-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl font-semibold text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Record Collection
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-white shadow-xl border-0 rounded-xl sm:rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Record New Collection</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <Label htmlFor="date" className="text-sm font-semibold text-slate-700">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="mt-1 border-2 border-slate-200 focus:border-emerald-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="loanId" className="text-sm font-semibold text-slate-700">Loan ID *</Label>
                <Select value={formData.loanId} onValueChange={(value) => handleInputChange('loanId', value)}>
                  <SelectTrigger className="mt-1 border-2 border-slate-200 focus:border-emerald-500 rounded-lg">
                    <SelectValue placeholder="Select loan ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {loans.map((loan) => (
                      <SelectItem key={loan.id} value={loan.id}>
                        {loan.id} - {loan.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="customer" className="text-sm font-semibold text-slate-700">Customer</Label>
                <Input
                  id="customer"
                  value={formData.customer}
                  onChange={(e) => handleInputChange('customer', e.target.value)}
                  placeholder="Customer name"
                  readOnly={!!formData.loanId}
                  className="mt-1 border-2 border-slate-200 focus:border-emerald-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="amountPaid" className="text-sm font-semibold text-slate-700">Amount Paid *</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  value={formData.amountPaid}
                  onChange={(e) => handleInputChange('amountPaid', e.target.value)}
                  placeholder="Enter amount paid"
                  className="mt-1 border-2 border-slate-200 focus:border-emerald-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="collectedBy" className="text-sm font-semibold text-slate-700">Collected By</Label>
                <Input
                  id="collectedBy"
                  value={formData.collectedBy}
                  onChange={(e) => handleInputChange('collectedBy', e.target.value)}
                  placeholder="Collector name"
                  className="mt-1 border-2 border-slate-200 focus:border-emerald-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="remarks" className="text-sm font-semibold text-slate-700">Remarks</Label>
                <Input
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Additional notes"
                  className="mt-1 border-2 border-slate-200 focus:border-emerald-500 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg shadow-lg font-semibold">
                  Record Collection
                </Button>
                {formData.loanId && (
                  <Button 
                    type="button"
                    onClick={() => generate100DaysStatement(formData.loanId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-lg font-semibold"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate 100 Days Statement
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                  className="border-2 border-slate-300 hover:bg-slate-50 px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-white to-emerald-50 shadow-xl border-0 rounded-xl sm:rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
              <DollarSign className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Collection Summary by Loan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              {Object.entries(collectionSummary).map(([loanId, total]) => {
                const loan = loans.find(l => l.id === loanId);
                return (
                  <div key={loanId} className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border-l-4 border-emerald-500">
                    <div className="flex-1">
                      <span className="font-bold text-slate-800 text-sm sm:text-base">{loanId}</span>
                      {loan && <span className="text-xs sm:text-sm text-slate-600 block">({loan.customerName})</span>}
                    </div>
                    <span className="text-emerald-700 font-bold text-sm sm:text-lg">{formatCurrency(total)}</span>
                  </div>
                );
              })}
              {Object.keys(collectionSummary).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No collections recorded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl border-0 rounded-xl sm:rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
              <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Today's Collections ({todayDate})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              {todaysCollections.length > 0 ? (
                <>
                  {todaysCollections.map((collection) => (
                    <div key={collection.id} className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 text-sm sm:text-base">{collection.loanId}</span>
                        <span className="text-xs sm:text-sm text-slate-600 block">({collection.customer})</span>
                        <span className="text-xs text-slate-500">{collection.collectedBy && `by ${collection.collectedBy}`}</span>
                      </div>
                      <span className="text-blue-700 font-bold text-sm sm:text-lg">{formatCurrency(collection.amountPaid)}</span>
                    </div>
                  ))}
                  <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-800 text-sm sm:text-base">Total Today</span>
                      <span className="text-green-800 font-bold text-lg sm:text-xl">
                        {formatCurrency(todaysCollections.reduce((sum, c) => sum + c.amountPaid, 0))}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No collections recorded today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-xl border-0 rounded-xl sm:rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">All Collections History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Date</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Loan ID</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Customer</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Amount Paid</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Collected By</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((collection, index) => (
                  <tr key={collection.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-emerald-50 transition-colors`}>
                    <td className="p-3 sm:p-4 text-slate-700 border-b border-slate-100 text-sm">{collection.date}</td>
                    <td className="p-3 sm:p-4 font-semibold text-slate-800 border-b border-slate-100 text-sm">{collection.loanId}</td>
                    <td className="p-3 sm:p-4 text-slate-700 border-b border-slate-100 text-sm">{collection.customer}</td>
                    <td className="p-3 sm:p-4 text-emerald-600 font-bold border-b border-slate-100 text-sm">{formatCurrency(collection.amountPaid)}</td>
                    <td className="p-3 sm:p-4 text-slate-700 border-b border-slate-100 text-sm">{collection.collectedBy}</td>
                    <td className="p-3 sm:p-4 text-slate-600 border-b border-slate-100 text-sm">{collection.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {collections.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg">No collections recorded yet</p>
                <p className="text-sm">Record your first collection above to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyCollections;
