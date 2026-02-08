import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { api, bulkImportResponseSchema } from "@shared/routes";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { getAccessToken } from "@/lib/auth-utils";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const BulkImport: React.FC = () => {
  const [activeTab, setActiveTab] = useState("children");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setImportResult(null); // Clear previous results on new file selection
    } else {
      setSelectedFile(null);
    }
  };

  const childrenImportMutation = useMutation({
    mutationFn: async (data: { fileContent: string; fileName: string }) => {
      const token = getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(api.bulk.childrenImport.path, {
        method: api.bulk.childrenImport.method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import child records.");
      }
      return api.bulk.childrenImport.responses[200].parse(await response.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.success} records, ${data.failed} failed.`,
        variant: data.failed > 0 ? "destructive" : "default",
      });
      setImportResult(data);
      setSelectedFile(null); // Clear file input
    },
    onError: (error) => {
      toast({
        title: "Import Error",
        description: error.message || "An unexpected error occurred during import.",
        variant: "destructive",
      });
      setImportResult({ success: 0, failed: 0, errors: [error.message || "Unknown error"] });
    },
  });

  const pregnantWomenImportMutation = useMutation({
    mutationFn: async (data: { fileContent: string; fileName: string }) => {
      const token = getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(api.bulk.pregnantWomenImport.path, {
        method: api.bulk.pregnantWomenImport.method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import pregnant woman records.");
      }
      return api.bulk.pregnantWomenImport.responses[200].parse(await response.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.success} records, ${data.failed} failed.`,
        variant: data.failed > 0 ? "destructive" : "default",
      });
      setImportResult(data);
      setSelectedFile(null); // Clear file input
    },
    onError: (error) => {
      toast({
        title: "Import Error",
        description: error.message || "An unexpected error occurred during import.",
        variant: "destructive",
      });
      setImportResult({ success: 0, failed: 0, errors: [error.message || "Unknown error"] });
    },
  });

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to import.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Content = e.target?.result as string;
      const payload = {
        fileContent: base64Content,
        fileName: selectedFile.name,
      };

      if (activeTab === "children") {
        childrenImportMutation.mutate(payload);
      } else {
        pregnantWomenImportMutation.mutate(payload);
      }
    };
    reader.onerror = () => {
      toast({
        title: "File Read Error",
        description: "Failed to read the selected file.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(selectedFile); // Read file as base64 data URL
  };

  const isImporting = childrenImportMutation.isPending || pregnantWomenImportMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-center">استيراد البيانات الجماعي</h1>

      <Tabs defaultValue="children" className="w-full max-w-3xl mx-auto" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="children">استيراد سجلات الأطفال</TabsTrigger>
          <TabsTrigger value="pregnant-women">استيراد سجلات النساء الحوامل</TabsTrigger>
        </TabsList>

        <TabsContent value="children" className="p-6 border rounded-md">
          <h2 className="text-2xl font-semibold mb-6">استيراد سجلات الأطفال</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="children-file">رفع ملف إكسل (.xlsx)</Label>
              <Input id="children-file" type="file" accept=".xlsx" onChange={handleFileChange} />
              <p className="text-sm text-muted-foreground mt-1">
                قم برفع ملف إكسل يحتوي على بيانات الأطفال.
              </p>
            </div>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="w-full"
            >
              {isImporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              {isImporting ? "جاري الاستيراد..." : "استيراد بيانات الأطفال"}
            </Button>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">
                هل تحتاج نموذج؟ قم بتنزيل النموذج الرسمي لسجلات الأطفال.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  try {
                    const token = getAccessToken();
                    const response = await fetch(`${api.bulk.childrenTemplate.path}?locale=ar`, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    
                    if (!response.ok) {
                      throw new Error('فشل في تنزيل النموذج');
                    }
                    
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.setAttribute('download', 'نموذج-استيراد-الأطفال.xlsx');
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(downloadUrl);
                    
                    toast({
                      title: "تم تنزيل النموذج",
                      description: "تم تنزيل نموذج استيراد الأطفال بنجاح",
                    });
                  } catch (error: any) {
                    toast({
                      title: "خطأ في التنزيل",
                      description: error.message || "فشل في تنزيل نموذج الأطفال",
                      variant: "destructive",
                    });
                  }
                }}
              >
                تنزيل نموذج الأطفال
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pregnant-women" className="p-6 border rounded-md">
          <h2 className="text-2xl font-semibold mb-6">استيراد سجلات النساء الحوامل</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pregnant-women-file">رفع ملف إكسل (.xlsx)</Label>
              <Input id="pregnant-women-file" type="file" accept=".xlsx" onChange={handleFileChange} />
              <p className="text-sm text-muted-foreground mt-1">
                قم برفع ملف إكسل يحتوي على بيانات النساء الحوامل.
              </p>
            </div>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="w-full"
            >
              {isImporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              {isImporting ? "جاري استيراد بيانات النساء الحوامل..." : "استيراد بيانات النساء الحوامل"}
            </Button>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">
                هل تحتاج نموذج؟ قم بتنزيل النموذج الرسمي لسجلات النساء الحوامل.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  try {
                    const token = getAccessToken();
                    const response = await fetch(`${api.bulk.pregnantWomenTemplate.path}?locale=ar`, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    
                    if (!response.ok) {
                      throw new Error('فشل في تنزيل النموذج');
                    }
                    
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.setAttribute('download', 'نموذج-استيراد-الحوامل.xlsx');
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(downloadUrl);
                    
                    toast({
                      title: "تم تنزيل النموذج",
                      description: "تم تنزيل نموذج استيراد النساء الحوامل بنجاح",
                    });
                  } catch (error: any) {
                    toast({
                      title: "خطأ في التنزيل",
                      description: error.message || "فشل في تنزيل نموذج النساء الحوامل",
                      variant: "destructive",
                    });
                  }
                }}
              >
                تنزيل نموذج النساء الحوامل
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {importResult && (
        <div className="mt-8 p-6 border rounded-md bg-card max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">ملخص الاستيراد</h2>
          <p className="text-lg"><strong>السجلات الناجحة:</strong> <span className="text-green-600">{importResult.success}</span></p>
          <p className="text-lg"><strong>السجلات الفاشلة:</strong> <span className="text-red-600">{importResult.failed}</span></p>
          {importResult.errors.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xl font-medium text-red-600">الأخطاء:</h3>
              <ul className="list-disc pr-5 text-red-500 max-h-40 overflow-y-auto border p-2 rounded-md">
                {importResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkImport;
