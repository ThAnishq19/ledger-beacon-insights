
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
  datetime: Date;
  description: string;
  inflow: number;
  outflow: number;
  balance: number;
  type: 'manual' | 'loan' | 'collection' | 'opening';
}

const FundTracker: React.FC<FundTrackerProps> = ({ funds, loans, collections, onAddFund }) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showInitialBalance, setShowInitialBalance] = useState(funds.length === 0);
  const [initialBalance, setInitialBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    inflow: '',
    outflow: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Calculate transaction history with proper date/time sorting
  const transactionHistory = useMemo(() => {
    console.log('Calculating transaction history...');
    
    try {
      const transactions: TransactionRow[] = [];
      
      // Add manual fund entries with proper datetime
      if (funds && Array.isArray(funds)) {
        funds.forEach(fund => {
          if (fund && fund.id) {
            const fundDate = new Date(fund.date || new Date().toISOString().split('T')[0]);
            transactions.push({
              id: fund.id,
              date: fund.date || new Date().toISOString().split('T')[0],
              datetime: fundDate,
              description: fund.description || 'Manual transaction',
              inflow: Number(fund.inflow) || 0,
              outflow: Number(fund.outflow) || 0,
              balance: Number(fund.balance) || 0,
              type: fund.description === 'Initial Balance' ? 'opening' : 'manual'
            });
          }
        });
      }

      // Add loan disbursements (only enabled loans) with proper datetime
      if (loans && Array.isArray(loans)) {
        loans
          .filter(loan => loan && loan.id && !loan.isDisabled)
          .forEach(loan => {
            const loanDate = new Date(loan.date || new Date().toISOString().split('T')[0]);
            // Add 1 hour to loan disbursement to ensure proper ordering
            loanDate.setHours(loanDate.getHours() + 1);
            
            transactions.push({
              id: `loan-${loan.id}`,
              date: loan.date || new Date().toISOString().split('T')[0],
              datetime: loanDate,
              description: `Loan disbursed to ${loan.customerName || 'Unknown'}`,
              inflow: 0,
              outflow: Number(loan.netGiven) || 0,
              balance: 0,
              type: 'loan'
            });
          });
      }

      // Add collections with proper datetime grouping by date
      if (collections && Array.isArray(collections)) {
        const collectionsByDate = new Map<string, Collection[]>();
        
        collections.forEach(collection => {
          if (collection && collection.date && collection.amountPaid) {
            const date = collection.date;
            const existing = collectionsByDate.get(date) || [];
            existing.push(collection);
            collectionsByDate.set(date, existing);
          }
        });

        collectionsByDate.forEach((dayCollections, date) => {
          const totalAmount = dayCollections.reduce((sum, c) => sum + (Number(c.amountPaid) || 0), 0);
          
          if (totalAmount > 0) {
            const collectionDate = new Date(date);
            // Add 2 hours to collections to ensure proper ordering after loans
            collectionDate.setHours(collectionDate.getHours() + 2);
            
            transactions.push({
              id: `collection-${date}`,
              date,
              datetime: collectionDate,
              description: `Collections received (${dayCollections.length} payment${dayCollections.length > 1 ? 's' : ''})`,
              inflow: totalAmount,
              outflow: 0,
              balance: 0,
              type: 'collection'
            });
          }
        });
      }

      // Sort transactions by datetime for proper chronological order
      transactions.sort((a, b) => {
        const timeA = a.datetime.getTime();
        const timeB = b.datetime.getTime();
        if (timeA === timeB) {
          // If same datetime, prioritize: opening -> manual -> loan -> collection
          const priority = { opening: 0, manual: 1, loan: 2, collection: 3 };
          return priority[a.type] - priority[b.type];
        }
        return timeA - timeB;
      });

      // Recalculate running balances
      let runningBalance = 0;
      
      transactions.forEach(transaction => {
        if (transaction.type === 'manual' || transaction.type === 'opening') {
          // For manual transactions, use the stored balance
          runningBalance = transaction.balance;
        } else {
          // For loan/collection transactions, calculate balance
          runningBalance += transaction.inflow - transaction.outflow;
          transaction.balance = runningBalance;
        }
      });

      console.log('Transaction history calculated successfully:', transactions.length, 'transactions');
      return transactions;
    } catch (error) {
      console.error('Error calculating transaction history:', error);
      return [];
    }
  }, [funds, loans, collections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started with data:', formData);
    
    if (isLoading) {
      console.log('Already loading, preventing duplicate submission');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!formData.description.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter a description",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const inflowAmount = parseFloat(formData.inflow) || 0;
      const outflowAmount = parseFloat(formData.outflow) || 0;

      if (inflowAmount === 0 && outflowAmount === 0) {
        toast({
          title: "Validation Error",
          description: "Please enter either an inflow or outflow amount",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const newFund = {
        id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: formData.date,
        description: formData.description.trim(),
        inflow: inflowAmount,
        outflow: outflowAmount,
      };

      console.log('Submitting fund:', newFund);
      
      await onAddFund(newFund);
      
      console.log('Fund submitted successfully');
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        inflow: '',
        outflow: '',
      });
      setShowForm(false);
      
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
    } catch (error) {
      console.error('Error adding fund:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialBalance = async () => {
    if (!initialBalance || isNaN(parseFloat(initialBalance))) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid initial balance",
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

      console.log('Setting initial balance:', newFund);
      await onAddFund(newFund);
      setInitialBalance('');
      setShowInitialBalance(false);
      
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

  // Calculate summary metrics
  const currentBalance = transactionHistory.length > 0 
    ? transactionHistory[transactionHistory.length - 1]?.balance || 0 
    : 0;
  
  const totalInflow = transactionHistory.reduce((sum, t) => sum + (t.inflow || 0), 0);
  const totalOutflow = transactionHistory.reduce((sum, t) => sum + (t.outflow || 0), 0);
  const negativeBalanceDays = transactionHistory.filter(t => (t.balance || 0) < 0).length;

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
      case 'loan': return 'text-red-600 bg-red-100 border border-red-200';
      case 'collection': return 'text-emerald-600 bg-emerald-100 border border-emerald-200';
      case 'opening': return 'text-blue-600 bg-blue-100 border border-blue-200';
      default: return 'text-purple-600 bg-purple-100 border border-purple-200';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header Section - Light Theme */}
      <div className="bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 border border-indigo-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-slate-800">Fund Tracker</h2>
            <p className="text-slate-600 text-sm sm:text-base">Monitor cash flow and track all financial transactions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {(funds.length === 0 || showInitialBalance) && (
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Input
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="Enter initial balance"
                  className="w-full sm:w-48 bg-white border-slate-300"
                />
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={handleInitialBalance} 
                    variant="outline" 
                    className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 flex-1 sm:flex-none"
                    disabled={isLoading}
                  >
                    Set Balance
                  </Button>
                  {funds.length > 0 && (
                    <Button 
                      onClick={() => setShowInitialBalance(false)} 
                      variant="outline" 
                      className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              {funds.length > 0 && !showInitialBalance && (
                <Button 
                  onClick={() => setShowInitialBalance(true)}
                  variant="outline" 
                  className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 flex-1 sm:flex-none"
                >
                  Add Balance
                </Button>
              )}
              <Button 
                onClick={() => setShowForm(!showForm)}
                className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg font-semibold flex-1 sm:flex-none"
                disabled={isLoading}
              >
                <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Add Transaction
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards - Light Colors */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-semibold">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">{formatCurrency(currentBalance)}</div>
            <p className="text-xs text-white/90">Available cash</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-semibold">Total Inflow</CardTitle>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">{formatCurrency(totalInflow)}</div>
            <p className="text-xs text-white/90">Money received</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-400 to-pink-500 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-semibold">Total Outflow</CardTitle>
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">{formatCurrency(totalOutflow)}</div>
            <p className="text-xs text-white/90">Money disbursed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-semibold">Risk Days</CardTitle>
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">{negativeBalanceDays}</div>
            <p className="text-xs text-white/90">Negative balance days</p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Transaction Form - Light Theme */}
      {showForm && (
        <Card className="bg-white shadow-lg border border-purple-200 rounded-xl sm:rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 border-b border-purple-200 p-4 sm:p-6">
            <CardTitle className="text-slate-800 text-lg sm:text-xl">Add Manual Transaction</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <Label htmlFor="date" className="text-slate-700">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1 border-slate-300"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-slate-700">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter transaction description"
                  className="mt-1 border-slate-300"
                  required
                />
              </div>
              <div>
                <Label htmlFor="inflow" className="text-slate-700">Money In (Inflow)</Label>
                <Input
                  id="inflow"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.inflow}
                  onChange={(e) => setFormData(prev => ({ ...prev, inflow: e.target.value }))}
                  placeholder="0.00"
                  className="mt-1 border-slate-300"
                />
              </div>
              <div>
                <Label htmlFor="outflow" className="text-slate-700">Money Out (Outflow)</Label>
                <Input
                  id="outflow"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.outflow}
                  onChange={(e) => setFormData(prev => ({ ...prev, outflow: e.target.value }))}
                  placeholder="0.00"
                  className="mt-1 border-slate-300"
                />
              </div>
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Transaction'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transaction History - Light Theme */}
      <Card className="bg-white shadow-lg border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-300 p-4 sm:p-6">
          <CardTitle className="flex items-center text-slate-800 text-lg sm:text-xl">
            <BarChart3 className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            Transaction History ({transactionHistory.length} transactions)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 text-sm">Date</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 text-sm">Type</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 text-sm">Description</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 text-sm">Money In</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 text-sm">Money Out</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-slate-700 text-sm">Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactionHistory.map((transaction, index) => (
                  <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-3 sm:p-4 text-slate-700 text-sm">{transaction.date}</td>
                    <td className="p-3 sm:p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                        <span className="mr-1">{getTypeIcon(transaction.type)}</span>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-slate-800 max-w-xs truncate text-sm" title={transaction.description}>
                      {transaction.description}
                    </td>
                    <td className="p-3 sm:p-4">
                      {transaction.inflow > 0 ? (
                        <span className="text-emerald-600 font-bold text-sm">{formatCurrency(transaction.inflow)}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4">
                      {transaction.outflow > 0 ? (
                        <span className="text-red-600 font-bold text-sm">{formatCurrency(transaction.outflow)}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className={`font-bold text-sm ${(transaction.balance || 0) < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        {formatCurrency(transaction.balance || 0)}
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
