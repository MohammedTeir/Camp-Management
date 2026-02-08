import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAccessToken } from "@/lib/auth-utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Child,
  PregnantWoman,
  insertChildSchema,
  insertPregnantWomanSchema,
  InsertChild,
  InsertPregnantWoman,
  Camp,
} from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { Loader2, Edit2, Trash2 } from "lucide-react";

// Zod schemas for lookup forms
const childLookupSchema = z.object({
  parentId: z.string().min(1, "رقم الهوية مطلوب"),
});

const pregnantWomanLookupSchema = z.object({
  spouseId: z.string().min(1, "رقم الهوية مطلوب"),
});

const editChildSchema = insertChildSchema.partial();
const editPregnantWomanSchema = insertPregnantWomanSchema.partial();

const LookupHousehold: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("child-lookup");
  const [childParentId, setChildParentId] = useState<string | null>(null);
  const [pregnantWomanSpouseId, setPregnantWomanSpouseId] = useState<string | null>(null);

  const [isEditChildDialogOpen, setIsEditChildDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [childToDelete, setChildToDelete] = useState<number | null>(null);

  const [isEditPregnantWomanDialogOpen, setIsEditPregnantWomanDialogOpen] = useState(false);
  const [editingPregnantWoman, setEditingPregnantWoman] = useState<PregnantWoman | null>(null);
  const [pregnantWomanToDelete, setPregnantWomanToDelete] = useState<number | null>(null);

  const childLookupForm = useForm<z.infer<typeof childLookupSchema>>({
    resolver: zodResolver(childLookupSchema),
    defaultValues: {
      parentId: "",
    },
  });

  const pregnantWomanLookupForm = useForm<z.infer<typeof pregnantWomanLookupSchema>>({
    resolver: zodResolver(pregnantWomanLookupSchema),
    defaultValues: {
      spouseId: "",
    },
  });

  const editChildForm = useForm<InsertChild>({
    resolver: zodResolver(editChildSchema),
  });

  const editPregnantWomanForm = useForm<InsertPregnantWoman>({
    resolver: zodResolver(editPregnantWomanSchema),
  });

  // Fetch camps for dropdown (used in edit forms)
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

  // Query for Child Records
  const { data: childRecords, isLoading: isLoadingChildRecords, isError: isErrorChildRecords, error: childLookupError, refetch: refetchChildRecords } = useQuery<Child[]>({
    queryKey: ["childrenLookup", childParentId],
    queryFn: async () => {
      if (!childParentId) return [];
      const token = getAccessToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`${api.children.lookup.path}?parentId=${childParentId}`, { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل البحث عن سجلات الأطفال");
      }
      return response.json();
    },
    enabled: !!childParentId, // Only run query if parentId is available
  });

  // Query for Pregnant Woman Records
  const { data: pregnantWomanRecords, isLoading: isLoadingPregnantWomanRecords, isError: isErrorPregnantWomanRecords, error: pregnantWomanLookupError, refetch: refetchPregnantWomanRecords } = useQuery<PregnantWoman[]>({
    queryKey: ["pregnantWomanLookup", pregnantWomanSpouseId],
    queryFn: async () => {
      if (!pregnantWomanSpouseId) return [];
      const token = getAccessToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`${api.pregnantWomen.lookup.path}?spouseId=${pregnantWomanSpouseId}`, { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل البحث عن سجلات النساء الحوامل");
      }
      return response.json();
    },
    enabled: !!pregnantWomanSpouseId, // Only run query if spouseId is available
  });

  // Update Child Mutation
  const updateChildMutation = useMutation({
    mutationFn: async (data: Partial<InsertChild>) => {
      if (!editingChild) throw new Error("لا يوجد طفل محدد للتحديث.");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest" // Indicate this is an AJAX request
      };
      
      const response = await fetch(buildUrl(api.children.publicUpdate.path, { id: editingChild.id }), {
        method: api.children.publicUpdate.method,
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
      toast({ title: "تم بنجاح", description: "تم تحديث سجل الطفل بنجاح." });
      queryClient.invalidateQueries({ queryKey: ["childrenLookup", childParentId] });
      setIsEditChildDialogOpen(false);
      setEditingChild(null);
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message || "حدث خطأ غير متوقع.", variant: "destructive" });
    },
  });

  // Delete Child Mutation
  const deleteChildMutation = useMutation({
    mutationFn: async (id: number) => {
      const headers: HeadersInit = {
        "X-Requested-With": "XMLHttpRequest" // Indicate this is an AJAX request
      };
      
      const response = await fetch(buildUrl(api.children.publicDelete.path, { id }), {
        method: api.children.publicDelete.method,
        headers
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل حذف سجل الطفل.");
      }
    },
    onSuccess: () => {
      toast({ title: "تم بنجاح", description: "تم حذف سجل الطفل بنجاح." });
      queryClient.invalidateQueries({ queryKey: ["childrenLookup", childParentId] });
      setChildToDelete(null);
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message || "حدث خطأ غير متوقع.", variant: "destructive" });
    },
  });

  // Update Pregnant Woman Mutation
  const updatePregnantWomanMutation = useMutation({
    mutationFn: async (data: Partial<InsertPregnantWoman>) => {
      if (!editingPregnantWoman) throw new Error("لا توجد امرأة حامل محددة للتحديث.");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest" // Indicate this is an AJAX request
      };
      
      const response = await fetch(buildUrl(api.pregnantWomen.publicUpdate.path, { id: editingPregnantWoman.id }), {
        method: api.pregnantWomen.publicUpdate.method,
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
      toast({ title: "تم بنجاح", description: "تم تحديث سجل المرأة الحامل بنجاح." });
      queryClient.invalidateQueries({ queryKey: ["pregnantWomanLookup", pregnantWomanSpouseId] });
      setIsEditPregnantWomanDialogOpen(false);
      setEditingPregnantWoman(null);
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message || "حدث خطأ غير متوقع.", variant: "destructive" });
    },
  });

  // Delete Pregnant Woman Mutation
  const deletePregnantWomanMutation = useMutation({
    mutationFn: async (id: number) => {
      const headers: HeadersInit = {
        "X-Requested-With": "XMLHttpRequest" // Indicate this is an AJAX request
      };
      
      const response = await fetch(buildUrl(api.pregnantWomen.publicDelete.path, { id }), {
        method: api.pregnantWomen.publicDelete.method,
        headers
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل حذف سجل المرأة الحامل.");
      }
    },
    onSuccess: () => {
      toast({ title: "تم بنجاح", description: "تم حذف سجل المرأة الحامل بنجاح." });
      queryClient.invalidateQueries({ queryKey: ["pregnantWomanLookup", pregnantWomanSpouseId] });
      setPregnantWomanToDelete(null);
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message || "حدث خطأ غير متوقع.", variant: "destructive" });
    },
  });

  const onChildLookupSubmit = (data: z.infer<typeof childLookupSchema>) => {
    setChildParentId(data.parentId);
  };

  const onPregnantWomanLookupSubmit = (data: z.infer<typeof pregnantWomanLookupSchema>) => {
    setPregnantWomanSpouseId(data.spouseId);
  };

  // Populate child edit form when editingChild state changes
  useEffect(() => {
    if (editingChild) {
      editChildForm.reset({
        fullName: editingChild.fullName,
        idNumber: editingChild.idNumber,
        dateOfBirth: editingChild.dateOfBirth,
        gender: editingChild.gender,
        healthStatus: editingChild.healthStatus,
        fatherName: editingChild.fatherName,
        fatherId: editingChild.fatherId,
        motherName: editingChild.motherName,
        motherId: editingChild.motherId,
        isBreastfeeding: editingChild.isBreastfeeding,
        healthNotes: editingChild.healthNotes || "",
        campId: editingChild.campId || undefined,
      });
    }
  }, [editingChild, editChildForm]);

  // Populate pregnant woman edit form when editingPregnantWoman state changes
  useEffect(() => {
    if (editingPregnantWoman) {
      editPregnantWomanForm.reset({
        fullName: editingPregnantWoman.fullName,
        idNumber: editingPregnantWoman.idNumber,
        healthStatus: editingPregnantWoman.healthStatus,
        pregnancyMonth: editingPregnantWoman.pregnancyMonth,
        spouseName: editingPregnantWoman.spouseName,
        spouseId: editingPregnantWoman.spouseId,
        healthNotes: editingPregnantWoman.healthNotes || "",
        campId: editingPregnantWoman.campId || undefined,
      });
    }
  }, [editingPregnantWoman, editPregnantWomanForm]);

  // Handle lookup errors for toast notifications
  useEffect(() => {
    if (isErrorChildRecords) {
      toast({
        title: "خطأ في البحث عن سجلات الأطفال",
        description: childLookupError?.message || "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    }
  }, [isErrorChildRecords, childLookupError]);

  useEffect(() => {
    if (isErrorPregnantWomanRecords) {
      toast({
        title: "خطأ في البحث عن سجلات النساء الحوامل",
        description: pregnantWomanLookupError?.message || "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    }
  }, [isErrorPregnantWomanRecords, pregnantWomanLookupError]);

  const getCampName = (campId: number | undefined) => {
    if (!campId || !camps) return "غير محدد";
    const camp = camps.find(c => c.id === campId);
    return camp ? camp.name : "غير محدد";
  };

  return (
    <div className="container mx-auto px-4 py-4" dir="rtl">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">بحث وتحديث بيانات الأسر</h1>

      <Tabs defaultValue="child-lookup" className="w-full max-w-4xl mx-auto" onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="child-lookup">بحث عن أطفال</TabsTrigger>
          <TabsTrigger value="pregnant-woman-lookup">بحث عن حوامل</TabsTrigger>
        </TabsList>

        <TabsContent value="child-lookup" className="p-4 sm:p-6 border rounded-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">البحث عن سجلات الأطفال</h2>
          <Form {...childLookupForm}>
            <form onSubmit={childLookupForm.handleSubmit(onChildLookupSubmit)} className="space-y-3 mb-6">
              <FormField
                control={childLookupForm.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم هوية أحد الأبوين</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل رقم هوية الأب أو الأم" {...field} />
                    </FormControl>
                    <FormDescription>
                      يمكن أن يكون رقم هوية الأب أو الأم للبحث عن سجلات الأطفال المرتبطة.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingChildRecords} className="w-full">
                {isLoadingChildRecords ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                بحث
              </Button>
            </form>
          </Form>

          {isLoadingChildRecords && (
            <div className="flex justify-center items-center h-20">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {childRecords && childRecords.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">السجلات المكتشفة</h3>
              <Table className="text-xs sm:text-sm overflow-x-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>رقم الهوية</TableHead>
                    <TableHead>العمر</TableHead>
                    <TableHead>اسم الأم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap">{record.fullName}</TableCell>
                      <TableCell className="whitespace-nowrap">{record.idNumber}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.dateOfBirth ? (() => {
                          const birthDate = new Date(record.dateOfBirth);
                          const today = new Date();
                          
                          // Check if birth date is in the future
                          if (birthDate > today) {
                            return 'لم يولد بعد';
                          }
                          
                          // Calculate the difference in time
                          const diffTime = Math.abs(today.getTime() - birthDate.getTime());
                          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                          
                          // If less than 30 days, show in days
                          if (diffDays < 30) {
                            return `${diffDays} يوم`;
                          }
                          // If less than 365 days, show in months and days
                          else if (diffDays < 365) {
                            const months = Math.floor(diffDays / 30);
                            const remainingDays = diffDays % 30;
                            if (remainingDays > 0) {
                              return `${months} شهر و ${remainingDays} يوم`;
                            } else {
                              return `${months} شهر`;
                            }
                          }
                          // Otherwise, show in years
                          else {
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            const daysDiff = today.getDate() - birthDate.getDate();
                            
                            if (monthDiff < 0 || (monthDiff === 0 && daysDiff < 0)) {
                              age--;
                            }
                            
                            return `${age} سنة`;
                          }
                        })() : 'غير محدد'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{record.motherName || 'غير محدد'}</TableCell>
                      <TableCell>{record.healthStatus}</TableCell>
                      <TableCell className="space-x-1">
                        <Dialog open={isEditChildDialogOpen && editingChild?.id === record.id} onOpenChange={setIsEditChildDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => { setEditingChild(record); setIsEditChildDialogOpen(true); }}>
                              <Edit2 className="h-4 w-4" /> تعديل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>تعديل سجل الطفل</DialogTitle>
                            </DialogHeader>
                            <Form {...editChildForm}>
                              <form onSubmit={editChildForm.handleSubmit(updateChildMutation.mutate)} className="space-y-4 pt-4">
                                {/* Child Information */}
                                <h3 className="text-lg font-medium">معلومات الطفل</h3>
                                <FormField
                                  control={editChildForm.control}
                                  name="fullName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>الاسم الكامل</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editChildForm.control}
                                  name="idNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>رقم الهوية</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editChildForm.control}
                                  name="dateOfBirth"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>تاريخ الميلاد</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editChildForm.control}
                                  name="gender"
                                  render={({ field }) => (
                                    <FormItem className="space-y-3">
                                      <FormLabel>الجنس</FormLabel>
                                      <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
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
                                  control={editChildForm.control}
                                  name="healthStatus"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>الحالة الصحية</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {/* Parent Information */}
                                <h3 className="text-lg font-medium mt-4">معلومات الوالدين</h3>
                                <FormField
                                  control={editChildForm.control}
                                  name="fatherName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>الاسم الكامل للأب</FormLabel>
                                      <FormControl><Input {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editChildForm.control}
                                  name="fatherId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>رقم هوية الأب</FormLabel>
                                      <FormControl><Input {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editChildForm.control}
                                  name="motherName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>الاسم الكامل للأم</FormLabel>
                                      <FormControl><Input {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editChildForm.control}
                                  name="motherId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>رقم هوية الأم</FormLabel>
                                      <FormControl><Input {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editChildForm.control}
                                  name="isBreastfeeding"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                      <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel>هل ترضع الطفل؟</FormLabel>
                                        <FormDescription>
                                          حدد إذا كانت والدة الطفل ترضعه حاليًا.
                                        </FormDescription>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editChildForm.control}
                                  name="healthNotes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>ملاحظات صحية</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editChildForm.control}
                                  name="campId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>المخيم</FormLabel>
                                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="اختر مخيمًا" />
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
                                        يمكنك ربط هذا السجل بمخيم اختياريًا.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button type="submit" disabled={updateChildMutation.isPending}>
                                    {updateChildMutation.isPending ? "جاري التحديث..." : "تحديث سجل الطفل"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog open={childToDelete === record.id} onOpenChange={(open) => !open && setChildToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" onClick={() => setChildToDelete(record.id)}>
                              <Trash2 className="h-4 w-4" /> حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف سجل الطفل بشكل دائم.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteChildMutation.mutate(record.id)} className="bg-red-600">حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {childRecords && childRecords.length === 0 && childParentId && !isLoadingChildRecords && (
            <p className="text-center text-muted-foreground">لا توجد سجلات أطفال لرقم هوية أحد الأبوين المُدخل.</p>
          )}
        </TabsContent>

        <TabsContent value="pregnant-woman-lookup" className="p-4 border rounded-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">البحث عن سجلات النساء الحوامل</h2>
          <Form {...pregnantWomanLookupForm}>
            <form onSubmit={pregnantWomanLookupForm.handleSubmit(onPregnantWomanLookupSubmit)} className="space-y-3 mb-6">
              <FormField
                control={pregnantWomanLookupForm.control}
                name="spouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم هوية الزوج/الزوجة</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل رقم هوية الزوج أو الزوجة" {...field} />
                    </FormControl>
                    <FormDescription>
                      يمكن أن يكون رقم هوية الزوجة أو الزوج للبحث عن سجلات النساء الحوامل المرتبطة.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingPregnantWomanRecords} className="w-full">
                {isLoadingPregnantWomanRecords ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                بحث
              </Button>
            </form>
          </Form>

          {isLoadingPregnantWomanRecords && (
            <div className="flex justify-center items-center h-20">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {pregnantWomanRecords && pregnantWomanRecords.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">السجلات المكتشفة</h3>
              <Table className="overflow-x-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>رقم الهوية</TableHead>
                    <TableHead>اسم الزوج/الزوجة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الشهر</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pregnantWomanRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap">{record.fullName}</TableCell>
                      <TableCell className="whitespace-nowrap">{record.idNumber}</TableCell>
                      <TableCell className="whitespace-nowrap">{record.spouseName || 'غير محدد'}</TableCell>
                      <TableCell>{record.healthStatus}</TableCell>
                      <TableCell>الشهر {record.pregnancyMonth}</TableCell>
                      <TableCell className="space-x-2">
                        <Dialog open={isEditPregnantWomanDialogOpen && editingPregnantWoman?.id === record.id} onOpenChange={setIsEditPregnantWomanDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => { setEditingPregnantWoman(record); setIsEditPregnantWomanDialogOpen(true); }}>
                              <Edit2 className="h-4 w-4" /> تعديل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>تعديل سجل امرأة حامل</DialogTitle>
                            </DialogHeader>
                            <Form {...editPregnantWomanForm}>
                              <form onSubmit={editPregnantWomanForm.handleSubmit(updatePregnantWomanMutation.mutate)} className="space-y-4 pt-4">
                                {/* Pregnant Woman Information */}
                                <h3 className="text-lg font-medium">المعلومات الشخصية</h3>
                                <FormField
                                  control={editPregnantWomanForm.control}
                                  name="fullName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>الاسم الكامل</FormLabel>
                                      <FormControl><Input {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editPregnantWomanForm.control}
                                  name="idNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>رقم الهوية</FormLabel>
                                      <FormControl><Input {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editPregnantWomanForm.control}
                                  name="healthStatus"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>الحالة الصحية</FormLabel>
                                      <FormControl><Input {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editPregnantWomanForm.control}
                                  name="pregnancyMonth"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>شهر الحمل</FormLabel>
                                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                                        <FormControl>
                                          <SelectTrigger><SelectValue placeholder="اختر الشهر" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {Array.from({ length: 9 }, (_, i) => i + 1).map((month) => (
                                            <SelectItem key={month} value={month.toString()}>{`الشهر ${month}`}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {/* Spouse Information */}
                                <h3 className="text-lg font-medium mt-4">معلومات الزوج/الزوجة</h3>
                                <FormField
                                  control={editPregnantWomanForm.control}
                                  name="spouseName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>الاسم الكامل للزوج/الزوجة</FormLabel>
                                      <FormControl><Input {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editPregnantWomanForm.control}
                                  name="spouseId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>رقم هوية الزوج/الزوجة</FormLabel>
                                      <FormControl><Input {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editPregnantWomanForm.control}
                                  name="healthNotes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>ملاحظات صحية</FormLabel>
                                      <FormControl><Textarea {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editPregnantWomanForm.control}
                                  name="campId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>المخيم</FormLabel>
                                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                                        <FormControl>
                                          <SelectTrigger><SelectValue placeholder="اختر مخيمًا" /></SelectTrigger>
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
                                        يمكنك ربط هذا السجل بمخيم اختياريًا.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button type="submit" disabled={updatePregnantWomanMutation.isPending}>
                                    {updatePregnantWomanMutation.isPending ? "جاري التحديث..." : "تحديث السجل"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog open={pregnantWomanToDelete === record.id} onOpenChange={(open) => !open && setPregnantWomanToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" onClick={() => setPregnantWomanToDelete(record.id)}>
                              <Trash2 className="h-4 w-4" /> حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف سجل المرأة الحامل بشكل دائم.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deletePregnantWomanMutation.mutate(record.id)} className="bg-red-600">حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pregnantWomanRecords && pregnantWomanRecords.length === 0 && pregnantWomanSpouseId && !isLoadingPregnantWomanRecords && (
            <p className="text-center text-muted-foreground">لا توجد سجلات نساء حوامل لرقم هوية الزوج/الزوجة المُدخل.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LookupHousehold;
