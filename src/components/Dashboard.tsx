
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
    const totalCapitalInvested = funds.length > 0 ? Math.max(...funds.map(f => f.balance)) : 0;
    const totalGivenAsLoans = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    const totalReceived = collections.reduce((sum, collection) => sum + collection.amountPaid, 0);
    const expectedProfit = loans.reduce((sum, loan) => sum + loan.profit, 0);
    const cashInHand = funds.length > 0 ? funds[funds.length - 1].balance : 0;
    const outstanding = loans.reduce((sum, loan) => sum + loan.balance, 0);
    const actualProfitReceived = totalReceived - totalGivenAsLoans;

    return {
      totalCapitalInvested,
      totalGivenAsLoans,
      totalReceived,
      expectedProfit,
      cashInHand,
      outstanding,
      actualProfitReceived,
    };
  };

  const metrics = calculateMetrics();

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    bgGradient,
    isPositive,
    subtitle
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    color: string; 
    bgGradient: string;
    isPositive?: boolean;
    subtitle?: string;
  }) => (
    <Card className={`relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${bgGradient}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-white/90">{title}</CardTitle>
        <div className={`p-2 rounded-full bg-white/20 backdrop-blur-sm`}>
          <Icon className={`h-5 w-5 text-white`} />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold text-white mb-1">
          ${Math.abs(value).toLocaleString()}
        </div>
        {subtitle && (
          <p className="text-xs text-white/80">{subtitle}</p>
        )}
        {isPositive !== undefined && (
          <p className={`text-xs flex items-center mt-2 ${isPositive ? 'text-emerald-200' : 'text-red-200'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? 'Positive' : 'Negative'} flow
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 p-1">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Financial Overview</h1>
            <p className="text-slate-300">Real-time insights into your lending business</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-300">Current Balance</p>
              <p className="text-2xl font-bold">${metrics.cashInHand.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Capital"
          value={metrics.totalCapitalInvested}
          icon={Wallet}
          color="text-blue-600"
          bgGradient="bg-gradient-to-br from-blue-600 to-blue-700"
          subtitle="Available investment capital"
        />
        <MetricCard
          title="Loans Disbursed"
          value={metrics.totalGivenAsLoans}
          icon={TrendingDown}
          color="text-orange-600"
          bgGradient="bg-gradient-to-br from-orange-500 to-red-600"
          isPositive={false}
          subtitle="Total amount lent out"
        />
        <MetricCard
          title="Collections Received"
          value={metrics.totalReceived}
          icon={TrendingUp}
          color="text-emerald-600"
          bgGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          isPositive={true}
          subtitle="Payments collected"
        />
        <MetricCard
          title="Expected Profit"
          value={metrics.expectedProfit}
          icon={Target}
          color="text-purple-600"
          bgGradient="bg-gradient-to-br from-purple-500 to-indigo-600"
          subtitle="Total projected profit"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          title="Cash in Hand"
          value={metrics.cashInHand}
          icon={DollarSign}
          color="text-emerald-600"
          bgGradient="bg-gradient-to-br from-emerald-600 to-green-700"
          isPositive={metrics.cashInHand > 0}
          subtitle="Available liquidity"
        />
        <MetricCard
          title="Outstanding Amount"
          value={metrics.outstanding}
          icon={AlertCircle}
          color="text-red-600"
          bgGradient="bg-gradient-to-br from-red-500 to-pink-600"
          isPositive={false}
          subtitle="Pending collections"
        />
        <MetricCard
          title="Actual Profit"
          value={metrics.actualProfitReceived}
          icon={PieChart}
          color="text-emerald-600"
          bgGradient="bg-gradient-to-br from-teal-500 to-cyan-600"
          isPositive={metrics.actualProfitReceived > 0}
          subtitle="Profit realized"
        />
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-slate-50 to-white shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Portfolio Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Active Loans</span>
                <span className="text-2xl font-bold text-emerald-700">
                  {loans.filter(loan => loan.status === 'Ongoing').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Completed Loans</span>
                <span className="text-2xl font-bold text-blue-700">
                  {loans.filter(loan => loan.status === 'Completed').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Total Collections</span>
                <span className="text-2xl font-bold text-purple-700">{collections.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Fund Transactions</span>
                <span className="text-2xl font-bold text-amber-700">{funds.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-800 to-purple-700 text-white rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Recovery Rate</span>
                  <span className="text-xl font-bold text-emerald-700">
                    {metrics.totalGivenAsLoans > 0 
                      ? `${((metrics.totalReceived / metrics.totalGivenAsLoans) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (metrics.totalReceived / metrics.totalGivenAsLoans) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Profit Margin</span>
                  <span className="text-xl font-bold text-purple-700">
                    {metrics.totalGivenAsLoans > 0 
                      ? `${((metrics.expectedProfit / metrics.totalGivenAsLoans) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (metrics.expectedProfit / metrics.totalGivenAsLoans) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Collection Efficiency</span>
                  <span className="text-xl font-bold text-blue-700">
                    {loans.reduce((sum, loan) => sum + loan.totalToReceive, 0) > 0
                      ? `${((metrics.totalReceived / loans.reduce((sum, loan) => sum + loan.totalToReceive, 0)) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (metrics.totalReceived / loans.reduce((sum, loan) => sum + loan.totalToReceive, 0)) * 100)}%` }}
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
