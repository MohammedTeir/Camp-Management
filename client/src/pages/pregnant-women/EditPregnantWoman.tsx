import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getAccessToken } from "@/lib/auth-utils";
import {
  insertPregnantWomanSchema,
  InsertPregnantWoman,
  PregnantWoman,
  Camp,
} from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { useRoute, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

const editPregnantWomanSchema = insertPregnantWomanSchema.partial(); // Allow partial updates

const EditPregnantWoman: React.FC = () => {
  const [match, params] = useRoute("/pregnant-women/:id/edit");
  const pregnantWomanId = params?.id ? Number(params.id) : null;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch existing pregnant woman data
  const { data: pregnantWomanData, isLoading: isLoadingPregnantWoman, isError: isErrorPregnantWoman, error: pregnantWomanError } = useQuery<PregnantWoman>({
    queryKey: ["pregnantWoman", pregnantWomanId],
    queryFn: async () => {
      if (!pregnantWomanId) throw new Error("معرف المرأة الحامل مفقود.");
      const token = getAccessToken();
      const headers: HeadersInit = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(buildUrl(api.pregnantWomen.get.path, { id: pregnantWomanId }), { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل جلب بيانات المرأة الحامل.");
      }
      return response.json();
    },
    enabled: !!pregnantWomanId, // Only fetch if pregnantWomanId is available
  });

  // Fetch camps for dropdown
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
        throw new Error("فشل جلب المخيمات");
      }
      return response.json();
    },
  });

  const form = useForm<InsertPregnantWoman>({
    resolver: zodResolver(editPregnantWomanSchema),
    defaultValues: {
        // Default values will be set by useEffect
    },
  });

  // Populate form with fetched data
  useEffect(() => {
    if (pregnantWomanData) {
      form.reset({
        fullName: pregnantWomanData.fullName,
        idNumber: pregnantWomanData.idNumber,
        dateOfBirth: pregnantWomanData.dateOfBirth || "", // New field
        healthStatus: pregnantWomanData.healthStatus,
        pregnancyMonth: pregnantWomanData.pregnancyMonth,
        spouseName: pregnantWomanData.spouseName,
        spouseId: pregnantWomanData.spouseId,
        contactNumber: pregnantWomanData.contactNumber || "", // New field
        notes: pregnantWomanData.notes || "", // Renamed from healthNotes
        campId: pregnantWomanData.campId || undefined,
      });
    }
  }, [pregnantWomanData, form]);

  const updatePregnantWomanMutation = useMutation({
    mutationFn: async (data: Partial<InsertPregnantWoman>) => {
      if (!pregnantWomanId) throw new Error("معرف المرأة الحامل مفقود للتحديث.");
      const token = getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(buildUrl(api.pregnantWomen.update.path, { id: pregnantWomanId }), {
        method: api.pregnantWomen.update.method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل تحديث سجل المرأة الحامل.");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "نجاح!",
        description: "تم تحديث سجل المرأة الحامل بنجاح.",
      });
      queryClient.invalidateQueries({ queryKey: ["pregnantWoman", pregnantWomanId] }); // Invalidate single record cache
      queryClient.invalidateQueries({ queryKey: [api.pregnantWomen.list.path] }); // Use consistent query key with the hook
      queryClient.invalidateQueries({ queryKey: ["pregnantWomenLookup"] }); // Invalidate lookup queries
      setLocation("/pregnant-women"); // Redirect to list
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
    updatePregnantWomanMutation.mutate(data);
  };

  if (isLoadingPregnantWoman || isLoadingCamps) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-theme(spacing.16))]" dir="rtl">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (isErrorPregnantWoman) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500" dir="rtl">
        <h1 className="text-2xl font-bold">خطأ في تحميل سجل المرأة الحامل</h1>
        <p>{pregnantWomanError?.message || "حدث خطأ غير متوقع أثناء جلب البيانات."}</p>
        <Button onClick={() => setLocation("/pregnant-women")} className="mt-4">
          العودة إلى قائمة النساء الحوامل
        </Button>
      </div>
    );
  }

  if (!pregnantWomanId || !pregnantWomanData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500" dir="rtl">
        <h1 className="text-2xl font-bold">المرأة الحامل غير موجودة</h1>
        <p>تعذر العثور على السجل المطلوب أو أن المعرف غير صحيح.</p>
        <Button onClick={() => setLocation("/pregnant-women")} className="mt-4">
          العودة إلى قائمة النساء الحوامل
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">تعديل سجل المرأة الحامل</CardTitle>
              <CardDescription className="text-center">قم بتعديل تفاصيل المرأة الحامل وزوجها أدناه.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">المعلومات الشخصية</h3>
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
                </div>
              </div>

              {/* Spouse Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">معلومات الزوج</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">معلومات إضافية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
            </CardContent>
            <CardFooter className="flex justify-center p-0 pt-6">
              <Button type="submit" disabled={updatePregnantWomanMutation.isPending}>
                {updatePregnantWomanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تحديث سجل المرأة الحامل
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default EditPregnantWoman;

