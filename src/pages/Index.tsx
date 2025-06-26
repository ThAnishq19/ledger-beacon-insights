
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Financial Dashboard</h1>
              <p className="text-slate-600">Track your loans, collections, and funds efficiently</p>
            </div>
            <Button 
              onClick={handleExportAll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Download className="mr-2 h-5 w-5" />
              Export All to Excel
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow-sm rounded-lg">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="loans" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Loan Summary
            </TabsTrigger>
            <TabsTrigger value="collections" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Daily Collections
            </TabsTrigger>
            <TabsTrigger value="funds" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Fund Tracker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard loans={loans} collections={collections} funds={funds} />
          </TabsContent>

          <TabsContent value="loans">
            <LoanSummary 
              loans={loans} 
              collections={collections} 
              onAddLoan={addLoan}
              onUpdateLoan={updateLoan}
            />
          </TabsContent>

          <TabsContent value="collections">
            <DailyCollections 
              collections={collections} 
              loans={loans}
              onAddCollection={addCollection} 
            />
          </TabsContent>

          <TabsContent value="funds">
            <FundTracker funds={funds} onAddFund={addFund} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
