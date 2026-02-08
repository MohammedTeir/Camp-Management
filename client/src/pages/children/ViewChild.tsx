import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Child, Camp } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { Loader2 } from "lucide-react";
import { getAccessToken } from "@/lib/auth-utils";

const ViewChild: React.FC = () => {
  const [match, params] = useRoute("/children/:id");
  const childId = params?.id ? Number(params.id) : null;
  const [, setLocation] = useLocation();

  // Fetch child data
  const { data: childData, isLoading: isLoadingChild, isError: isErrorChild, error: childError } = useQuery<Child>({
    queryKey: ["child", childId],
    queryFn: async () => {
      if (!childId) throw new Error("Child ID is missing.");
      const token = getAccessToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(buildUrl(api.children.get.path, { id: childId }), { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch child data.");
      }
      return response.json();
    },
    enabled: !!childId,
  });

  // Fetch camps to display camp name
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

  const getCampName = (campId: number | undefined) => {
    if (!campId || !camps) return "غير محدد";
    const camp = camps.find(c => c.id === campId);
    return camp ? camp.name : "غير محدد";
  };

  const getGenderDisplay = (gender: string) => {
    return gender === 'male' ? 'ذكر' : (gender === 'female' ? 'أنثى' : gender);
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
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">تفاصيل سجل الطفل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Child Information */}
          <div>
            <h2 className="text-2xl font-semibold mb-3 text-center">معلومات الطفل</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">اسم الطفل رباعي</p>
                <p className="text-lg">{childData.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">رقم هوية الطفل</p>
                <p className="text-lg">{childData.idNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">تاريخ ميلاد الطفل</p>
                <p className="text-lg">{childData.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">الجنس</p>
                <p className="text-lg">{getGenderDisplay(childData.gender)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">حالة الطفل</p>
                <p className="text-lg">{childData.healthStatus}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Parent Information */}
          <div>
            <h2 className="text-2xl font-semibold mb-3 text-center">معلومات الوالدين</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">اسم الاب رباعي</p>
                <p className="text-lg">{childData.fatherName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">رقم هوية الاب</p>
                <p className="text-lg">{childData.fatherId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">اسم الام رباعي</p>
                <p className="text-lg">{childData.motherName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">رقم هوية الام</p>
                <p className="text-lg">{childData.motherId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">تاريخ ميلاد الام</p>
                <p className="text-lg">{childData.motherDateOfBirth || "لا يوجد"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">حالة الام</p>
                <p className="text-lg">{childData.motherHealthStatus || "لا يوجد"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Information (merged from contact/notes and some child fields) */}
          <div>
            <h2 className="text-2xl font-semibold mb-3 text-center">معلومات إضافية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">رقم التواصل</p>
                <p className="text-lg">{childData.contactNumber || "لا يوجد"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">اسم المخيم</p>
                <p className="text-lg">{getCampName(childData.campId)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">هل الام مرضعة نعم ام لا</p>
                <p className="text-lg">{childData.isBreastfeeding ? "نعم" : "لا"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">ملاحظات</p>
                <p className="text-lg">{childData.notes || "لا يوجد"}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <Button onClick={() => setLocation("/children")}>
              العودة إلى القائمة
            </Button>
            <Button onClick={() => setLocation(`/children/${childData.id}/edit`)}>
              تعديل السجل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewChild;
