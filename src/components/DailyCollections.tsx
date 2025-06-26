
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collection, Loan } from "@/hooks/useFinanceData";
import { Plus } from "lucide-react";
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
      date: formData.date || new Date().toISOString().split('T')[0],
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

  const getCollectionSummary = () => {
    const summary: { [loanId: string]: number } = {};
    collections.forEach(collection => {
      summary[collection.loanId] = (summary[collection.loanId] || 0) + collection.amountPaid;
    });
    return summary;
  };

  const collectionSummary = getCollectionSummary();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Daily Collections</h2>
          <p className="text-slate-600">Record daily loan collections and payments</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Record Collection
        </Button>
      </div>

      {showForm && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Record New Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="loanId">Loan ID *</Label>
                <Select value={formData.loanId} onValueChange={(value) => handleInputChange('loanId', value)}>
                  <SelectTrigger>
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
                <Label htmlFor="customer">Customer</Label>
                <Input
                  id="customer"
                  value={formData.customer}
                  onChange={(e) => handleInputChange('customer', e.target.value)}
                  placeholder="Customer name"
                  readOnly={!!formData.loanId}
                />
              </div>
              <div>
                <Label htmlFor="amountPaid">Amount Paid *</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  value={formData.amountPaid}
                  onChange={(e) => handleInputChange('amountPaid', e.target.value)}
                  placeholder="Enter amount paid"
                />
              </div>
              <div>
                <Label htmlFor="collectedBy">Collected By</Label>
                <Input
                  id="collectedBy"
                  value={formData.collectedBy}
                  onChange={(e) => handleInputChange('collectedBy', e.target.value)}
                  placeholder="Collector name"
                />
              </div>
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Input
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Additional notes"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Record Collection
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Collection Summary by Loan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(collectionSummary).map(([loanId, total]) => {
                const loan = loans.find(l => l.id === loanId);
                return (
                  <div key={loanId} className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-medium text-slate-800">{loanId}</span>
                      {loan && <span className="text-sm text-slate-600 ml-2">({loan.customerName})</span>}
                    </div>
                    <span className="text-emerald-600 font-semibold">${total.toLocaleString()}</span>
                  </div>
                );
              })}
              {Object.keys(collectionSummary).length === 0 && (
                <div className="text-center py-4 text-slate-500">
                  No collections recorded yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Today's Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {collections
                .filter(c => c.date === new Date().toISOString().split('T')[0])
                .slice(-5)
                .map((collection) => (
                  <div key={collection.id} className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-medium text-slate-800">{collection.loanId}</span>
                      <span className="text-sm text-slate-600 ml-2">({collection.customer})</span>
                    </div>
                    <span className="text-emerald-600 font-semibold">${collection.amountPaid.toLocaleString()}</span>
                  </div>
                ))}
              {collections.filter(c => c.date === new Date().toISOString().split('T')[0]).length === 0 && (
                <div className="text-center py-4 text-slate-500">
                  No collections today
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle>All Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-2 font-semibold text-slate-700">Date</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Loan ID</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Customer</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Amount Paid</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Collected By</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((collection) => (
                  <tr key={collection.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2 text-slate-700">{collection.date}</td>
                    <td className="p-2 font-medium text-slate-800">{collection.loanId}</td>
                    <td className="p-2 text-slate-700">{collection.customer}</td>
                    <td className="p-2 text-emerald-600 font-medium">${collection.amountPaid.toLocaleString()}</td>
                    <td className="p-2 text-slate-700">{collection.collectedBy}</td>
                    <td className="p-2 text-slate-600">{collection.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {collections.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No collections recorded yet. Record your first collection above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyCollections;
