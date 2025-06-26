
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
  status: 'Ongoing' | 'Completed';
  profit: number;
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
    const savedLoans = localStorage.getItem(STORAGE_KEYS.loans);
    const savedCollections = localStorage.getItem(STORAGE_KEYS.collections);
    const savedFunds = localStorage.getItem(STORAGE_KEYS.funds);

    if (savedLoans) setLoans(JSON.parse(savedLoans));
    if (savedCollections) setCollections(JSON.parse(savedCollections));
    if (savedFunds) setFunds(JSON.parse(savedFunds));
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.loans, JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.collections, JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.funds, JSON.stringify(funds));
  }, [funds]);

  const calculateLoanMetrics = (loan: Omit<Loan, 'totalToReceive' | 'collected' | 'balance' | 'status' | 'profit'>) => {
    const totalToReceive = loan.dailyPay * loan.days;
    const collected = collections
      .filter(c => c.loanId === loan.id)
      .reduce((sum, c) => sum + c.amountPaid, 0);
    const balance = totalToReceive - collected;
    const status = balance === 0 ? 'Completed' as const : 'Ongoing' as const;
    const profit = totalToReceive - loan.loanAmount;
    
    return {
      ...loan,
      totalToReceive,
      collected,
      balance,
      status,
      profit,
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

  const addFund = (fundData: Omit<Fund, 'balance'>) => {
    const lastBalance = funds.length > 0 ? funds[funds.length - 1].balance : 0;
    const newBalance = lastBalance + fundData.inflow - fundData.outflow;
    
    const newFund: Fund = {
      ...fundData,
      balance: newBalance,
    };
    
    setFunds(prev => [...prev, newFund]);
  };

  return {
    loans,
    collections,
    funds,
    addLoan,
    addCollection,
    addFund,
    updateLoan,
  };
};
