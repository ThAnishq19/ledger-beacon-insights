
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loan, Collection, Fund } from "@/hooks/useFinanceData";
import { TrendingUp, TrendingDown, DollarSign, Target, Wallet, AlertCircle } from "lucide-react";

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
    const profitReceived = totalReceived - totalGivenAsLoans;

    return {
      totalCapitalInvested,
      totalGivenAsLoans,
      totalReceived,
      expectedProfit,
      cashInHand,
      outstanding,
      profitReceived,
    };
  };

  const metrics = calculateMetrics();

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    isPositive 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    color: string; 
    isPositive?: boolean;
  }) => (
    <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-800">
          ${value.toLocaleString()}
        </div>
        {isPositive !== undefined && (
          <p className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'} flex items-center mt-1`}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? 'Positive' : 'Negative'} flow
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Capital Invested"
          value={metrics.totalCapitalInvested}
          icon={Wallet}
          color="text-blue-600"
        />
        <MetricCard
          title="Total Given as Loans"
          value={metrics.totalGivenAsLoans}
          icon={TrendingDown}
          color="text-orange-600"
          isPositive={false}
        />
        <MetricCard
          title="Total Received"
          value={metrics.totalReceived}
          icon={TrendingUp}
          color="text-emerald-600"
          isPositive={true}
        />
        <MetricCard
          title="Expected Profit"
          value={metrics.expectedProfit}
          icon={Target}
          color="text-purple-600"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Cash in Hand"
          value={metrics.cashInHand}
          icon={DollarSign}
          color="text-emerald-600"
          isPositive={metrics.cashInHand > 0}
        />
        <MetricCard
          title="Outstanding Amount"
          value={metrics.outstanding}
          icon={AlertCircle}
          color="text-red-600"
          isPositive={false}
        />
        <MetricCard
          title="Profit Received"
          value={metrics.profitReceived}
          icon={TrendingUp}
          color="text-emerald-600"
          isPositive={metrics.profitReceived > 0}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Active Loans</span>
                <span className="font-semibold text-slate-800">
                  {loans.filter(loan => loan.status === 'Ongoing').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Completed Loans</span>
                <span className="font-semibold text-emerald-600">
                  {loans.filter(loan => loan.status === 'Completed').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Collections</span>
                <span className="font-semibold text-slate-800">{collections.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Fund Transactions</span>
                <span className="font-semibold text-slate-800">{funds.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Recovery Rate</span>
                <span className="font-semibold text-emerald-600">
                  {metrics.totalGivenAsLoans > 0 
                    ? `${((metrics.totalReceived / metrics.totalGivenAsLoans) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Profit Margin</span>
                <span className="font-semibold text-purple-600">
                  {metrics.totalGivenAsLoans > 0 
                    ? `${((metrics.expectedProfit / metrics.totalGivenAsLoans) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Collection Efficiency</span>
                <span className="font-semibold text-blue-600">
                  {loans.reduce((sum, loan) => sum + loan.totalToReceive, 0) > 0
                    ? `${((metrics.totalReceived / loans.reduce((sum, loan) => sum + loan.totalToReceive, 0)) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
