import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User } from "@shared/models/auth";
import { api, buildUrl } from "@shared/routes";
import { Loader2, User as UserIcon, Calendar, Mail } from "lucide-react";
import { getAccessToken } from "@/lib/auth-utils";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define form schema for updating users
const updateUserFormSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب").optional(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون مكونة من 6 أحرف على الأقل").optional(),
  role: z.enum(["admin", "editor", "viewer"]).optional(), // Allow different roles
});

const ViewUser: React.FC = () => {
  const [match, params] = useRoute("/users/:id");
  const userId = params?.id || null;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch user data
  const { data: userData, isLoading: isLoadingUser, isError: isErrorUser, error: userError } = useQuery<User>({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) throw new Error("معرف المستخدم مفقود.");
      const token = getAccessToken();
      const headers: HeadersInit = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(buildUrl(api.admin.users.get.path, { id: userId }), { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل جلب بيانات المستخدم.");
      }
      return response.json();
    },
  });

  // Update User Form
  const updateUserForm = useForm<z.infer<typeof updateUserFormSchema>>({
    resolver: zodResolver(updateUserFormSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "admin",
    },
  });

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof updateUserFormSchema>) => {
      const token = getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(buildUrl(api.admin.users.update.path, { id: userId }), {
        method: api.admin.users.update.method,
        headers,
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل تحديث المستخدم");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "نجاح", description: "تم تحديث المستخدم بنجاح." });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] }); // Invalidate user list as well
      setIsEditDialogOpen(false);
      updateUserForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل تحديث المستخدم.", variant: "destructive" });
    },
  });

  const handleEdit = () => {
    if (userId) {
      setIsEditDialogOpen(true);
      // Pre-populate form with current user data
      if (userData) {
        updateUserForm.reset({
          username: userData.username,
          role: userData.role as "admin" | "editor" | "viewer",
          password: "", // Don't pre-fill password for security
        });
      }
    }
  };

  const handleBack = () => {
    setLocation("/settings"); // Navigate back to user list
  };

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-theme(spacing.16))]" dir="rtl">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (isErrorUser) {
    return (
      <div className="container mx-auto px-4 py-8 text-center" dir="rtl">
        <h1 className="text-2xl font-bold text-destructive">خطأ في تحميل المستخدم</h1>
        <p className="text-muted-foreground">{userError?.message || "حدث خطأ غير متوقع."}</p>
        <Button onClick={handleBack} className="mt-4">العودة إلى المستخدمين</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">تفاصيل المستخدم</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>العودة إلى المستخدمين</Button>
          <Button onClick={handleEdit}>تعديل المستخدم</Button>
        </div>
      </div>

      {userData && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{userData.username}</CardTitle>
                <p className="text-muted-foreground capitalize">{userData.role}</p>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">اسم المستخدم</h3>
                  <p className="text-lg">{userData.username}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">الدور</h3>
                  <p className="text-lg capitalize">{userData.role}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</h3>
                  <p className="text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(userData.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">تاريخ التحديث</h3>
                  <p className="text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(userData.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <Form {...updateUserForm}>
            <form onSubmit={updateUserForm.handleSubmit(updateUserMutation.mutate)} className="space-y-4">
              <FormField
                control={updateUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة مرور جديدة (اتركها فارغة للحفاظ على الحالية)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدور</FormLabel>
                    <FormControl>
                      <Input value="مدير" readOnly /> {/* For now, only admin role is supported */}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={updateUserMutation.isPending} className="flex-1">
                  {updateUserMutation.isPending ? "جارٍ التحديث..." : "تحديث المستخدم"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  إلغاء
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewUser;