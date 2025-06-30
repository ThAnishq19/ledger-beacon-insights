
import { useState, useEffect } from 'react';

export interface Loan {
  id: string;
  customerName: string;
  date: string;
  loanAmount: number;
  deduction: number;
  netGiven: number;
  dailyPay: number;
  days: number;
  totalToReceive: number;
  collected: number;
  balance: number;
  status: 'Ongoing' | 'Completed' | 'Disabled';
  profit: number;
  isDisabled?: boolean;
}

export interface Collection {
  id: string;
  date: string;
  loanId: string;
  customer: string;
  amountPaid: number;
  collectedBy: string;
  remarks: string;
}

export interface Fund {
  id: string;
  date: string;
  description: string;
  inflow: number;
  outflow: number;
  balance: number;
}

const STORAGE_KEYS = {
  loans: 'finance-loans',
  collections: 'finance-collections',
  funds: 'finance-funds',
};

export const useFinanceData = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedLoans = localStorage.getItem(STORAGE_KEYS.loans);
      const savedCollections = localStorage.getItem(STORAGE_KEYS.collections);
      const savedFunds = localStorage.getItem(STORAGE_KEYS.funds);

      if (savedLoans) setLoans(JSON.parse(savedLoans));
      if (savedCollections) setCollections(JSON.parse(savedCollections));
      if (savedFunds) setFunds(JSON.parse(savedFunds));
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.loans, JSON.stringify(loans));
    } catch (error) {
      console.error('Error saving loans to localStorage:', error);
    }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.collections, JSON.stringify(collections));
    } catch (error) {
      console.error('Error saving collections to localStorage:', error);
    }
  }, [collections]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.funds, JSON.stringify(funds));
    } catch (error) {
      console.error('Error saving funds to localStorage:', error);
    }
  }, [funds]);

  const calculateLoanMetrics = (loan: Omit<Loan, 'totalToReceive' | 'collected' | 'balance' | 'status' | 'profit'>) => {
    // Calculate collected amount from collections
    const collected = collections
      .filter(c => c.loanId === loan.id)
      .reduce((sum, c) => sum + (c.amountPaid || 0), 0);
    
    // Balance is what's still owed (loan amount - collected)
    const balance = Math.max(0, loan.loanAmount - collected);
    
    // Status based on balance and disabled state
    let status: 'Ongoing' | 'Completed' | 'Disabled';
    if (loan.isDisabled) {
      status = 'Disabled';
    } else {
      status = balance <= 0 ? 'Completed' : 'Ongoing';
    }
    
    // New profit calculation: deduction + (customer total payment - net given)
    // Customer should pay full loan amount, so extra profit = loanAmount - netGiven - deduction
    const expectedTotalProfit = loan.deduction + (loan.loanAmount - loan.netGiven);
    
    return {
      ...loan,
      totalToReceive: loan.loanAmount, // Customer pays back full loan amount
      collected,
      balance,
      status,
      profit: expectedTotalProfit,
    };
  };

  const addLoan = (loanData: Omit<Loan, 'totalToReceive' | 'collected' | 'balance' | 'status' | 'profit'>) => {
    const newLoan = calculateLoanMetrics(loanData);
    setLoans(prev => [...prev, newLoan]);
  };

  const updateLoan = (loanId: string, updates: Partial<Loan>) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const updated = { ...loan, ...updates };
        return calculateLoanMetrics(updated);
      }
      return loan;
    }));
  };

  const deleteLoan = (loanId: string) => {
    setLoans(prev => prev.filter(loan => loan.id !== loanId));
    // Also remove related collections
    setCollections(prev => prev.filter(collection => collection.loanId !== loanId));
  };

  const toggleLoanStatus = (loanId: string) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const updated = { ...loan, isDisabled: !loan.isDisabled };
        return calculateLoanMetrics(updated);
      }
      return loan;
    }));
  };

  const addCollection = (collectionData: Collection) => {
    setCollections(prev => [...prev, collectionData]);
    
    // Update related loan metrics
    setLoans(prev => prev.map(loan => {
      if (loan.id === collectionData.loanId) {
        return calculateLoanMetrics(loan);
      }
      return loan;
    }));
  };

  const addBulkCollection = (loanId: string, collectedBy: string, remarks: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const remainingAmount = loan.balance;
    if (remainingAmount <= 0) return;

    const newCollection: Collection = {
      id: `bulk-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      loanId: loanId,
      customer: loan.customerName,
      amountPaid: remainingAmount,
      collectedBy: collectedBy || 'System',
      remarks: remarks || '100 days bulk collection',
    };

    addCollection(newCollection);
  };

  const addFund = (fundData: Omit<Fund, 'balance'>) => {
    try {
      console.log('Adding fund:', fundData);
      
      const newFund = {
        ...fundData,
        id: fundData.id || `fund-${Date.now()}`,
        inflow: Number(fundData.inflow) || 0,
        outflow: Number(fundData.outflow) || 0,
        balance: 0
      };

      const allFunds = [...funds, newFund].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      let runningBalance = 0;
      const updatedFunds = allFunds.map(fund => {
        runningBalance += fund.inflow - fund.outflow;
        return { ...fund, balance: runningBalance };
      });
      
      setFunds(updatedFunds);
      console.log('Fund added successfully');
    } catch (error) {
      console.error('Error adding fund:', error);
    }
  };

  const getLoanCashFlow = (loanId: string) => {
    try {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) {
        console.log('Loan not found:', loanId);
        return null;
      }

      const loanCollections = collections.filter(c => c.loanId === loanId);
      
      const totalInflow = loanCollections.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
      const totalOutflow = loan.netGiven || 0;
      const netFlow = totalInflow - totalOutflow;
      
      console.log('Cash flow calculated for loan:', loanId, {
        totalInflow,
        totalOutflow,
        netFlow,
        profit: loan.profit
      });
      
      return {
        loan,
        collections: loanCollections,
        totalInflow,
        totalOutflow,
        netFlow,
        profit: loan.profit
      };
    } catch (error) {
      console.error('Error calculating cash flow:', error);
      return null;
    }
  };

  return {
    loans,
    collections,
    funds,
    addLoan,
    addCollection,
    addBulkCollection,
    addFund,
    updateLoan,
    deleteLoan,
    toggleLoanStatus,
    getLoanCashFlow,
  };
};
