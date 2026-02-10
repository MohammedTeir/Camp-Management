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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getAccessToken } from "@/lib/auth-utils";
import { insertChildSchema, InsertChild, Camp } from "@shared/schema";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

const AddChild: React.FC = () => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { direction } = useLanguage();

  const form = useForm<InsertChild>({
    resolver: zodResolver(insertChildSchema),
    defaultValues: {
      fullName: "",
      idNumber: "",
      dateOfBirth: "",
      gender: "male",
      healthStatus: "",
      fatherName: "",
      fatherId: "",
      motherName: "",
      motherId: "",
      motherDateOfBirth: "",
      motherHealthStatus: "",
      contactNumber: "",
      isBreastfeeding: false,
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

  const addChildMutation = useMutation({
    mutationFn: async (data: InsertChild) => {
      const token = getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(api.children.create.path, {
        method: api.children.create.method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في إضافة الطفل");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "نجاح!",
        description: "تمت إضافة سجل الطفل بنجاح.",
      });
      queryClient.invalidateQueries({ queryKey: [api.children.list.path] }); // Use consistent query key with the hook
      queryClient.invalidateQueries({ queryKey: ["childrenLookup"] }); // Invalidate lookup queries
      setLocation("/children");
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
    addChildMutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8" dir={direction}>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">إضافة سجل طفل جديد</CardTitle>
          <CardDescription className="text-center">أدخل تفاصيل الطفل ووالديه أدناه.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                            <FormItem className="flex items-center space-x-2">
                              <FormControl><RadioGroupItem value="male" /></FormControl>
                              <FormLabel className="font-normal">ذكر</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl><RadioGroupItem value="female" /></FormControl>
                              <FormLabel className="font-normal">أنثى</FormLabel>
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

              <CardFooter className="flex justify-end p-0 pt-6">
                <Button type="submit" disabled={addChildMutation.isPending}>
                  {addChildMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  إضافة الطفل
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddChild;
