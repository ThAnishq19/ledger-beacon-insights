
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loan } from "@/hooks/useFinanceData";
import { Zap, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnhancedBulkCollectionProps {
  loans: Loan[];
  onClose: () => void;
  addBulkCollection: (loanId: string, collectedBy: string, remarks: string) => void;
  addCollection: (collection: any) => void;
}

const EnhancedBulkCollection: React.FC<EnhancedBulkCollectionProps> = ({
  loans,
  onClose,
  addBulkCollection,
  addCollection
}) => {
  const { toast } = useToast();
  const [bulkCollectionData, setBulkCollectionData] = useState({
    loanId: '',
    collectedBy: '',
    remarks: '',
    customAmount: '',
    collectionType: '100days' as '100days' | 'custom'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const selectedLoan = loans.find(loan => loan.id === bulkCollectionData.loanId);
  const maxCollectionAmount = selectedLoan ? selectedLoan.balance : 0;

  const handleSubmit = () => {
    if (!bulkCollectionData.loanId) {
      toast({
        title: "Error",
        description: "Please select a loan",
        variant: "destructive",
      });
      return;
    }

    if (bulkCollectionData.collectionType === '100days') {
      addBulkCollection(
        bulkCollectionData.loanId,
        bulkCollectionData.collectedBy,
        bulkCollectionData.remarks || '100 days bulk collection'
      );
    } else {
      const customAmount = parseFloat(bulkCollectionData.customAmount);
      if (!customAmount || customAmount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      if (customAmount > maxCollectionAmount) {
        toast({
          title: "Error",
          description: `Amount cannot exceed balance of ${formatCurrency(maxCollectionAmount)}`,
          variant: "destructive",
        });
        return;
      }

      const newCollection = {
        id: `custom-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        loanId: bulkCollectionData.loanId,
        customer: selectedLoan?.customerName || '',
        amountPaid: customAmount,
        collectedBy: bulkCollectionData.collectedBy || 'System',
        remarks: bulkCollectionData.remarks || `Custom collection of ${formatCurrency(customAmount)}`,
      };

      addCollection(newCollection);
    }

    onClose();
    setBulkCollectionData({
      loanId: '',
      collectedBy: '',
      remarks: '',
      customAmount: '',
      collectionType: '100days'
    });

    toast({
      title: "Success",
      description: "Collection completed successfully",
    });
  };

  return (
    <Card className="bg-white shadow-2xl border-0 rounded-3xl overflow-hidden max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8">
        <CardTitle className="text-2xl font-bold flex items-center">
          <Zap className="mr-3 h-8 w-8" />
          Enhanced Bulk Collection
        </CardTitle>
        <p className="text-emerald-100 mt-2">Process payments efficiently with flexible options</p>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {/* Loan Selection */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold text-slate-700">Select Loan</Label>
          <select 
            className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-lg"
            value={bulkCollectionData.loanId}
            onChange={(e) => setBulkCollectionData(prev => ({ ...prev, loanId: e.target.value }))}
          >
            <option value="">Choose a loan to collect payment</option>
            {loans.filter(loan => loan.balance > 0).map(loan => (
              <option key={loan.id} value={loan.id}>
                {loan.id} - {loan.customerName} (Balance: {formatCurrency(loan.balance)})
              </option>
            ))}
          </select>
        </div>

        {/* Collection Type Selection */}
        {selectedLoan && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-slate-700">Collection Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setBulkCollectionData(prev => ({ ...prev, collectionType: '100days' }))}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  bulkCollectionData.collectionType === '100days'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                }`}
              >
                <Zap className="h-6 w-6 mx-auto mb-2" />
                <div className="font-semibold">100 Days Collection</div>
                <div className="text-sm mt-1">Collect full balance</div>
                <div className="text-lg font-bold mt-2">{formatCurrency(selectedLoan.balance)}</div>
              </button>
              
              <button
                onClick={() => setBulkCollectionData(prev => ({ ...prev, collectionType: 'custom' }))}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  bulkCollectionData.collectionType === 'custom'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                }`}
              >
                <Calculator className="h-6 w-6 mx-auto mb-2" />
                <div className="font-semibold">Custom Amount</div>
                <div className="text-sm mt-1">Enter specific amount</div>
                <div className="text-lg font-bold mt-2">Flexible</div>
              </button>
            </div>
          </div>
        )}

        {/* Custom Amount Input */}
        {bulkCollectionData.collectionType === 'custom' && selectedLoan && (
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-slate-700">Collection Amount</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                max={maxCollectionAmount}
                value={bulkCollectionData.customAmount}
                onChange={(e) => setBulkCollectionData(prev => ({ ...prev, customAmount: e.target.value }))}
                placeholder="Enter amount to collect"
                className="text-lg p-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                Max: {formatCurrency(maxCollectionAmount)}
              </div>
            </div>
            {bulkCollectionData.customAmount && parseFloat(bulkCollectionData.customAmount) > maxCollectionAmount && (
              <p className="text-red-500 text-sm">Amount exceeds available balance</p>
            )}
          </div>
        )}

        {/* Collector Information */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold text-slate-700">Collected By</Label>
          <Input
            value={bulkCollectionData.collectedBy}
            onChange={(e) => setBulkCollectionData(prev => ({ ...prev, collectedBy: e.target.value }))}
            placeholder="Enter collector name"
            className="text-lg p-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold text-slate-700">Remarks</Label>
          <Input
            value={bulkCollectionData.remarks}
            onChange={(e) => setBulkCollectionData(prev => ({ ...prev, remarks: e.target.value }))}
            placeholder="Additional notes (optional)"
            className="text-lg p-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Summary Card */}
        {selectedLoan && (
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-2xl border border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-3">Collection Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Customer:</span>
                <span className="font-semibold">{selectedLoan.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Current Balance:</span>
                <span className="font-semibold">{formatCurrency(selectedLoan.balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Collection Amount:</span>
                <span className="font-bold text-emerald-600">
                  {bulkCollectionData.collectionType === '100days' 
                    ? formatCurrency(selectedLoan.balance)
                    : bulkCollectionData.customAmount 
                      ? formatCurrency(parseFloat(bulkCollectionData.customAmount))
                      : '₹0'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Remaining Balance:</span>
                <span className="font-semibold">
                  {bulkCollectionData.collectionType === '100days' 
                    ? '₹0'
                    : bulkCollectionData.customAmount 
                      ? formatCurrency(selectedLoan.balance - parseFloat(bulkCollectionData.customAmount || '0'))
                      : formatCurrency(selectedLoan.balance)
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <Button 
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 hover:shadow-xl"
            disabled={!bulkCollectionData.loanId || (bulkCollectionData.collectionType === 'custom' && (!bulkCollectionData.customAmount || parseFloat(bulkCollectionData.customAmount) > maxCollectionAmount))}
          >
            <Zap className="mr-2 h-5 w-5" />
            Complete Collection
          </Button>
          <Button 
            onClick={onClose}
            variant="outline"
            className="px-8 py-4 rounded-2xl font-semibold text-lg border-2"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedBulkCollection;
