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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  insertChildSchema,
  InsertChild,
  Child,
  Camp,
} from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { useRoute, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

const editChildSchema = insertChildSchema.partial(); // Allow partial updates

const EditChild: React.FC = () => {
  const [match, params] = useRoute("/children/:id/edit");
  const childId = params?.id ? Number(params.id) : null;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch existing child data
  const { data: childData, isLoading: isLoadingChild, isError: isErrorChild, error: childError } = useQuery<Child>({
    queryKey: ["child", childId],
    queryFn: async () => {
      if (!childId) throw new Error("معرف الطفل مفقود.");
      const token = getAccessToken();
      const headers: HeadersInit = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(buildUrl(api.children.get.path, { id: childId }), { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل جلب بيانات الطفل.");
      }
      return response.json();
    },
    enabled: !!childId, // Only fetch if childId is available
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

  const form = useForm<InsertChild>({
    resolver: zodResolver(editChildSchema),
    defaultValues: {
        // Default values will be set by useEffect
    },
  });

  // Populate form with fetched data
  useEffect(() => {
    if (childData) {
      form.reset({
        fullName: childData.fullName,
        idNumber: childData.idNumber,
        dateOfBirth: childData.dateOfBirth,
        gender: childData.gender,
        healthStatus: childData.healthStatus,
        fatherName: childData.fatherName,
        fatherId: childData.fatherId,
        motherName: childData.motherName,
        motherId: childData.motherId,
        motherDateOfBirth: childData.motherDateOfBirth || "", // New field
        isBreastfeeding: childData.isBreastfeeding,
        motherHealthStatus: childData.motherHealthStatus || "", // New field
        contactNumber: childData.contactNumber || "", // New field
        notes: childData.notes || "", // Renamed from healthNotes
        campId: childData.campId || undefined,
      });
    }
  }, [childData, form]);

  const updateChildMutation = useMutation({
    mutationFn: async (data: Partial<InsertChild>) => {
      if (!childId) throw new Error("معرف الطفل مفقود للتحديث.");
      const token = getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(buildUrl(api.children.update.path, { id: childId }), {
        method: api.children.update.method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل تحديث سجل الطفل.");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "نجاح!",
        description: "تم تحديث سجل الطفل بنجاح.",
      });
      queryClient.invalidateQueries({ queryKey: ["child", childId] }); // Invalidate single child cache
      queryClient.invalidateQueries({ queryKey: [api.children.list.path] }); // Use consistent query key with the hook
      queryClient.invalidateQueries({ queryKey: ["childrenLookup"] }); // Invalidate lookup queries
      setLocation("/children"); // Redirect to children list
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertChild) => {
    updateChildMutation.mutate(data);
  };

  if (isLoadingChild || isLoadingCamps) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-theme(spacing.16))]" dir="rtl">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (isErrorChild) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500" dir="rtl">
        <h1 className="text-2xl font-bold">خطأ في تحميل سجل الطفل</h1>
        <p>{childError?.message || "حدث خطأ غير متوقع أثناء جلب بيانات الطفل."}</p>
        <Button onClick={() => setLocation("/children")} className="mt-4">
          العودة إلى قائمة الأطفال
        </Button>
      </div>
    );
  }

  if (!childId || !childData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500" dir="rtl">
        <h1 className="text-2xl font-bold">الطفل غير موجود</h1>
        <p>تعذر العثور على سجل الطفل المطلوب أو أن المعرف غير صحيح.</p>
        <Button onClick={() => setLocation("/children")} className="mt-4">
          العودة إلى قائمة الأطفال
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
              <CardTitle className="text-2xl text-center">تعديل سجل الطفل</CardTitle>
              <CardDescription className="text-center">قم بتعديل تفاصيل الطفل ووالديه أدناه.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Child Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">معلومات الطفل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الطفل رباعي</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل الاسم الكامل للطفل" {...field} />
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
                        <FormLabel>رقم هوية الطفل</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل رقم هوية الطفل" {...field} />
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
                        <FormLabel>تاريخ ميلاد الطفل</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>الرجاء إدخال تاريخ ميلاد الطفل.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>الجنس</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value ?? ""}
                            className="flex gap-4"
                          >
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="male" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                ذكر
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="female" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                أنثى
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
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
                        <FormLabel>حالة الطفل</FormLabel>
                        <FormControl>
                          <Input placeholder="مثلاً: سليم، معاق، مريض - نوع المرض" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Parent Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">معلومات الوالدين</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الاب رباعي</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل الاسم الكامل للأب" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fatherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم هوية الاب</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل رقم هوية الأب" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الام رباعي</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل الاسم الكامل للأم" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم هوية الام</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل رقم هوية الأم" {...field} />
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
                    name="motherDateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ ميلاد الام</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motherHealthStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حالة الام</FormLabel>
                        <FormControl>
                          <Input placeholder="مثلاً: سليمة، معاقة، مريضة - نوع المرض" {...field} />
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
                          <Textarea placeholder="أي ملاحظات إضافية للطفل..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isBreastfeeding"
                    render={({ field }) => (
                      <FormItem className="flex flex-row-reverse items-center justify-between rounded-lg border p-4 md:col-span-2">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">هل الام مرضعة نعم ام لا</FormLabel>
                          <FormDescription>حدد إذا كانت الأم ترضع طفلها حاليًا.</FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center p-0 pt-6">
              <Button type="submit" disabled={updateChildMutation.isPending}>
                {updateChildMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تحديث سجل الطفل
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default EditChild;
