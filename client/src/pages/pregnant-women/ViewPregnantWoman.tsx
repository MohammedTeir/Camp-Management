import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PregnantWoman, Camp } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { Loader2 } from "lucide-react";
import { getAccessToken } from "@/lib/auth-utils";

const ViewPregnantWoman: React.FC = () => {
  const [match, params] = useRoute("/pregnant-women/:id");
  const pregnantWomanId = params?.id ? Number(params.id) : null;
  const [, setLocation] = useLocation();

  // Fetch pregnant woman data
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
    enabled: !!pregnantWomanId,
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
        throw new Error("فشل جلب المخيمات");
      }
      return response.json();
    },
  });

  const getCampName = (campId: number | undefined) => {
    if (!campId || !camps) return "غير محدد";
    const camp = camps.find(c => c.id === campId);
    return camp ? camp.name : "غير محدد";
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
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">تفاصيل سجل المرأة الحامل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-3 text-center">المعلومات الشخصية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">اسم الزوجة الحامل رباعي</p>
                <p className="text-lg">{pregnantWomanData.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">رقم هوية الزوجة</p>
                <p className="text-lg">{pregnantWomanData.idNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">تاريخ ميلاد الزوجة</p>
                <p className="text-lg">{pregnantWomanData.dateOfBirth || "لا يوجد"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">حالة الزوجة</p>
                <p className="text-lg">{pregnantWomanData.healthStatus}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">شهر الحمل</p>
                <p className="text-lg">{pregnantWomanData.pregnancyMonth}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-2xl font-semibold mb-3 text-center">معلومات الزوج</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">اسم الزوج رباعي</p>
                <p className="text-lg">{pregnantWomanData.spouseName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">رقم هوية الزوج</p>
                <p className="text-lg">{pregnantWomanData.spouseId}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Information (merged from contact/notes and some personal fields) */}
          <div>
            <h2 className="text-2xl font-semibold mb-3 text-center">معلومات إضافية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">رقم التواصل</p>
                <p className="text-lg">{pregnantWomanData.contactNumber || "لا يوجد"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">اسم المخيم</p>
                <p className="text-lg">{getCampName(pregnantWomanData.campId)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">ملاحظات</p>
                <p className="text-lg">{pregnantWomanData.notes || "لا يوجد"}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <Button onClick={() => setLocation("/pregnant-women")}>
              العودة إلى القائمة
            </Button>
            <Button onClick={() => setLocation(`/pregnant-women/${pregnantWomanData.id}/edit`)}>
              تعديل السجل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewPregnantWoman;
