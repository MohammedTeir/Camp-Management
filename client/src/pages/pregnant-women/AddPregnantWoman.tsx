import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getAccessToken } from "@/lib/auth-utils";
import { insertPregnantWomanSchema, InsertPregnantWoman, Camp } from "@shared/schema";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

const AddPregnantWoman: React.FC = () => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { direction } = useLanguage();

  const form = useForm<InsertPregnantWoman>({
    resolver: zodResolver(insertPregnantWomanSchema),
    defaultValues: {
      fullName: "",
      idNumber: "",
      dateOfBirth: "", // New field
      healthStatus: "",
      pregnancyMonth: 1,
      spouseName: "",
      spouseId: "",
      contactNumber: "", // New field
      notes: "", // Renamed from healthNotes
      campId: undefined,
    },
  });

  const { data: camps, isLoading: isLoadingCamps } = useQuery<Camp[]>({
    queryKey: ["camps"],
    queryFn: async () => {
      const token = getAccessToken();
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(api.camps.list.path, { headers });
      if (!response.ok) {
        throw new Error("فشل في جلب المخيمات");
      }
      return response.json();
    },
  });

  const addPregnantWomanMutation = useMutation({
    mutationFn: async (data: InsertPregnantWoman) => {
      const token = getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(api.pregnantWomen.create.path, {
        method: api.pregnantWomen.create.method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في إضافة السيدة الحامل");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "نجاح!",
        description: "تمت إضافة سجل السيدة الحامل بنجاح.",
      });
      queryClient.invalidateQueries({ queryKey: ["pregnantWomen"] });
      setLocation("/pregnant-women");
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPregnantWoman) => {
    addPregnantWomanMutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8" dir={direction}>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">إضافة سجل سيدة حامل جديدة</CardTitle>
          <CardDescription className="text-center">أدخل تفاصيل السيدة الحامل أدناه.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الزوجة الحامل رباعي</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسمها الكامل" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم هوية الزوجة</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل رقم هويتها" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ ميلاد الزوجة</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="healthStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة الزوجة</FormLabel>
                      <FormControl>
                        <Input placeholder="مثلاً: سليمة، معاقة، مريضة - نوع المرض" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pregnancyMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شهر الحمل</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر شهراً" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 9 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={month.toString()}>
                              الشهر {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spouseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الزوج رباعي</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل الاسم الكامل للزوج" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم هوية الزوج</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل رقم هوية الزوج" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم التواصل</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل رقم التواصل" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="campId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المخيم</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر مخيماً" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCamps ? (
                            <SelectItem value="loading" disabled>جاري تحميل المخيمات...</SelectItem>
                          ) : (
                            camps?.map((camp) => (
                              <SelectItem key={camp.id} value={camp.id.toString()}>
                                {camp.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>ربط هذا السجل بمخيم اختيارياً.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>ملاحظات</FormLabel>
                      <FormControl>
                        <Textarea placeholder="أي ملاحظات إضافية..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <CardFooter className="flex justify-center p-0 pt-6">
                <Button type="submit" disabled={addPregnantWomanMutation.isPending}>
                  {addPregnantWomanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  إضافة سيدة حامل
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddPregnantWoman;
