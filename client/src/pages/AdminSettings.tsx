import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit2, Trash2, Loader2, Globe } from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import { User } from "@shared/models/auth";
import { useLocation } from "wouter";
import { getAccessToken } from "@/lib/auth-utils";

// Define form schemas using Zod for creating and updating users
const createUserFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.literal("admin").default("admin"), // Only admin role
});

const updateUserFormSchema = z.object({
  username: z.string().min(1, "Username is required").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.literal("admin").optional(), // Only admin role
});

// Schema for system settings
const systemSettingsFormSchema = z.object({
  welcomeMessage: z.string().optional(),
  systemName: z.string().optional(),
  defaultLanguage: z.string().optional(),
});

const AdminSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Fetch users
  const { data: users, isLoading: isLoadingUsers, isError: isErrorUsers, error: usersError } = useQuery<User[]>({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const token = getAccessToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(api.admin.users.list.path, { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  // Create User Form
  const createUserForm = useForm<z.infer<typeof createUserFormSchema>>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "admin",
    },
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof createUserFormSchema>) => {
      const token = getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(api.admin.users.create.path, {
        method: api.admin.users.create.method,
        headers,
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User created successfully." });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsCreateDialogOpen(false);
      createUserForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create user.", variant: "destructive" });
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

  // Effect to set form values when editingUser changes
  React.useEffect(() => {
    if (editingUser) {
      updateUserForm.reset({
        username: editingUser.username,
        role: editingUser.role as "admin" | "editor" | "viewer", // Cast to valid enum
        password: "", // Password should not be pre-filled for security
      });
    }
  }, [editingUser, updateUserForm]);

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof updateUserFormSchema>) => {
      if (!editingUser) throw new Error("No user selected for edit.");
      const token = getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(buildUrl(api.admin.users.update.path, { id: editingUser.id }), {
        method: api.admin.users.update.method,
        headers,
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      updateUserForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update user.", variant: "destructive" });
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = getAccessToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(buildUrl(api.admin.users.delete.path, { id: userId }), {
        method: api.admin.users.delete.method,
        headers,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete user.", variant: "destructive" });
    },
  });

  // System Settings Form
  const systemSettingsForm = useForm<z.infer<typeof systemSettingsFormSchema>>({
    resolver: zodResolver(systemSettingsFormSchema),
    defaultValues: {
      welcomeMessage: "",
    },
  });

  // Fetch system settings
  const { data: systemSettings, isLoading: isLoadingSystemSettings } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: async () => {
      const token = getAccessToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(api.admin.settings.get.path, { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch system settings");
      }
      return response.json();
    },
    onSuccess: (data) => {
      systemSettingsForm.setValue('welcomeMessage', data.welcomeMessage || '');
      systemSettingsForm.setValue('systemName', data.systemName || 'Family Management System');
      systemSettingsForm.setValue('defaultLanguage', data.defaultLanguage || 'en');
    },
  });

  // Update System Settings Mutation
  const updateSystemSettingsMutation = useMutation({
    mutationFn: async (settingsData: z.infer<typeof systemSettingsFormSchema>) => {
      const token = getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(api.admin.settings.update.path, {
        method: api.admin.settings.update.method,
        headers,
        body: JSON.stringify(settingsData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update system settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "System settings updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update system settings.", variant: "destructive" });
    },
  });

  const onSystemSettingsSubmit = (data: z.infer<typeof systemSettingsFormSchema>) => {
    updateSystemSettingsMutation.mutate(data);
  };

  if (isLoadingUsers) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-theme(spacing.16))]">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (isErrorUsers) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        <h1 className="text-2xl font-bold">خطأ في تحميل المستخدمين</h1>
        <p>{usersError?.message || "حدث خطأ غير متوقع أثناء جلب بيانات المستخدم."}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">لوحة الإدارة</h1>

      {/* User Management Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">إدارة المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" /> إضافة مستخدم جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
                </DialogHeader>
                <Form {...createUserForm}>
                  <form onSubmit={createUserForm.handleSubmit(createUserMutation.mutate)} className="space-y-4">
                    <FormField
                      control={createUserForm.control}
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
                      control={createUserForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الدور</FormLabel>
                          <FormControl>
                            <Input value="مدير" readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء مستخدم"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المستخدم</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-accent" onClick={() => setLocation(`/users/${user.id}`)}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell className="capitalize">مدير</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingUser(user); setIsEditDialogOpen(true); }}>
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                        </DialogTrigger>
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
                                      <Input value="مدير" readOnly />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={updateUserMutation.isPending}>
                                {updateUserMutation.isPending ? "جارٍ التحديث..." : "تحديث المستخدم"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setUserToDelete(user.id); }}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف حساب المستخدم نهائيًا وإزالة البيانات المرتبطة به.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setUserToDelete(null)}>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                              if (userToDelete !== null) {
                                deleteUserMutation.mutate(userToDelete);
                                setUserToDelete(null);
                              }
                            }} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    لا يوجد مستخدمون.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">إعدادات النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...systemSettingsForm}>
            <form onSubmit={systemSettingsForm.handleSubmit(onSystemSettingsSubmit)} className="space-y-4">
              <FormField
                control={systemSettingsForm.control}
                name="welcomeMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رسالة الترحيب</FormLabel>
                    <FormControl>
                      <Textarea placeholder="أدخل رسالة الترحيب للوحة التحكم" {...field} />
                    </FormControl>
                    <FormDescription>
                      ستظهر هذه الرسالة على لوحة التحكم لجميع المستخدمين.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={systemSettingsForm.control}
                name="systemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم النظام</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم النظام" {...field} />
                    </FormControl>
                    <FormDescription>
                      اسم النظام الذي يظهر في واجهة المستخدم.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={systemSettingsForm.control}
                name="defaultLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اللغة الافتراضية</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر اللغة الافتراضية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">الإنجليزية</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="fr">الفرنسية</SelectItem>
                        <SelectItem value="es">الإسبانية</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      اللغة الافتراضية للتطبيق.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateSystemSettingsMutation.isPending}>
                {updateSystemSettingsMutation.isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
