import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loan, Collection, Fund } from "@/hooks/useFinanceData";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, PieChart, BarChart3, Download, Clock, Users, Calendar, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";

interface DashboardProps {
  loans: Loan[];
  collections: Collection[];
  funds: Fund[];
  onNavigateToLoans?: () => void;
  onClearAllData?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ loans, collections, funds, onNavigateToLoans, onClearAllData }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const calculateMetrics = () => {
    // Calculate total collections received (all collections)
    const totalCollections = collections.reduce((sum, collection) => sum + (collection.amountPaid || 0), 0);
    
    // Total amount given out to customers (net given)
    const totalOutflow = loans.reduce((sum, loan) => sum + (loan.netGiven || 0), 0);
    
    // Current balance: total collections - total outflow + fund inflows - fund outflows
    const fundBalance = funds.reduce((sum, fund) => sum + (fund.inflow || 0) - (fund.outflow || 0), 0);
    const currentBalance = totalCollections - totalOutflow + fundBalance;
    
    // Total inflow: collections + fund inflows
    const totalInflow = totalCollections + funds.reduce((sum, fund) => sum + (fund.inflow || 0), 0);
    
    // Total outflow: net given + fund outflows
    const totalOutflowWithFunds = totalOutflow + funds.reduce((sum, fund) => sum + (fund.outflow || 0), 0);
    
    // Outstanding amount: sum of all remaining balances for active loans
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

    // Available cash = current balance
    const availableCash = currentBalance;

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
      currentBalance,
      totalInflow,
      totalOutflow: totalOutflowWithFunds,
      availableCash,
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

  // Customer payment collection data by days and customer name
  const customerPaymentData = () => {
    const customerMap = new Map();
    
    // Process each loan to calculate payment days and collections
    loans.forEach(loan => {
      if (loan.isDisabled) return;
      
      const loanCollections = collections.filter(c => c.loanId === loan.id);
      const totalCollected = loanCollections.reduce((sum, c) => sum + c.amountPaid, 0);
      const paymentDays = loanCollections.length; // Number of payment days
      
      if (totalCollected > 0) {
        customerMap.set(loan.id, {
          customerName: loan.customerName.length > 10 ? loan.customerName.substring(0, 10) + '...' : loan.customerName,
          fullName: loan.customerName,
          paymentDays,
          totalCollected,
          dailyPay: loan.dailyPay,
          loanAmount: loan.loanAmount,
          loanId: loan.id
        });
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => b.totalCollected - a.totalCollected);
  };

  const chartData = customerPaymentData();

  // Enhanced customer status data with proper counts and click handlers
  const customerStatusData = [
    { 
      name: 'Active Loans', 
      value: loans.filter(l => l.status === 'Ongoing' && !l.isDisabled).length, 
      color: '#10b981',
      description: 'Currently ongoing loans',
      onClick: () => {
        setActiveSection('active');
        console.log('Navigating to active loans');
      }
    },
    { 
      name: 'Completed', 
      value: loans.filter(l => l.status === 'Completed').length, 
      color: '#3b82f6',
      description: 'Successfully completed loans',
      onClick: () => {
        setActiveSection('completed');
        console.log('Navigating to completed loans');
      }
    },
    { 
      name: '100-Day Plans', 
      value: metrics.hundredDayCustomers.length, 
      color: '#8b5cf6',
      description: '100-day loan customers',
      onClick: () => {
        setActiveSection('hundred-day');
        console.log('Navigating to 100-day customers');
      }
    },
    { 
      name: 'Near Closing', 
      value: metrics.nearToClosingCustomers.length, 
      color: '#f59e0b',
      description: 'Customers with ≤10 days remaining',
      onClick: () => {
        setActiveSection('near-closing');
        console.log('Navigating to near closing customers');
      }
    },
    { 
      name: 'Payment Delayed', 
      value: metrics.paymentDelayCustomers.length, 
      color: '#ef4444',
      description: 'Customers with 3+ days delay',
      onClick: () => {
        setActiveSection('payment-delayed');
        console.log('Navigating to payment delayed customers');
      }
    },
  ];

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.clear();
      if (onClearAllData) {
        onClearAllData();
      }
      window.location.reload();
    }
  };

  const downloadBalanceSheet = () => {
    const balanceSheetData = {
      date: new Date().toLocaleDateString('en-IN'),
      currentBalance: metrics.currentBalance,
      totalInflow: metrics.totalInflow,
      totalOutflow: metrics.totalOutflow,
      availableCash: metrics.availableCash,
      totalCollections: metrics.totalCollections,
      outstandingAmount: metrics.outstandingAmount,
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
            <div class="metric-title">Current Balance</div>
            <div class="metric-value">${formatCurrency(balanceSheetData.currentBalance)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Total Inflow</div>
            <div class="metric-value">${formatCurrency(balanceSheetData.totalInflow)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Total Outflow</div>
            <div class="metric-value">${formatCurrency(balanceSheetData.totalOutflow)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Available Cash</div>
            <div class="metric-value">${formatCurrency(balanceSheetData.availableCash)}</div>
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
    trend,
    onClick
  }: { 
    title: string; 
    value: number | string; 
    icon: any; 
    gradient: string;
    textColor?: string;
    subtitle?: string;
    trend?: { value: number; isPositive: boolean };
    onClick?: () => void;
  }) => (
    <div 
      className={`relative overflow-hidden rounded-2xl lg:rounded-3xl p-4 sm:p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 ${gradient} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 opacity-20">
        <Icon className="h-12 w-12 sm:h-16 sm:w-16" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm`}>
            <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${textColor === 'white' ? 'text-white' : 'text-gray-800'}`} />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm`}>
              {trend.isPositive ? 
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" /> : 
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              }
              <span className="text-xs sm:text-sm font-medium text-white">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <h3 className={`text-xs sm:text-sm font-semibold mb-2 ${textColor === 'white' ? 'text-white/90' : 'text-gray-600'}`}>
          {title}
        </h3>
        <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 ${textColor === 'white' ? 'text-white' : 'text-gray-900'} break-all`}>
          {typeof value === 'number' ? formatCurrency(value) : value}
        </p>
        {subtitle && (
          <p className={`text-xs sm:text-sm ${textColor === 'white' ? 'text-white/80' : 'text-gray-500'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  const renderCustomersByStatus = () => {
    const getCustomersByStatus = () => {
      switch (activeSection) {
        case 'active':
          return loans.filter(l => l.status === 'Ongoing' && !l.isDisabled);
        case 'completed':
          return loans.filter(l => l.status === 'Completed');
        case 'hundred-day':
          return metrics.hundredDayCustomers;
        case 'near-closing':
          return metrics.nearToClosingCustomers;
        case 'payment-delayed':
          return metrics.paymentDelayCustomers;
        default:
          return [];
      }
    };

    const customers = getCustomersByStatus();
    const statusTitles = {
      'active': 'Active Loans',
      'completed': 'Completed Loans',
      'hundred-day': '100-Day Plan Customers',
      'near-closing': 'Near Closing Customers',
      'payment-delayed': 'Payment Delayed Customers'
    };

    if (['active', 'completed', 'hundred-day', 'near-closing', 'payment-delayed'].includes(activeSection)) {
      return (
        <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-2xl lg:rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center justify-between">
              <span>{statusTitles[activeSection as keyof typeof statusTitles]}</span>
              <Button 
                onClick={() => setActiveSection('overview')}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 text-sm"
              >
                Back to Overview
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {customers.length > 0 ? (
              <div className="grid gap-3 sm:gap-4">
                {customers.map((loan) => (
                  <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl border border-blue-200 gap-3 sm:gap-0">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-800 truncate">{loan.customerName}</h4>
                      <p className="text-sm text-slate-600">Loan ID: {loan.id}</p>
                      <p className="text-xs text-blue-600">Amount: {formatCurrency(loan.loanAmount)}</p>
                      <p className="text-xs text-slate-500">Daily Pay: {formatCurrency(loan.dailyPay)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-blue-600">{loan.status}</p>
                      <p className="text-sm text-slate-600">Balance: {formatCurrency(loan.balance || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No customers found in this category</p>
            )}
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-6">
      {/* Modern Header with Navigation */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text break-words">
                    Financial Command Center
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Advanced Business Intelligence Dashboard</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                    <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-300/30 text-xs sm:text-sm">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Real-time Data
                    </Badge>
                    <Badge 
                      className="bg-amber-500/20 text-amber-100 border-amber-300/30 cursor-pointer hover:bg-amber-500/30 transition-colors text-xs sm:text-sm"
                      onClick={onNavigateToLoans}
                    >
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {loans.length} Total Loans
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-100 border-purple-300/30 text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {metrics.hundredDayCustomers.length} x 100 Days
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 w-full lg:w-auto">
                <div className="text-right lg:text-right">
                  <p className="text-blue-200 text-xs sm:text-sm">Available Cash</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold break-all">{formatCurrency(metrics.availableCash)}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={downloadBalanceSheet}
                    className="bg-white text-purple-600 hover:bg-blue-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg font-semibold transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Balance Sheet
                  </Button>
                  <Button 
                    onClick={handleClearAllData}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg font-semibold transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <Trash2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Clear Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 bg-white/60 backdrop-blur-sm p-2 rounded-xl sm:rounded-2xl shadow-lg">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'customers', label: 'Customer Insights', icon: Users },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm ${
                activeSection === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {activeSection === 'overview' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Primary Metrics */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Current Balance"
              value={metrics.currentBalance}
              icon={DollarSign}
              gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500"
              subtitle="After disbursing & collections"
            />
            <MetricCard
              title="Total Inflow"
              value={metrics.totalInflow}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500"
              subtitle="Total money received"
            />
            <MetricCard
              title="Total Outflow"
              value={metrics.totalOutflow}
              icon={TrendingDown}
              gradient="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500"
              subtitle="Net given to customers"
            />
            <MetricCard
              title="Outstanding"
              value={metrics.outstandingAmount}
              icon={AlertCircle}
              gradient="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500"
              subtitle="Pending collections"
            />
          </div>

          {/* Enhanced Chart Section - Responsive Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
            <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-2xl lg:rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold flex items-center">
                  <BarChart3 className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="break-words">Customer Payment Collection Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ChartContainer
                  config={{
                    paymentDays: { label: "Payment Days", color: "#3b82f6" },
                    totalCollected: { label: "Total Collected", color: "#10b981" }
                  }}
                  className="h-[250px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="customerName" 
                        fontSize={10}
                        tick={{ fontSize: 8 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis fontSize={12} />
                      <ChartTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg">
                                <p className="font-semibold">{data.fullName}</p>
                                <p className="text-blue-600">Payment Days: {data.paymentDays}</p>
                                <p className="text-green-600">Total Collected: {formatCurrency(data.totalCollected)}</p>
                                <p className="text-slate-600">Loan ID: {data.loanId}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="paymentDays" fill="#3b82f6" name="Payment Days" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-2xl lg:rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold flex items-center">
                  <PieChart className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  Customer Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {customerStatusData.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-50 to-white shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 transform hover:scale-102"
                      onClick={item.onClick}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div 
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-700 text-sm sm:text-base block truncate">{item.name}</span>
                          <p className="text-xs text-slate-500 truncate">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-lg sm:text-2xl font-bold" style={{ color: item.color }}>
                          {item.value}
                        </span>
                        <div className="w-12 sm:w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
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
        </div>
      )}

      {/* Render customer lists based on selected status */}
      {renderCustomersByStatus()}

      {activeSection === 'analytics' && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-2xl lg:rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-bold">Collection Trends by Customer</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ChartContainer
                config={{
                  totalCollected: { label: "Total Collected", color: "#10b981" }
                }}
                className="h-[250px] sm:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="customerName" 
                      fontSize={10}
                      tick={{ fontSize: 8 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} />
                    <ChartTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg">
                              <p className="font-semibold">{data.fullName}</p>
                              <p className="text-green-600">Total Collected: {formatCurrency(data.totalCollected)}</p>
                              <p className="text-blue-600">Payment Days: {data.paymentDays}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalCollected" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm shadow-2xl border-0 rounded-2xl lg:rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-bold">Key Ratios</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl sm:rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-slate-700 text-sm sm:text-base">Collection Rate</span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                      {metrics.totalOutflow > 0 
                        ? `${((metrics.totalCollections / metrics.totalOutflow) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-2 sm:h-3">
                    <div 
                      className="bg-emerald-500 h-2 sm:h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (metrics.totalCollections / metrics.totalOutflow) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl sm:rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-slate-700 text-sm sm:text-base">Profit Margin</span>
                    <span className="text-xl sm:text-2xl font-bold text-purple-600">
                      {metrics.totalOutflow > 0 
                        ? `${((metrics.expectedProfit / metrics.totalOutflow) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2 sm:h-3">
                    <div 
                      className="bg-purple-500 h-2 sm:h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (metrics.expectedProfit / metrics.totalOutflow) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl sm:rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-slate-700 text-sm sm:text-base">Outstanding Ratio</span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">
                      {metrics.totalOutflow > 0 
                        ? `${((metrics.outstandingAmount / metrics.totalOutflow) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 sm:h-3">
                    <div 
                      className="bg-blue-500 h-2 sm:h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (metrics.outstandingAmount / metrics.totalOutflow) * 100)}%` }}
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
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
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
