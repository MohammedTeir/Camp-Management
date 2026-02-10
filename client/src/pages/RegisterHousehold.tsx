import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAccessToken } from "@/lib/auth-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  insertChildSchema,
  insertPregnantWomanSchema,
  InsertChild,
  InsertPregnantWoman,
  Camp,
} from "@shared/schema";
import { api } from "@shared/routes";

// Enhanced validation schemas for client-side validation
const childFormSchema = insertChildSchema.extend({
  fullName: z.string().min(1, "اسم الطفل مطلوب"),
  idNumber: z.string().min(1, "رقم هوية الطفل مطلوب"),
  dateOfBirth: z.string().min(1, "تاريخ ميلاد الطفل مطلوب"),
  gender: z.enum(["male", "female"], { 
    errorMap: () => ({ message: "الجنس مطلوب" })
  }),
  healthStatus: z.string().min(1, "حالة الطفل مطلوبة"),
  fatherName: z.string().min(1, "اسم الاب مطلوب"),
  fatherId: z.string().min(1, "رقم هوية الاب مطلوب"),
  motherName: z.string().min(1, "اسم الام مطلوب"),
  motherId: z.string().min(1, "رقم هوية الام مطلوب"),
  contactNumber: z.string().min(1, "رقم التواصل مطلوب"),
  campId: z.number().int().positive("مكان النزوح مطلوب"),
});

const pregnantWomanFormSchema = insertPregnantWomanSchema.extend({
  fullName: z.string().min(1, "اسم المرأة الحامل مطلوب"),
  idNumber: z.string().min(1, "رقم هوية المرأة مطلوب"),
  healthStatus: z.string().min(1, "حالة المرأة مطلوبة"),
  pregnancyMonth: z.number().int().min(1).max(9, "يجب أن يكون شهر الحمل بين 1 و 9"),
  spouseName: z.string().min(1, "اسم الزوج مطلوب"),
  spouseId: z.string().min(1, "رقم هوية الزوج مطلوب"),
  contactNumber: z.string().min(1, "رقم التواصل مطلوب"),
  campId: z.number().int().positive("مكان النزوح مطلوب"),
});

const RegisterHousehold: React.FC = () => {
  const [activeTab, setActiveTab] = useState("child");

  const childForm = useForm<InsertChild>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      fullName: "",
      idNumber: "",
      dateOfBirth: "",
      gender: "male", // Default value
      healthStatus: "",
      fatherName: "",
      fatherId: "",
      motherName: "",
      motherId: "",
      motherDateOfBirth: "",
      isBreastfeeding: false,
      motherHealthStatus: "",
      contactNumber: "",
      notes: "",
      campId: undefined,
    },
  });

  const pregnantWomanForm = useForm<InsertPregnantWoman>({
    resolver: zodResolver(pregnantWomanFormSchema),
    defaultValues: {
      fullName: "",
      idNumber: "",
      dateOfBirth: "",
      healthStatus: "",
      pregnancyMonth: 1, // Default value
      spouseName: "",
      spouseId: "",
      contactNumber: "",
      notes: "",
      campId: undefined,
    },
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
        throw new Error("Failed to fetch camps");
      }
      return response.json();
    },
  });

  const registerChildMutation = useMutation({
    mutationFn: async (data: InsertChild) => {
      const token = getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
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
        throw new Error(errorData.message || "Failed to register child");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Child record registered successfully.",
      });
      childForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const registerPregnantWomanMutation = useMutation({
    mutationFn: async (data: InsertPregnantWoman) => {
      const token = getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
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
        throw new Error(errorData.message || "Failed to register pregnant woman");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Pregnant woman record registered successfully.",
      });
      pregnantWomanForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const onChildSubmit = (data: InsertChild) => {
    registerChildMutation.mutate(data);
  };

  const onPregnantWomanSubmit = (data: InsertPregnantWoman) => {
    registerPregnantWomanMutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-center">تسجيل الأسرة</h1>

      <Tabs defaultValue="child" className="w-full max-w-2xl mx-auto" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="child">تسجيل الطفل والأم</TabsTrigger>
          <TabsTrigger value="pregnant-woman">تسجيل المرأة الحامل</TabsTrigger>
        </TabsList>
        <TabsContent value="child" className="p-6 border rounded-md" dir="rtl">
          <h2 className="text-2xl font-semibold mb-6">تسجيل الطفل والأم</h2>
          <Form {...childForm}>
            <form onSubmit={childForm.handleSubmit(onChildSubmit)} className="space-y-4">
              {/* Child Information */}
              <h3 className="text-xl font-medium mt-6 mb-4">بيانات الشخصية</h3>
              <FormField
                control={childForm.control}
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
                control={childForm.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم هوية الطفل</FormLabel>
                    <FormControl>
                      <Input placeholder="رقم هوية الطفل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={childForm.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ ميلاد الطفل</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>في حال فقدان الأوراق، اتركه فارغًا</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={childForm.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>الجنس</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="male" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            ذكر
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
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
                control={childForm.control}
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

              {/* Parent Information */}
              <h3 className="text-xl font-medium mt-6 mb-4">بيانات الوالدين</h3>
              <FormField
                control={childForm.control}
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
                control={childForm.control}
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
                control={childForm.control}
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
                control={childForm.control}
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
              <FormField
                control={childForm.control}
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
                control={childForm.control}
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
                control={childForm.control}
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
                control={childForm.control}
                name="isBreastfeeding"
                render={({ field }) => (
                  <FormItem className="flex flex-row-reverse items-center justify-between rounded-lg border p-4">
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
              <FormField
                control={childForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات</FormLabel>
                    <FormControl>
                      <Textarea placeholder="أي ملاحظات إضافية للطفل..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Camp Selection */}
              <h3 className="text-xl font-medium mt-6 mb-4">المكان</h3>
              <FormField
                control={childForm.control}
                name="campId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مكان النزوح</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مكان النزوح" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingCamps ? (
                          <SelectItem value="loading" disabled>جارٍ التحميل...</SelectItem>
                        ) : (
                          camps?.map((camp) => (
                            <SelectItem key={camp.id} value={camp.id.toString()}>
                              {camp.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      اختر المخيم أو مكان السكن الحالي
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={registerChildMutation.isPending}>
                {registerChildMutation.isPending ? "جارٍ الحفظ..." : "تسجيل بيانات الطفل"}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="pregnant-woman" className="p-6 border rounded-md" dir="rtl">
          <h2 className="text-2xl font-semibold mb-6">تسجيل المرأة الحامل</h2>
          <Form {...pregnantWomanForm}>
            <form onSubmit={pregnantWomanForm.handleSubmit(onPregnantWomanSubmit)} className="space-y-4">
              {/* Pregnant Woman Information */}
              <h3 className="text-xl font-medium mt-6 mb-4">بيانات الحمل</h3>
              <FormField
                control={pregnantWomanForm.control}
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
                control={pregnantWomanForm.control}
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
                control={pregnantWomanForm.control}
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
                control={pregnantWomanForm.control}
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
                control={pregnantWomanForm.control}
                name="pregnancyMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شهر الحمل (1–9)</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="شهر الحمل (1–9)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 9 }, (_, i) => i + 1).map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {month === 1 && "الشهر الأول"}
                            {month === 2 && "الشهر الثاني"}
                            {month === 3 && "الشهر الثالث"}
                            {month === 4 && "الشهر الرابع"}
                            {month === 5 && "الشهر الخامس"}
                            {month === 6 && "الشهر السادس"}
                            {month === 7 && "الشهر السابع"}
                            {month === 8 && "الشهر الثامن"}
                            {month === 9 && "الشهر التاسع"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Spouse Information */}
              <h3 className="text-xl font-medium mt-6 mb-4">بيانات الزوج</h3>
              <FormField
                control={pregnantWomanForm.control}
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
                control={pregnantWomanForm.control}
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
                control={pregnantWomanForm.control}
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
                control={pregnantWomanForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات</FormLabel>
                    <FormControl>
                      <Textarea placeholder="أي ملاحظات إضافية..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Camp Selection */}
              <h3 className="text-xl font-medium mt-6 mb-4">المكان</h3>
              <FormField
                control={pregnantWomanForm.control}
                name="campId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مكان النزوح</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مكان النزوح" />
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
                    <FormDescription>
                      اختر المخيم أو مكان السكن الحالي
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={registerPregnantWomanMutation.isPending}>
                {registerPregnantWomanMutation.isPending ? "جارٍ الحفظ..." : "تسجيل امرأة حامل"}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegisterHousehold;
