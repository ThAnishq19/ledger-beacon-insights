
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, TrendingUp, Wallet, PieChart } from "lucide-react";
import LoanSummary from "@/components/LoanSummary";
import DailyCollections from "@/components/DailyCollections";
import FundTracker from "@/components/FundTracker";
import Dashboard from "@/components/Dashboard";
import { exportToExcel } from "@/utils/excelExport";
import { useFinanceData } from "@/hooks/useFinanceData";

const Index = () => {
  const { 
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
    getLoanCashFlow
  } = useFinanceData();

  const handleExportAll = () => {
    exportToExcel(loans, collections, funds);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6">
        {/* Premium Header - Light Theme */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 border border-blue-200 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 xl:p-8 shadow-lg">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 lg:space-x-4 w-full xl:w-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent break-words">
                    Financial Dashboard
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-sm lg:text-base xl:text-lg break-words">Professional lending business management platform</p>
                </div>
              </div>
              <Button 
                onClick={handleExportAll}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1 font-semibold text-xs sm:text-sm lg:text-base w-full xl:w-auto"
              >
                <Download className="mr-1 sm:mr-2 lg:mr-3 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <span className="hidden sm:inline">Export All to Excel</span>
                <span className="sm:hidden">Export Excel</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Tabs - Light Theme */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-6 lg:mb-8 bg-white shadow-lg rounded-lg sm:rounded-xl lg:rounded-2xl p-1 sm:p-2 border border-slate-200 gap-1 sm:gap-0">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-md sm:rounded-lg lg:rounded-xl font-semibold py-2 sm:py-3 transition-all duration-200 text-xs sm:text-sm text-slate-700 hover:bg-slate-100"
            >
              <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </TabsTrigger>
            <TabsTrigger 
              value="loans" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-md sm:rounded-lg lg:rounded-xl font-semibold py-2 sm:py-3 transition-all duration-200 text-xs sm:text-sm text-slate-700 hover:bg-slate-100"
            >
              <Wallet className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Loan Summary</span>
              <span className="sm:hidden">Loans</span>
            </TabsTrigger>
            <TabsTrigger 
              value="collections" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md sm:rounded-lg lg:rounded-xl font-semibold py-2 sm:py-3 transition-all duration-200 text-xs sm:text-sm text-slate-700 hover:bg-slate-100"
            >
              <TrendingUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Collections</span>
              <span className="sm:hidden">Collect</span>
            </TabsTrigger>
            <TabsTrigger 
              value="funds" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-md sm:rounded-lg lg:rounded-xl font-semibold py-2 sm:py-3 transition-all duration-200 text-xs sm:text-sm text-slate-700 hover:bg-slate-100"
            >
              <PieChart className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Fund Tracker</span>
              <span className="sm:hidden">Funds</span>
            </TabsTrigger>
          </TabsList>

          <div className="w-full overflow-hidden">
            <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 w-full">
              <Dashboard loans={loans} collections={collections} funds={funds} />
            </TabsContent>

            <TabsContent value="loans" className="space-y-4 sm:space-y-6 w-full">
              <LoanSummary 
                loans={loans} 
                collections={collections} 
                onAddLoan={addLoan}
                onUpdateLoan={updateLoan}
                deleteLoan={deleteLoan}
                toggleLoanStatus={toggleLoanStatus}
                getLoanCashFlow={getLoanCashFlow}
                addBulkCollection={addBulkCollection}
              />
            </TabsContent>

            <TabsContent value="collections" className="space-y-4 sm:space-y-6 w-full">
              <DailyCollections 
                collections={collections} 
                loans={loans}
                onAddCollection={addCollection} 
              />
            </TabsContent>

            <TabsContent value="funds" className="space-y-4 sm:space-y-6 w-full">
              <FundTracker 
                funds={funds} 
                loans={loans}
                collections={collections}
                onAddFund={addFund} 
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
