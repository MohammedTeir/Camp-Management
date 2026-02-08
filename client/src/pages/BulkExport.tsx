import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { Download, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest

const BulkExport: React.FC = () => {
  const [activeTab, setActiveTab] = useState("children");
  const [isExportingChildren, setIsExportingChildren] = useState(false);
  const [isExportingPregnantWomen, setIsExportingPregnantWomen] = useState(false);

  const handleExport = async (type: "children" | "pregnant-women") => {
    let url = "";
    let fileName = "";
    if (type === "children") {
      url = `${api.bulk.childrenExport.path}`;
      fileName = "تصدير-الأطفال.xlsx";
      setIsExportingChildren(true);
    } else {
      url = `${api.bulk.pregnantWomenExport.path}`;
      fileName = "تصدير-الحوامل.xlsx";
      setIsExportingPregnantWomen(true);
    }

    try {
      const response = await apiRequest('GET', url); // Use apiRequest
      // apiRequest already throws if response is not ok, so no need for !response.ok check here
      // But we need to handle the blob for file download

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "تم بنجاح",
        description: "تم التصدير بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في التصدير",
        variant: "destructive",
      });
    } finally {
      if (type === "children") {
        setIsExportingChildren(false);
      } else {
        setIsExportingPregnantWomen(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-center">تصدير جماعي</h1>

      <Tabs defaultValue="children" className="w-full max-w-3xl mx-auto" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="children">تصدير بيانات الأطفال</TabsTrigger>
          <TabsTrigger value="pregnant-women">تصدير بيانات الحوامل</TabsTrigger>
        </TabsList>

        <TabsContent value="children" className="p-6 border rounded-md text-center">
          <h2 className="text-2xl font-semibold mb-6">تصدير بيانات الأطفال</h2>
          <p className="text-muted-foreground mb-6">
            اضغط على الزر أدناه لتحميل جميع السجلات كملف إكسل.
          </p>
          <Button
            onClick={() => handleExport("children")}
            disabled={isExportingChildren}
            className="w-full max-w-xs"
          >
            {isExportingChildren ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
            {isExportingChildren ? "جاري التصدير..." : "تصدير بيانات الأطفال"}
          </Button>
        </TabsContent>

        <TabsContent value="pregnant-women" className="p-6 border rounded-md text-center">
          <h2 className="text-2xl font-semibold mb-6">تصدير بيانات الحوامل</h2>
          <p className="text-muted-foreground mb-6">
            اضغط على الزر أدناه لتحميل جميع السجلات كملف إكسل.
          </p>
          <Button
            onClick={() => handleExport("pregnant-women")}
            disabled={isExportingPregnantWomen}
            className="w-full max-w-xs"
          >
            {isExportingPregnantWomen ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
            {isExportingPregnantWomen ? "جاري التصدير..." : "تصدير بيانات الحوامل"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkExport;
