import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fund, Loan, Collection } from "@/hooks/useFinanceData";
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertTriangle, PieChart, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FundTrackerProps {
  funds: Fund[];
  loans: Loan[];
  collections: Collection[];
  onAddFund: (fund: Omit<Fund, 'balance'>) => void;
}

interface TransactionRow {
  id: string;
  date: string;
  description: string;
  inflow: number;
  outflow: number;
  balance: number;
  type: 'manual' | 'loan' | 'collection' | 'opening';
}

const FundTracker: React.FC<FundTrackerProps> = ({ funds, loans, collections, onAddFund }) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [initialBalance, setInitialBalance] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    inflow: '',
    outflow: '',
  });

  // Generate complete transaction history with proper balance calculation
  const transactionHistory = useMemo(() => {
    const transactions: TransactionRow[] = [];
    
    // Add manual fund entries
    funds.forEach(fund => {
      transactions.push({
        id: fund.id,
        date: fund.date,
        description: fund.description,
        inflow: fund.inflow,
        outflow: fund.outflow,
        balance: 0, // Will be calculated later
        type: fund.description === 'Initial Balance' ? 'opening' : 'manual'
      });
    });

    // Add loan disbursements as outflows (using netGiven - actual cash out)
    loans.forEach(loan => {
      transactions.push({
        id: `loan-${loan.id}`,
        date: loan.date,
        description: `Loan disbursed to ${loan.customerName} (ID: ${loan.id})`,
        inflow: 0,
        outflow: loan.netGiven, // Use netGiven (actual cash given)
        balance: 0,
        type: 'loan'
      });
    });

    // Group collections by date and add as inflows
    const collectionsByDate = collections.reduce((acc, collection) => {
      if (!acc[collection.date]) {
        acc[collection.date] = [];
      }
      acc[collection.date].push(collection);
      return acc;
    }, {} as { [date: string]: Collection[] });

    Object.entries(collectionsByDate).forEach(([date, dayCollections]) => {
      const totalAmount = dayCollections.reduce((sum, c) => sum + c.amountPaid, 0);
      const loanIds = [...new Set(dayCollections.map(c => c.loanId))];
      
      transactions.push({
        id: `collection-${date}`,
        date,
        description: `Daily collections from ${loanIds.length} loan(s): ${loanIds.join(', ')}`,
        inflow: totalAmount,
        outflow: 0,
        balance: 0,
        type: 'collection'
      });
    });

    // Sort by date and time (if available)
    transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      // If same date, prioritize order: opening -> manual -> loan -> collection
      const typeOrder = { opening: 0, manual: 1, loan: 2, collection: 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    // Calculate running balance
    let runningBalance = 0;
    transactions.forEach(transaction => {
      runningBalance += transaction.inflow - transaction.outflow;
      transaction.balance = runningBalance;
    });

    return transactions;
  }, [funds, loans, collections]);

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
      description: "Manual transaction recorded successfully",
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
      id: `initial-${Date.now()}`,
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

  const currentBalance = transactionHistory.length > 0 ? transactionHistory[transactionHistory.length - 1].balance : 0;
  const totalInflow = transactionHistory.reduce((sum, t) => sum + t.inflow, 0);
  const totalOutflow = transactionHistory.reduce((sum, t) => sum + t.outflow, 0);
  const negativeBalanceDays = transactionHistory.filter(t => t.balance < 0).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'loan': return '📤';
      case 'collection': return '💰';
      case 'opening': return '🏦';
      default: return '✏️';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'loan': return 'text-red-600 bg-red-50';
      case 'collection': return 'text-emerald-600 bg-emerald-50';
      case 'opening': return 'text-blue-600 bg-blue-50';
      default: return 'text-purple-600 bg-purple-50';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-1">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Fund Tracker</h2>
            <p className="text-indigo-200 text-sm sm:text-base">Automated cash flow tracking with real-time balance updates</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {transactionHistory.length === 0 && (
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <Input
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="Initial balance"
                  className="w-full sm:w-40 bg-white/10 border-white/20 text-white placeholder-white/60"
                />
                <Button onClick={handleInitialBalance} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 whitespace-nowrap">
                  Set Initial Balance
                </Button>
              </div>
            )}
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-white text-indigo-800 hover:bg-indigo-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl font-semibold whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Add Manual Entry
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-semibold text-white/90">Current Balance</CardTitle>
            <div className="p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-sm">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
              ${currentBalance.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Available cash</p>
            {currentBalance < 0 && (
              <p className="text-xs text-red-200 flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Negative balance
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-semibold text-white/90">Total Inflow</CardTitle>
            <div className="p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-sm">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
              ${totalInflow.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Money received</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-pink-700 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-semibold text-white/90">Total Outflow</CardTitle>
            <div className="p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-sm">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
              ${totalOutflow.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Money disbursed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-semibold text-white/90">Risk Days</CardTitle>
            <div className="p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
              {negativeBalanceDays}
            </div>
            <p className="text-xs text-white/80">Negative balance days</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="bg-white shadow-2xl border-0 rounded-xl sm:rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <CardTitle className="text-lg sm:text-xl">Add Manual Transaction</CardTitle>
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
                  className="mt-1 border-2 border-slate-200 focus:border-purple-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter transaction description"
                  className="mt-1 border-2 border-slate-200 focus:border-purple-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="inflow" className="text-sm font-semibold text-slate-700">Inflow (Money In)</Label>
                <Input
                  id="inflow"
                  type="number"
                  step="0.01"
                  value={formData.inflow}
                  onChange={(e) => handleInputChange('inflow', e.target.value)}
                  placeholder="Enter inflow amount"
                  className="mt-1 border-2 border-slate-200 focus:border-purple-500 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="outflow" className="text-sm font-semibold text-slate-700">Outflow (Money Out)</Label>
                <Input
                  id="outflow"
                  type="number"
                  step="0.01"
                  value={formData.outflow}
                  onChange={(e) => handleInputChange('outflow', e.target.value)}
                  placeholder="Enter outflow amount"
                  className="mt-1 border-2 border-slate-200 focus:border-purple-500 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow-lg font-semibold">
                  Add Transaction
                </Button>
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

      {/* Transaction History */}
      <Card className="bg-white shadow-2xl border-0 rounded-xl sm:rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <CardTitle className="text-lg sm:text-xl flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            Complete Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Date</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Type</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Description</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Inflow</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Outflow</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 border-b text-sm">Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactionHistory.map((transaction, index) => (
                  <tr key={transaction.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="p-3 sm:p-4 text-slate-700 border-b border-slate-100 text-sm">{transaction.date}</td>
                    <td className="p-3 sm:p-4 border-b border-slate-100">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                        <span className="mr-1">{getTypeIcon(transaction.type)}</span>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-slate-800 border-b border-slate-100 max-w-xs truncate text-sm" title={transaction.description}>
                      {transaction.description}
                    </td>
                    <td className="p-3 sm:p-4 border-b border-slate-100 text-sm">
                      {transaction.inflow > 0 ? (
                        <span className="text-emerald-600 font-bold">${transaction.inflow.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 border-b border-slate-100 text-sm">
                      {transaction.outflow > 0 ? (
                        <span className="text-red-600 font-bold">${transaction.outflow.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 border-b border-slate-100 text-sm">
                      <span className={`font-bold ${transaction.balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        ${transaction.balance.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactionHistory.length === 0 && (
              <div className="text-center py-8 sm:py-12 text-slate-500">
                <PieChart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-slate-300" />
                <p className="text-base sm:text-lg">No transactions recorded yet</p>
                <p className="text-sm">Set an initial balance or add your first transaction above to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundTracker;
