import { useState } from "react";
import { useCamps } from "@/hooks/use-camps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Tent, MapPin, Plus, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function Camps() {
  const { camps, isLoading, createCamp, isCreating, updateCamp, isUpdating, deleteCamp, isDeleting } = useCamps();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  
  const [editingCamp, setEditingCamp] = useState<{ id: number; name: string; location: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  
  const [deletingCampId, setDeletingCampId] = useState<number | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCamp({ name: createName, location: createLocation }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setCreateName("");
        setCreateLocation("");
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCamp) {
      updateCamp({ id: editingCamp.id, data: { name: editName, location: editLocation } }, {
        onSuccess: () => {
          setEditingCamp(null);
          setEditName("");
          setEditLocation("");
        }
      });
    }
  };

  const handleEditClick = (camp: { id: number; name: string; location: string }) => {
    setEditingCamp(camp);
    setEditName(camp.name);
    setEditLocation(camp.location);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingCampId(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-display">إدارة المخيمات</h2>
          <p className="text-muted-foreground">المواقع ومراكز التوزيع.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> إضافة مخيم
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تسجيل مخيم جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>اسم المخيم</Label>
                <Input 
                  value={createName} 
                  onChange={e => setCreateName(e.target.value)} 
                  required 
                  placeholder="مثلاً: المنطقة الشمالية ألفا" 
                />
              </div>
              <div className="space-y-2">
                <Label>الموقع / الإحداثيات</Label>
                <Input 
                  value={createLocation} 
                  onChange={e => setCreateLocation(e.target.value)} 
                  required 
                  placeholder="مثلاً: القطاع 4، الشبكة ب" 
                />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>إنشاء مخيم</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div>جاري تحميل المخيمات...</div>
        ) : camps?.map((camp) => (
          <Card key={camp.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Tent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{camp.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1 gap-1">
                    <MapPin className="w-3 h-3" />
                    {camp.location}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 p-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleEditClick(camp)}
                disabled={isUpdating}
              >
                <Edit2 className="w-4 h-4 ml-2" />
                تعديل
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDeleteClick(camp.id)}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Edit Camp Dialog */}
      <Dialog open={!!editingCamp} onOpenChange={() => setEditingCamp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المخيم</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>اسم المخيم</Label>
              <Input 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                required 
                placeholder="مثلاً: المنطقة الشمالية ألفا" 
              />
            </div>
            <div className="space-y-2">
              <Label>الموقع / الإحداثيات</Label>
              <Input 
                value={editLocation} 
                onChange={e => setEditLocation(e.target.value)} 
                required 
                placeholder="مثلاً: القطاع 4، الشبكة ب" 
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isUpdating}>تحديث المخيم</Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => setEditingCamp(null)}
                disabled={isUpdating}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingCampId} onOpenChange={() => setDeletingCampId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا المخيم؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCampId(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deletingCampId) {
                  deleteCamp(deletingCampId);
                }
                setDeletingCampId(null);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
