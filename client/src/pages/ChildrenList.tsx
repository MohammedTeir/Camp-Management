import { useState } from "react";
import { useChildren } from "@/hooks/use-children";
import { useCamps } from "@/hooks/use-camps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, Eye } from "lucide-react";
import { Link } from "wouter";
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
import { useLanguage } from "@/contexts/LanguageContext"; // Import useLanguage hook

const getHealthStatusTranslation = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'صحي';
    case 'critical':
      return 'حرج';
    case 'warning':
      return 'تحذير';
    default:
      return status;
  }
};

const getGenderTranslation = (gender: string) => {
  switch (gender.toLowerCase()) {
    case 'male':
      return 'ذكر';
    case 'female':
      return 'أنثى';
    default:
      return gender;
  }
};

export default function ChildrenList() {
  const { children, isLoading, deleteChild } = useChildren();
  const { camps } = useCamps();
  const [searchTerm, setSearchTerm] = useState("");
  const [childToDelete, setChildToDelete] = useState<number | null>(null);
  const { direction } = useLanguage(); // Use the language direction context

  const filteredChildren = children?.filter(child =>
    child.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.idNumber.includes(searchTerm) ||
    child.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (child.contactNumber && child.contactNumber.includes(searchTerm))
  );

  const getCampName = (campId: number | undefined) => {
    if (!campId || !camps) return "غير محدد";
    const camp = camps.find(c => c.id === campId);
    return camp ? camp.name : "N/A";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">سجلات الأطفال</h2>
          <p className="text-muted-foreground">إدارة سجلات صحة جميع الأطفال المسجلين.</p>
        </div>
        <Link href="/children/add">
          <Button
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            إضافة طفل <Plus className={`${direction === 'rtl' ? 'mr-2' : 'ml-2'} w-4 h-4`} />
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className={`absolute ${direction === 'rtl' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
        <Input
          placeholder="البحث بالاسم أو الهوية أو اسم الأب..."
          className="pl-10 pr-4 max-w-full md:max-w-md bg-card" // Adjusted padding and width for responsiveness
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right"> {/* Changed text-left to text-right for RTL */}
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">اسم الطفل</th>
                <th className="px-6 py-4 font-medium">رقم الهوية</th>
                <th className="px-6 py-4 font-medium">تاريخ الميلاد</th>
                <th className="px-6 py-4 font-medium">الجنس</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">المخيم</th>
                <th className="px-6 py-4 font-medium text-left">الإجراءات</th> {/* Changed text-right to text-left for RTL */}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">جاري تحميل السجلات...</td>
                </tr>
              ) : filteredChildren?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">لا توجد سجلات.</td>
                </tr>
              ) : (
                filteredChildren?.map((child) => (
                  <tr key={child.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{child.fullName}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{child.idNumber}</td>
                    <td className="px-6 py-4">{child.dateOfBirth}</td>
                    <td className="px-6 py-4">{getGenderTranslation(child.gender)}</td> {/* Apply gender translation */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        child.healthStatus === 'healthy' ? 'bg-green-50 text-green-700 border-green-200' :
                        child.healthStatus === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {getHealthStatusTranslation(child.healthStatus)} {/* Apply health status translation */}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getCampName(child.campId)}</td>
                    <td className="px-6 py-4 text-left"> {/* text-left for RTL */}
                      <div className="inline-flex items-center gap-1 rounded-md border bg-card p-1 shadow-sm">
                        <Link href={`/children/${child.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                        </Link>
                        <Link href={`/children/${child.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setChildToDelete(child.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف سجل
                                الطفل بشكل دائم وإزالة بياناته من خوادمنا.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setChildToDelete(null)}>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => {
                                if (childToDelete !== null) {
                                  deleteChild(childToDelete);
                                  setChildToDelete(null);
                                }
                              }} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

