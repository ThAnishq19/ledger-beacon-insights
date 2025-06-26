
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
  const { loans, collections, funds, addLoan, addCollection, addFund, updateLoan } = useFinanceData();

  const handleExportAll = () => {
    exportToExcel(loans, collections, funds);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    Financial Dashboard
                  </h1>
                  <p className="text-slate-300 text-lg">Professional lending business management platform</p>
                </div>
              </div>
              <Button 
                onClick={handleExportAll}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1 font-semibold"
              >
                <Download className="mr-3 h-5 w-5" />
                Export All to Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow-xl rounded-2xl p-2 border-0">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-xl font-semibold py-3 transition-all duration-200"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="loans" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl font-semibold py-3 transition-all duration-200"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Loan Summary
            </TabsTrigger>
            <TabsTrigger 
              value="collections" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-xl font-semibold py-3 transition-all duration-200"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Collections
            </TabsTrigger>
            <TabsTrigger 
              value="funds" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl font-semibold py-3 transition-all duration-200"
            >
              <PieChart className="mr-2 h-4 w-4" />
              Fund Tracker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard loans={loans} collections={collections} funds={funds} />
          </TabsContent>

          <TabsContent value="loans" className="space-y-6">
            <LoanSummary 
              loans={loans} 
              collections={collections} 
              onAddLoan={addLoan}
              onUpdateLoan={updateLoan}
            />
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            <DailyCollections 
              collections={collections} 
              loans={loans}
              onAddCollection={addCollection} 
            />
          </TabsContent>

          <TabsContent value="funds" className="space-y-6">
            <FundTracker 
              funds={funds} 
              loans={loans}
              collections={collections}
              onAddFund={addFund} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
