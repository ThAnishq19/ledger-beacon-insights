
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
    // Invested amount = total net given to customers (actual cash out)
    const totalInvestedAmount = loans.reduce((sum, loan) => sum + loan.netGiven, 0);
    
    // Total disbursed = total loan amounts (for tracking)
    const totalLoanAmountDisbursed = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    
    // Total received from collections
    const totalReceived = collections.reduce((sum, collection) => sum + collection.amountPaid, 0);
    
    // Expected total profit = sum of all deductions + interest from completed collections
    const expectedTotalProfit = loans.reduce((sum, loan) => sum + loan.profit, 0);
    
    // Cash in hand from fund tracker (latest balance)
    const cashInHand = funds.length > 0 ? funds[funds.length - 1].balance : 0;
    
    // Outstanding amount (what customers still owe)
    const outstanding = loans.reduce((sum, loan) => sum + loan.balance, 0);
    
    // Actual profit realized = total received - total invested
    const actualProfitRealized = totalReceived - totalInvestedAmount;

    return {
      totalInvestedAmount,
      totalLoanAmountDisbursed,
      totalReceived,
      expectedTotalProfit,
      cashInHand,
      outstanding,
      actualProfitRealized,
    };
  };

  const metrics = calculateMetrics();

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
    <Card className={`relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${bgGradient}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
        <CardTitle className="text-xs sm:text-sm font-semibold text-white/90 leading-tight">{title}</CardTitle>
        <div className="p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative px-4 pb-4">
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
          ${Math.abs(value).toLocaleString()}
        </div>
        {subtitle && (
          <p className="text-xs text-white/80 leading-tight">{subtitle}</p>
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
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Financial Overview</h1>
            <p className="text-slate-300 text-sm sm:text-base">Real-time insights into your lending business</p>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-slate-300">Current Balance</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">${metrics.cashInHand.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Invested"
          value={metrics.totalInvestedAmount}
          icon={Wallet}
          bgGradient="bg-gradient-to-br from-blue-600 to-blue-700"
          subtitle="Cash given to customers"
        />
        <MetricCard
          title="Loans Disbursed"
          value={metrics.totalLoanAmountDisbursed}
          icon={TrendingDown}
          bgGradient="bg-gradient-to-br from-orange-500 to-red-600"
          isPositive={false}
          subtitle="Total loan amounts"
        />
        <MetricCard
          title="Collections"
          value={metrics.totalReceived}
          icon={TrendingUp}
          bgGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          isPositive={true}
          subtitle="Payments received"
        />
        <MetricCard
          title="Expected Profit"
          value={metrics.expectedTotalProfit}
          icon={Target}
          bgGradient="bg-gradient-to-br from-purple-500 to-indigo-600"
          subtitle="Projected earnings"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Cash in Hand"
          value={metrics.cashInHand}
          icon={DollarSign}
          bgGradient="bg-gradient-to-br from-emerald-600 to-green-700"
          isPositive={metrics.cashInHand > 0}
          subtitle="Available liquidity"
        />
        <MetricCard
          title="Outstanding"
          value={metrics.outstanding}
          icon={AlertCircle}
          bgGradient="bg-gradient-to-br from-red-500 to-pink-600"
          isPositive={false}
          subtitle="Pending collections"
        />
        <MetricCard
          title="Actual Profit"
          value={metrics.actualProfitRealized}
          icon={PieChart}
          bgGradient="bg-gradient-to-br from-teal-500 to-cyan-600"
          isPositive={metrics.actualProfitRealized > 0}
          subtitle="Profit realized"
        />
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-slate-50 to-white shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
              <BarChart3 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Portfolio Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Active Loans</span>
                <span className="text-xl sm:text-2xl font-bold text-emerald-700">
                  {loans.filter(loan => loan.status === 'Ongoing').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Completed Loans</span>
                <span className="text-xl sm:text-2xl font-bold text-blue-700">
                  {loans.filter(loan => loan.status === 'Completed').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <span className="text-xs sm:text-sm font-medium text-slate-700">Total Collections</span>
                <span className="text-xl sm:text-2xl font-bold text-purple-700">{collections.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-800 to-purple-700 text-white rounded-t-lg">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
              <Target className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
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
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (metrics.totalReceived / metrics.totalInvestedAmount) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
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
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
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
