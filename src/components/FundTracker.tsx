
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
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    inflow: '',
    outflow: '',
  });

  // Simplified and optimized transaction history calculation
  const transactionHistory = useMemo(() => {
    console.log('Calculating transaction history...');
    
    try {
      const transactions: TransactionRow[] = [];
      
      // Add fund entries
      if (funds && Array.isArray(funds)) {
        funds.forEach(fund => {
          transactions.push({
            id: fund.id,
            date: fund.date,
            description: fund.description,
            inflow: fund.inflow || 0,
            outflow: fund.outflow || 0,
            balance: 0,
            type: fund.description === 'Initial Balance' ? 'opening' : 'manual'
          });
        });
      }

      // Add loan disbursements (only enabled loans)
      if (loans && Array.isArray(loans)) {
        loans
          .filter(loan => loan && !loan.isDisabled)
          .forEach(loan => {
            transactions.push({
              id: `loan-${loan.id}`,
              date: loan.date,
              description: `Loan to ${loan.customerName}`,
              inflow: 0,
              outflow: loan.netGiven || 0,
              balance: 0,
              type: 'loan'
            });
          });
      }

      // Add collections by date
      if (collections && Array.isArray(collections)) {
        const collectionsByDate = new Map<string, Collection[]>();
        
        collections.forEach(collection => {
          if (collection && collection.date) {
            const existing = collectionsByDate.get(collection.date) || [];
            existing.push(collection);
            collectionsByDate.set(collection.date, existing);
          }
        });

        collectionsByDate.forEach((dayCollections, date) => {
          const totalAmount = dayCollections.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
          
          transactions.push({
            id: `collection-${date}`,
            date,
            description: `Daily collections (${dayCollections.length} payments)`,
            inflow: totalAmount,
            outflow: 0,
            balance: 0,
            type: 'collection'
          });
        });
      }

      // Sort by date
      transactions.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });

      // Calculate running balance
      let runningBalance = 0;
      transactions.forEach(transaction => {
        runningBalance += (transaction.inflow || 0) - (transaction.outflow || 0);
        transaction.balance = runningBalance;
      });

      console.log('Transaction history calculated successfully');
      return transactions;
    } catch (error) {
      console.error('Error calculating transaction history:', error);
      return [];
    }
  }, [funds?.length, loans?.length, collections?.length]); // Use length instead of full arrays

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
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
        description: "Transaction recorded successfully",
      });
    } catch (error) {
      console.error('Error adding fund:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialBalance = async () => {
    if (!initialBalance) {
      toast({
        title: "Validation Error",
        description: "Please enter an initial balance",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
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
    } catch (error) {
      console.error('Error setting initial balance:', error);
      toast({
        title: "Error",
        description: "Failed to set initial balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary metrics safely
  const currentBalance = transactionHistory.length > 0 ? transactionHistory[transactionHistory.length - 1].balance : 0;
  const totalInflow = transactionHistory.reduce((sum, t) => sum + (t.inflow || 0), 0);
  const totalOutflow = transactionHistory.reduce((sum, t) => sum + (t.outflow || 0), 0);
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
    <div className="space-y-6 p-4">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900 rounded-2xl p-6 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">Fund Tracker</h2>
            <p className="text-indigo-200">Automated cash flow tracking with real-time balance updates</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {transactionHistory.length === 0 && (
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="Initial balance"
                  className="w-40 bg-white/10 border-white/20 text-white placeholder-white/60"
                />
                <Button 
                  onClick={handleInitialBalance} 
                  variant="outline" 
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  disabled={isLoading}
                >
                  Set Balance
                </Button>
              </div>
            )}
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-white text-indigo-800 hover:bg-indigo-50 px-6 py-3 rounded-lg shadow-lg font-semibold"
              disabled={isLoading}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Transaction
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Current Balance</CardTitle>
            <DollarSign className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">${currentBalance.toLocaleString()}</div>
            <p className="text-xs text-white/80">Available cash</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Total Inflow</CardTitle>
            <TrendingUp className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">${totalInflow.toLocaleString()}</div>
            <p className="text-xs text-white/80">Money received</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-pink-700 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Total Outflow</CardTitle>
            <TrendingDown className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">${totalOutflow.toLocaleString()}</div>
            <p className="text-xs text-white/80">Money disbursed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Risk Days</CardTitle>
            <AlertTriangle className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{negativeBalanceDays}</div>
            <p className="text-xs text-white/80">Negative balance days</p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Transaction Form */}
      {showForm && (
        <Card className="bg-white shadow-2xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <CardTitle>Add Manual Transaction</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter transaction description"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="inflow">Inflow (Money In)</Label>
                <Input
                  id="inflow"
                  type="number"
                  step="0.01"
                  value={formData.inflow}
                  onChange={(e) => setFormData(prev => ({ ...prev, inflow: e.target.value }))}
                  placeholder="Enter inflow amount"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="outflow">Outflow (Money Out)</Label>
                <Input
                  id="outflow"
                  type="number"
                  step="0.01"
                  value={formData.outflow}
                  onChange={(e) => setFormData(prev => ({ ...prev, outflow: e.target.value }))}
                  placeholder="Enter outflow amount"
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2 flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Transaction'}
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

      {/* Transaction History */}
      <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-6 w-6" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">Date</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Type</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Description</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Inflow</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Outflow</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactionHistory.map((transaction, index) => (
                  <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-4 text-slate-700">{transaction.date}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                        <span className="mr-1">{getTypeIcon(transaction.type)}</span>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-800 max-w-xs truncate" title={transaction.description}>
                      {transaction.description}
                    </td>
                    <td className="p-4">
                      {transaction.inflow > 0 ? (
                        <span className="text-emerald-600 font-bold">${transaction.inflow.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {transaction.outflow > 0 ? (
                        <span className="text-red-600 font-bold">${transaction.outflow.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`font-bold ${transaction.balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        ${transaction.balance.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactionHistory.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <PieChart className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg">No transactions recorded yet</p>
                <p className="text-sm">Set an initial balance or add your first transaction above</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundTracker;
