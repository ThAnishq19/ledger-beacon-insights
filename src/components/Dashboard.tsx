import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loan, Collection, Fund } from "@/hooks/useFinanceData";
import { TrendingUp, TrendingDown, DollarSign, Target, Wallet, AlertCircle, PieChart, BarChart3, Download, Clock, Users, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell } from "recharts";

interface DashboardProps {
  loans: Loan[];
  collections: Collection[];
  funds: Fund[];
}

const Dashboard: React.FC<DashboardProps> = ({ loans, collections, funds }) => {
  const [activeSection, setActiveSection] = useState('overview');

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
    
    // Total collections received
    const totalCollections = collections.reduce((sum, collection) => sum + collection.amountPaid, 0);
    
    // Fixed Outstanding amount calculation: Total loan amount - collected amount for active loans only
    const outstandingAmount = loans
      .filter(loan => !loan.isDisabled && loan.status !== 'Completed')
      .reduce((sum, loan) => {
        const loanCollected = collections
          .filter(c => c.loanId === loan.id)
          .reduce((total, c) => total + c.amountPaid, 0);
        return sum + Math.max(0, loan.loanAmount - loanCollected);
      }, 0);
    
    // Expected profit calculation: deduction + (loan amount - net given)
    const expectedProfit = loans.reduce((sum, loan) => {
      return sum + loan.deduction + (loan.loanAmount - loan.netGiven);
    }, 0);

    // Near to closing customers (10 days buffer)
    const nearToClosingCustomers = loans.filter(loan => {
      if (loan.status === 'Completed' || loan.isDisabled) return false;
      const remainingAmount = Math.max(0, loan.loanAmount - loan.collected);
      const remainingDays = Math.ceil(remainingAmount / loan.dailyPay);
      return remainingDays <= 10 && remainingDays > 0;
    });

    // Payment delay customers (3+ days)
    const today = new Date();
    const paymentDelayCustomers = loans.filter(loan => {
      if (loan.status === 'Completed' || loan.isDisabled) return false;
      const lastCollection = collections
        .filter(c => c.loanId === loan.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (!lastCollection) {
        const daysSinceLoan = Math.floor((today.getTime() - new Date(loan.date).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceLoan >= 3;
      }
      
      const daysSinceLastPayment = Math.floor((today.getTime() - new Date(lastCollection.date).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastPayment >= 3;
    });

    // 100-day loan completion customers
    const hundredDayCustomers = loans.filter(loan => loan.days === 100);

    return {
      cashInHand,
      totalInvestedAmount,
      totalCollections,
      outstandingAmount,
      expectedProfit,
      nearToClosingCustomers,
      paymentDelayCustomers,
      hundredDayCustomers,
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

  // Enhanced Chart data preparation with better customer counts
  const monthlyData = () => {
    const monthMap = new Map();
    
    // Process loans by month
    loans.forEach(loan => {
      const monthKey = new Date(loan.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: monthKey,
          loans: 0,
          amount: 0,
          collections: 0,
          customers: 0,
          hundredDayCustomers: 0
        });
      }
      const monthData = monthMap.get(monthKey);
      monthData.loans += 1;
      monthData.amount += loan.netGiven;
      monthData.customers += 1;
      if (loan.days === 100) {
        monthData.hundredDayCustomers += 1;
      }
    });

    // Process collections by month
    collections.forEach(collection => {
      const monthKey = new Date(collection.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (monthMap.has(monthKey)) {
        monthMap.get(monthKey).collections += collection.amountPaid;
      }
    });

    return Array.from(monthMap.values()).sort((a, b) => {
      const dateA = new Date(a.month + ' 1');
      const dateB = new Date(b.month + ' 1');
      return dateA.getTime() - dateB.getTime();
    });
  };

  const chartData = monthlyData();

  // Enhanced customer status data with proper counts
  const customerStatusData = [
    { 
      name: 'Active Loans', 
      value: loans.filter(l => l.status === 'Ongoing' && !l.isDisabled).length, 
      color: '#10b981',
      description: 'Currently ongoing loans'
    },
    { 
      name: 'Completed', 
      value: loans.filter(l => l.status === 'Completed').length, 
      color: '#3b82f6',
      description: 'Successfully completed loans'
    },
    { 
      name: '100-Day Plans', 
      value: metrics.hundredDayCustomers.length, 
      color: '#8b5cf6',
      description: '100-day loan customers'
    },
    { 
      name: 'Near Closing', 
      value: metrics.nearToClosingCustomers.length, 
      color: '#f59e0b',
      description: 'Customers with ≤10 days remaining'
    },
    { 
      name: 'Payment Delayed', 
      value: metrics.paymentDelayCustomers.length, 
      color: '#ef4444',
      description: 'Customers with 3+ days delay'
    },
  ];

  // Day-wise loan distribution for 100-day analysis
  const dayWiseData = () => {
    const dayMap = new Map();
    loans.filter(loan => !loan.isDisabled).forEach(loan => {
      const days = loan.days || 100;
      if (!dayMap.has(days)) {
        dayMap.set(days, { days, customers: 0, totalAmount: 0 });
      }
      const dayData = dayMap.get(days);
      dayData.customers += 1;
      dayData.totalAmount += loan.netGiven;
    });
    
    return Array.from(dayMap.values()).sort((a, b) => a.days - b.days);
  };

  const dayWiseChartData = dayWiseData();

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
        balance: Math.max(0, loan.loanAmount - loan.collected),
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
    gradient,
    textColor = "white",
    subtitle,
    trend
  }: { 
    title: string; 
    value: number | string; 
    icon: any; 
    gradient: string;
    textColor?: string;
    subtitle?: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <div className={`relative overflow-hidden rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 ${gradient}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <div className="absolute top-4 right-4 opacity-20">
        <Icon className="h-16 w-16" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-white/20 backdrop-blur-sm`}>
            <Icon className={`h-6 w-6 ${textColor === 'white' ? 'text-white' : 'text-gray-800'}`} />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm`}>
              {trend.isPositive ? 
                <TrendingUp className="h-4 w-4 text-white" /> : 
                <TrendingDown className="h-4 w-4 text-white" />
              }
              <span className="text-sm font-medium text-white">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <h3 className={`text-sm font-semibold mb-2 ${textColor === 'white' ? 'text-white/90' : 'text-gray-600'}`}>
          {title}
        </h3>
        <p className={`text-3xl font-bold mb-2 ${textColor === 'white' ? 'text-white' : 'text-gray-900'}`}>
          {typeof value === 'number' ? formatCurrency(value) : value}
        </p>
        {subtitle && (
          <p className={`text-sm ${textColor === 'white' ? 'text-white/80' : 'text-gray-500'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Modern Header with Navigation */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text">
                    Financial Command Center
                  </h1>
                  <p className="text-blue-100 text-lg">Advanced Business Intelligence Dashboard</p>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-300/30">
                      <Clock className="h-4 w-4 mr-1" />
                      Real-time Data
                    </Badge>
                    <Badge className="bg-amber-500/20 text-amber-100 border-amber-300/30">
                      <Users className="h-4 w-4 mr-1" />
                      {loans.length} Total Loans
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-100 border-purple-300/30">
                      <Calendar className="h-4 w-4 mr-1" />
                      {metrics.hundredDayCustomers.length} x 100 Days
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="text-right">
                  <p className="text-blue-200 text-sm">Available Cash</p>
                  <p className="text-3xl font-bold">{formatCurrency(metrics.cashInHand)}</p>
                </div>
                <Button 
                  onClick={downloadBalanceSheet}
                  className="bg-white text-purple-600 hover:bg-blue-50 px-6 py-3 rounded-2xl shadow-lg font-semibold transition-all duration-300 hover:scale-105"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Balance Sheet
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-6 bg-white/60 backdrop-blur-sm p-2 rounded-2xl shadow-lg">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'customers', label: 'Customer Insights', icon: Users },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeSection === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {activeSection === 'overview' && (
        <div className="space-y-8">
          {/* Primary Metrics */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Cash in Hand"
              value={metrics.cashInHand}
              icon={DollarSign}
              gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500"
              subtitle="Available liquidity"
            />
            <MetricCard
              title="Total Invested"
              value={metrics.totalInvestedAmount}
              icon={Wallet}
              gradient="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500"
              subtitle="Capital deployed"
            />
            <MetricCard
              title="Collections"
              value={metrics.totalCollections}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500"
              subtitle="Total received"
            />
            <MetricCard
              title="Outstanding"
              value={metrics.outstandingAmount}
              icon={AlertCircle}
              gradient="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500"
              subtitle="Pending collections"
            />
          </div>

          {/* Enhanced Chart Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <CardTitle className="text-xl font-bold flex items-center">
                  <BarChart3 className="mr-3 h-6 w-6" />
                  Monthly Customer & Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ChartContainer
                  config={{
                    customers: { label: "Customers", color: "#3b82f6" },
                    collections: { label: "Collections", color: "#10b981" },
                    hundredDayCustomers: { label: "100-Day Customers", color: "#8b5cf6" }
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="customers" fill="#3b82f6" name="Total Customers" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="hundredDayCustomers" fill="#8b5cf6" name="100-Day Customers" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                <CardTitle className="text-xl font-bold flex items-center">
                  <PieChart className="mr-3 h-6 w-6" />
                  Customer Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {customerStatusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-white shadow-sm">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div>
                          <span className="font-semibold text-slate-700">{item.name}</span>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold" style={{ color: item.color }}>
                          {item.value}
                        </span>
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ 
                              backgroundColor: item.color,
                              width: `${(item.value / Math.max(...customerStatusData.map(d => d.value))) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Day-wise Analysis Chart */}
          <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <CardTitle className="text-xl font-bold flex items-center">
                <Calendar className="mr-3 h-6 w-6" />
                Loan Duration Analysis (Days vs Customers)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ChartContainer
                config={{
                  customers: { label: "Number of Customers", color: "#8b5cf6" },
                  totalAmount: { label: "Total Amount", color: "#3b82f6" }
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayWiseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="days" label={{ value: 'Loan Duration (Days)', position: 'insideBottom', offset: -5 }} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="customers" fill="#8b5cf6" name="Customers" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === 'customers' && (
        <div className="space-y-8">
          {/* Near to Closing Customers */}
          <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
              <CardTitle className="text-xl font-bold flex items-center">
                <Clock className="mr-3 h-6 w-6" />
                Near to Closing (10 Days Buffer)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {metrics.nearToClosingCustomers.length > 0 ? (
                <div className="grid gap-4">
                  {metrics.nearToClosingCustomers.map((loan) => {
                    const remainingAmount = Math.max(0, loan.loanAmount - loan.collected);
                    const remainingDays = Math.ceil(remainingAmount / loan.dailyPay);
                    return (
                      <div key={loan.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                        <div>
                          <h4 className="font-semibold text-slate-800">{loan.customerName}</h4>
                          <p className="text-sm text-slate-600">Loan ID: {loan.id}</p>
                          <p className="text-xs text-amber-600">Total Duration: {loan.days} days</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-600">{remainingDays} days left</p>
                          <p className="text-sm text-slate-600">{formatCurrency(remainingAmount)} remaining</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No customers nearing closure</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Delay Customers */}
          <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6">
              <CardTitle className="text-xl font-bold flex items-center">
                <AlertTriangle className="mr-3 h-6 w-6" />
                Payment Delayed (3+ Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {metrics.paymentDelayCustomers.length > 0 ? (
                <div className="grid gap-4">
                  {metrics.paymentDelayCustomers.map((loan) => {
                    const lastCollection = collections
                      .filter(c => c.loanId === loan.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    
                    const daysSincePayment = lastCollection 
                      ? Math.floor((new Date().getTime() - new Date(lastCollection.date).getTime()) / (1000 * 60 * 60 * 24))
                      : Math.floor((new Date().getTime() - new Date(loan.date).getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={loan.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-200">
                        <div>
                          <h4 className="font-semibold text-slate-800">{loan.customerName}</h4>
                          <p className="text-sm text-slate-600">Loan ID: {loan.id}</p>
                          <p className="text-xs text-red-600">
                            Last payment: {lastCollection ? lastCollection.date : 'No payments yet'}
                          </p>
                          <p className="text-xs text-slate-500">Total Duration: {loan.days} days</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">{daysSincePayment} days overdue</p>
                          <p className="text-sm text-slate-600">{formatCurrency(loan.balance)} pending</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">All payments are up to date</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === 'analytics' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <CardTitle className="text-xl font-bold">Performance Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ChartContainer
                config={{
                  collections: { label: "Collections", color: "#10b981" }
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="collections" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
              <CardTitle className="text-xl font-bold">Key Ratios</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl">
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
                
                <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl">
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

                <div className="p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-slate-700">Outstanding Ratio</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {metrics.totalInvestedAmount > 0 
                        ? `${((metrics.outstandingAmount / metrics.totalInvestedAmount) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (metrics.outstandingAmount / metrics.totalInvestedAmount) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === 'alerts' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <MetricCard
              title="Near Closing"
              value={metrics.nearToClosingCustomers.length}
              icon={Clock}
              gradient="bg-gradient-to-br from-amber-500 to-orange-500"
              subtitle="Customers with ≤10 days remaining"
            />
            <MetricCard
              title="Payment Delayed"
              value={metrics.paymentDelayCustomers.length}
              icon={AlertTriangle}
              gradient="bg-gradient-to-br from-red-500 to-pink-500"
              subtitle="Customers with 3+ days delay"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
