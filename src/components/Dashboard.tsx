
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loan, Collection, Fund } from "@/hooks/useFinanceData";
import { TrendingUp, TrendingDown, DollarSign, Target, Wallet, AlertCircle, PieChart, BarChart3 } from "lucide-react";

interface DashboardProps {
  loans: Loan[];
  collections: Collection[];
  funds: Fund[];
}

const Dashboard: React.FC<DashboardProps> = ({ loans, collections, funds }) => {
  const calculateMetrics = () => {
    // Get the latest fund balance as current balance
    const sortedFunds = [...funds].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentBalance = 0;
    
    if (sortedFunds.length > 0) {
      // Start with fund balance
      currentBalance = sortedFunds[sortedFunds.length - 1].balance || 0;
      
      // Add loan disbursements and collections that happened after the last fund entry
      const lastFundDate = new Date(sortedFunds[sortedFunds.length - 1].date);
      
      // Subtract loans given after last fund entry
      const recentLoans = loans.filter(loan => 
        !loan.isDisabled && new Date(loan.date) > lastFundDate
      );
      const recentLoanAmount = recentLoans.reduce((sum, loan) => sum + (loan.netGiven || 0), 0);
      currentBalance -= recentLoanAmount;
      
      // Add collections received after last fund entry
      const recentCollections = collections.filter(collection => 
        new Date(collection.date) > lastFundDate
      );
      const recentCollectionAmount = recentCollections.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
      currentBalance += recentCollectionAmount;
    }
    
    // Invested amount = total net given to customers (actual cash out)
    const totalInvestedAmount = loans.reduce((sum, loan) => sum + loan.netGiven, 0);
    
    // Total disbursed = total loan amounts (for tracking)
    const totalLoanAmountDisbursed = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    
    // Total received from collections
    const totalReceived = collections.reduce((sum, collection) => sum + collection.amountPaid, 0);
    
    // Expected total profit = sum of all deductions + interest from completed collections
    const expectedTotalProfit = loans.reduce((sum, loan) => sum + loan.profit, 0);
    
    // Outstanding amount (what customers still owe)
    const outstanding = loans.reduce((sum, loan) => sum + loan.balance, 0);
    
    // Actual profit realized = total received - total invested
    const actualProfitRealized = totalReceived - totalInvestedAmount;

    return {
      totalInvestedAmount,
      totalLoanAmountDisbursed,
      totalReceived,
      expectedTotalProfit,
      currentBalance,
      outstanding,
      actualProfitRealized,
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
    <Card className={`relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${bgGradient}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
        <CardTitle className="text-xs sm:text-sm font-semibold text-white leading-tight">{title}</CardTitle>
        <div className="p-1.5 sm:p-2 rounded-full bg-white/30 backdrop-blur-sm flex-shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative px-4 pb-4">
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
          {formatCurrency(Math.abs(value))}
        </div>
        {subtitle && (
          <p className="text-xs text-white/90 leading-tight">{subtitle}</p>
        )}
        {isPositive !== undefined && (
          <p className={`text-xs flex items-center mt-1 ${isPositive ? 'text-emerald-200' : 'text-red-200'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? 'Positive' : 'Negative'} flow
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-1">
      {/* Header Section - Light Theme */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-800">Financial Overview</h1>
            <p className="text-slate-600 text-sm sm:text-base">Real-time insights into your lending business</p>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-slate-600">Current Balance</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">{formatCurrency(metrics.currentBalance)}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics - Light Colors */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Invested"
          value={metrics.totalInvestedAmount}
          icon={Wallet}
          bgGradient="bg-gradient-to-br from-blue-400 to-blue-500"
          subtitle="Cash given to customers"
        />
        <MetricCard
          title="Loans Disbursed"
          value={metrics.totalLoanAmountDisbursed}
          icon={TrendingDown}
          bgGradient="bg-gradient-to-br from-orange-400 to-red-400"
          isPositive={false}
          subtitle="Total loan amounts"
        />
        <MetricCard
          title="Collections"
          value={metrics.totalReceived}
          icon={TrendingUp}
          bgGradient="bg-gradient-to-br from-emerald-400 to-teal-400"
          isPositive={true}
          subtitle="Payments received"
        />
        <MetricCard
          title="Expected Profit"
          value={metrics.expectedTotalProfit}
          icon={Target}
          bgGradient="bg-gradient-to-br from-purple-400 to-indigo-400"
          subtitle="Projected earnings"
        />
      </div>

      {/* Secondary Metrics - Light Colors */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Cash in Hand"
          value={metrics.currentBalance}
          icon={DollarSign}
          bgGradient="bg-gradient-to-br from-emerald-400 to-green-400"
          isPositive={metrics.currentBalance > 0}
          subtitle="Available liquidity"
        />
        <MetricCard
          title="Outstanding"
          value={metrics.outstanding}
          icon={AlertCircle}
          bgGradient="bg-gradient-to-br from-red-400 to-pink-400"
          isPositive={false}
          subtitle="Pending collections"
        />
        <MetricCard
          title="Actual Profit"
          value={metrics.actualProfitRealized}
          icon={PieChart}
          bgGradient="bg-gradient-to-br from-teal-400 to-cyan-400"
          isPositive={metrics.actualProfitRealized > 0}
          subtitle="Profit realized"
        />
      </div>

      {/* Analytics Cards - Light Theme */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg border border-blue-200">
          <CardHeader className="bg-gradient-to-r from-slate-100 to-blue-100 border-b border-blue-200 rounded-t-lg">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center text-slate-700">
              <BarChart3 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Portfolio Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg border border-emerald-200">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Active Loans</span>
                <span className="text-xl sm:text-2xl font-bold text-emerald-700">
                  {loans.filter(loan => loan.status === 'Ongoing').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-200">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Completed Loans</span>
                <span className="text-xl sm:text-2xl font-bold text-blue-700">
                  {loans.filter(loan => loan.status === 'Completed').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Total Collections</span>
                <span className="text-xl sm:text-2xl font-bold text-purple-700">{collections.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-purple-50 shadow-lg border border-purple-200">
          <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 border-b border-purple-200 rounded-t-lg">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center text-slate-700">
              <Target className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg border border-emerald-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-700">Recovery Rate</span>
                  <span className="text-lg sm:text-xl font-bold text-emerald-700">
                    {metrics.totalInvestedAmount > 0 
                      ? `${((metrics.totalReceived / metrics.totalInvestedAmount) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (metrics.totalReceived / metrics.totalInvestedAmount) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-700">Profit Margin</span>
                  <span className="text-lg sm:text-xl font-bold text-purple-700">
                    {metrics.totalInvestedAmount > 0 
                      ? `${((metrics.expectedTotalProfit / metrics.totalInvestedAmount) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (metrics.expectedTotalProfit / metrics.totalInvestedAmount) * 100)}%` }}
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
