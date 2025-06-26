
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fund } from "@/hooks/useFinanceData";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FundTrackerProps {
  funds: Fund[];
  onAddFund: (fund: Omit<Fund, 'balance'>) => void;
}

const FundTracker: React.FC<FundTrackerProps> = ({ funds, onAddFund }) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [initialBalance, setInitialBalance] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    inflow: '',
    outflow: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || (!formData.inflow && !formData.outflow)) {
      toast({
        title: "Validation Error",
        description: "Please fill in description and at least one amount field",
        variant: "destructive",
      });
      return;
    }

    const newFund = {
      id: Date.now().toString(),
      date: formData.date || new Date().toISOString().split('T')[0],
      description: formData.description,
      inflow: parseFloat(formData.inflow) || 0,
      outflow: parseFloat(formData.outflow) || 0,
    };

    onAddFund(newFund);
    setFormData({
      date: '',
      description: '',
      inflow: '',
      outflow: '',
    });
    setShowForm(false);
    
    toast({
      title: "Success",
      description: "Fund transaction recorded successfully",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInitialBalance = () => {
    if (!initialBalance) {
      toast({
        title: "Validation Error",
        description: "Please enter an initial balance",
        variant: "destructive",
      });
      return;
    }

    const newFund = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: 'Initial Balance',
      inflow: parseFloat(initialBalance),
      outflow: 0,
    };

    onAddFund(newFund);
    setInitialBalance('');
    
    toast({
      title: "Success",
      description: "Initial balance set successfully",
    });
  };

  const currentBalance = funds.length > 0 ? funds[funds.length - 1].balance : 0;
  const totalInflow = funds.reduce((sum, fund) => sum + fund.inflow, 0);
  const totalOutflow = funds.reduce((sum, fund) => sum + fund.outflow, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fund Tracker</h2>
          <p className="text-slate-600">Track your financial inflows and outflows</p>
        </div>
        <div className="flex gap-2">
          {funds.length === 0 && (
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="Initial balance"
                className="w-40"
              />
              <Button onClick={handleInitialBalance} variant="outline">
                Set Initial Balance
              </Button>
            </div>
          )}
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              ${currentBalance.toLocaleString()}
            </div>
            <p className="text-xs text-slate-600 mt-1">Available funds</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Inflow</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${totalInflow.toLocaleString()}
            </div>
            <p className="text-xs text-slate-600 mt-1">Money received</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Outflow</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalOutflow.toLocaleString()}
            </div>
            <p className="text-xs text-slate-600 mt-1">Money spent</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Add Fund Transaction</CardTitle>
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
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter transaction description"
                />
              </div>
              <div>
                <Label htmlFor="inflow">Inflow (Money In)</Label>
                <Input
                  id="inflow"
                  type="number"
                  step="0.01"
                  value={formData.inflow}
                  onChange={(e) => handleInputChange('inflow', e.target.value)}
                  placeholder="Enter inflow amount"
                />
              </div>
              <div>
                <Label htmlFor="outflow">Outflow (Money Out)</Label>
                <Input
                  id="outflow"
                  type="number"
                  step="0.01"
                  value={formData.outflow}
                  onChange={(e) => handleInputChange('outflow', e.target.value)}
                  placeholder="Enter outflow amount"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Add Transaction
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
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-2 font-semibold text-slate-700">Date</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Description</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Inflow</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Outflow</th>
                  <th className="text-left p-2 font-semibold text-slate-700">Balance</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((fund) => (
                  <tr key={fund.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2 text-slate-700">{fund.date}</td>
                    <td className="p-2 text-slate-800">{fund.description}</td>
                    <td className="p-2 text-emerald-600 font-medium">
                      {fund.inflow > 0 ? `$${fund.inflow.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-2 text-red-600 font-medium">
                      {fund.outflow > 0 ? `$${fund.outflow.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-2 text-slate-800 font-medium">${fund.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {funds.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No transactions recorded yet. Set an initial balance or add your first transaction above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundTracker;
