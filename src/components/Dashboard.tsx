
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loan, Collection, Fund } from "@/hooks/useFinanceData";
import { TrendingUp, TrendingDown, DollarSign, Target, Wallet, AlertCircle, PieChart, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardProps {
  loans: Loan[];
  collections: Collection[];
  funds: Fund[];
}

const Dashboard: React.FC<DashboardProps> = ({ loans, collections, funds }) => {
  const calculateMetrics = () => {
    // Get current balance from fund tracker
    const sortedFunds = [...funds].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cashInHand = 0;
    
    if (sortedFunds.length > 0) {
      cashInHand = sortedFunds[sortedFunds.length - 1].balance || 0;
      
      // Add recent transactions after last fund entry
      const lastFundDate = new Date(sortedFunds[sortedFunds.length - 1].date);
      
      // Subtract recent loan disbursements (net given)
      const recentLoans = loans.filter(loan => 
        !loan.isDisabled && new Date(loan.date) > lastFundDate
      );
      const recentLoanAmount = recentLoans.reduce((sum, loan) => sum + (loan.netGiven || 0), 0);
      cashInHand -= recentLoanAmount;
      
      // Add recent collections
      const recentCollections = collections.filter(collection => 
        new Date(collection.date) > lastFundDate
      );
      const recentCollectionAmount = recentCollections.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
      cashInHand += recentCollectionAmount;
    }
    
    // Total amount invested (net given to customers)
    const totalInvestedAmount = loans.reduce((sum, loan) => sum + loan.netGiven, 0);
    
    // Total loan amount disbursed (for tracking)
    const totalLoanAmountDisbursed = loans.reduce((sum, loan) => sum + loan.netGiven, 0);
    
    // Total collections received
    const totalCollections = collections.reduce((sum, collection) => sum + collection.amountPaid, 0);
    
    // Outstanding amount (what customers still owe)
    const outstandingAmount = loans.reduce((sum, loan) => sum + loan.balance, 0);
    
    // Expected profit calculation: deduction + (loan amount - net given)
    const expectedProfit = loans.reduce((sum, loan) => {
      return sum + loan.deduction + (loan.loanAmount - loan.netGiven);
    }, 0);

    return {
      cashInHand,
      totalInvestedAmount,
      totalLoanAmountDisbursed,
      totalCollections,
      outstandingAmount,
      expectedProfit,
    };
  };

  const metrics = calculateMetrics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const downloadBalanceSheet = () => {
    const balanceSheetData = {
      date: new Date().toLocaleDateString('en-IN'),
      investedAmount: metrics.totalInvestedAmount,
      totalCollections: metrics.totalCollections,
      outstandingAmount: metrics.outstandingAmount,
      cashInHand: metrics.cashInHand,
      expectedProfit: metrics.expectedProfit,
      loanDetails: loans.map(loan => ({
        loanId: loan.id,
        customer: loan.customerName,
        amountGiven: loan.netGiven,
        amountReceived: loan.collected,
        balance: loan.balance,
      })),
      collectionDetails: collections.map(collection => ({
        date: collection.date,
        fromCustomer: collection.customer,
        amount: collection.amountPaid,
        collectedBy: collection.collectedBy,
      }))
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Balance Sheet - ${balanceSheetData.date}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 20px; border-radius: 10px; }
          .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .metric-card { background: #f8fafc; padding: 20px; border-radius: 10px; border-left: 4px solid #3b82f6; }
          .metric-title { font-size: 14px; color: #64748b; margin-bottom: 5px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          th { background-color: #3b82f6; color: white; font-weight: 600; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .section-title { font-size: 18px; font-weight: 600; margin: 30px 0 15px 0; color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Daily Balance Sheet</h1>
          <p>Generated on: ${balanceSheetData.date}</p>
        </div>
        
        <div class="summary">
          <div class="metric-card">
            <div class="metric-title">Cash in Hand</div>
            <div class="metric-value">${formatCurrency(balanceSheetData.cashInHand)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Total Invested</div>
            <div class="metric-value">${formatCurrency(balanceSheetData.investedAmount)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Total Collections</div>
            <div class="metric-value">${formatCurrency(balanceSheetData.totalCollections)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Outstanding Amount</div>
            <div class="metric-value">${formatCurrency(balanceSheetData.outstandingAmount)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Expected Profit</div>
            <div class="metric-value">${formatCurrency(balanceSheetData.expectedProfit)}</div>
          </div>
        </div>

        <div class="section-title">Loan Details</div>
        <table>
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>Amount Given</th>
              <th>Amount Received</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${balanceSheetData.loanDetails.map(loan => `
              <tr>
                <td>${loan.loanId}</td>
                <td>${loan.customer}</td>
                <td>${formatCurrency(loan.amountGiven)}</td>
                <td>${formatCurrency(loan.amountReceived)}</td>
                <td>${formatCurrency(loan.balance)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Collection Details</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>From Customer</th>
              <th>Amount</th>
              <th>Collected By</th>
            </tr>
          </thead>
          <tbody>
            ${balanceSheetData.collectionDetails.map(collection => `
              <tr>
                <td>${collection.date}</td>
                <td>${collection.fromCustomer}</td>
                <td>${formatCurrency(collection.amount)}</td>
                <td>${collection.collectedBy}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    bgGradient,
    isPositive,
    subtitle
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    bgGradient: string;
    isPositive?: boolean;
    subtitle?: string;
  }) => (
    <Card className={`relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${bgGradient} border-0`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-sm sm:text-base font-bold text-white leading-tight">{title}</CardTitle>
        <div className="p-2 sm:p-3 rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
          {formatCurrency(Math.abs(value))}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-white/90 leading-tight">{subtitle}</p>
        )}
        {isPositive !== undefined && (
          <p className={`text-xs sm:text-sm flex items-center mt-2 ${isPositive ? 'text-emerald-200' : 'text-red-200'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {isPositive ? 'Positive' : 'Negative'} flow
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10 p-2 sm:p-4">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Financial Dashboard</h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Real-time business insights at your fingertips</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="text-center sm:text-right">
              <p className="text-blue-200 text-sm">Cash in Hand</p>
              <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(metrics.cashInHand)}</p>
            </div>
            <Button 
              onClick={downloadBalanceSheet}
              className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl shadow-lg font-semibold"
            >
              <Download className="mr-2 h-5 w-5" />
              Balance Sheet
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid - Enhanced */}
      <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Cash in Hand"
          value={metrics.cashInHand}
          icon={DollarSign}
          bgGradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          isPositive={metrics.cashInHand > 0}
          subtitle="Available balance"
        />
        <MetricCard
          title="Total Invested"
          value={metrics.totalInvestedAmount}
          icon={Wallet}
          bgGradient="bg-gradient-to-br from-blue-500 to-indigo-500"
          subtitle="Amount given to customers"
        />
        <MetricCard
          title="Total Collections"
          value={metrics.totalCollections}
          icon={TrendingUp}
          bgGradient="bg-gradient-to-br from-purple-500 to-pink-500"
          isPositive={true}
          subtitle="Payments received"
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2">
        <MetricCard
          title="Outstanding Amount"
          value={metrics.outstandingAmount}
          icon={AlertCircle}
          bgGradient="bg-gradient-to-br from-red-500 to-orange-500"
          isPositive={false}
          subtitle="Pending collections"
        />
        <MetricCard
          title="Expected Profit"
          value={metrics.expectedProfit}
          icon={Target}
          bgGradient="bg-gradient-to-br from-cyan-500 to-blue-500"
          subtitle="Deduction + Interest"
        />
      </div>

      {/* Enhanced Analytics Cards */}
      <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl border border-blue-200 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <CardTitle className="text-xl font-bold flex items-center">
              <BarChart3 className="mr-3 h-6 w-6" />
              Portfolio Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-200">
                <span className="font-semibold text-slate-700">Active Loans</span>
                <span className="text-3xl font-bold text-emerald-600">
                  {loans.filter(loan => loan.status === 'Ongoing').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border border-blue-200">
                <span className="font-semibold text-slate-700">Completed Loans</span>
                <span className="text-3xl font-bold text-blue-600">
                  {loans.filter(loan => loan.status === 'Completed').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border border-purple-200">
                <span className="font-semibold text-slate-700">Total Collections</span>
                <span className="text-3xl font-bold text-purple-600">{collections.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl border border-purple-200 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
            <CardTitle className="text-xl font-bold flex items-center">
              <PieChart className="mr-3 h-6 w-6" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-slate-700">Collection Rate</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {metrics.totalInvestedAmount > 0 
                      ? `${((metrics.totalCollections / metrics.totalInvestedAmount) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-3">
                  <div 
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (metrics.totalCollections / metrics.totalInvestedAmount) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl border border-purple-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-slate-700">Profit Margin</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {metrics.totalInvestedAmount > 0 
                      ? `${((metrics.expectedProfit / metrics.totalInvestedAmount) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (metrics.expectedProfit / metrics.totalInvestedAmount) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
