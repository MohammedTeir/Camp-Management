import { useState } from "react";
import { useChildren } from "@/hooks/use-children";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { InsertChild } from "@shared/routes";

export default function ChildrenList() {
  const { children, isLoading, createChild, updateChild, deleteChild } = useChildren();
  const { camps } = useCamps();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const initialFormState: InsertChild = {
    fullName: "",
    idNumber: "",
    dateOfBirth: "",
    gender: "male",
    healthStatus: "healthy",
    fatherName: "",
    fatherId: "",
    motherName: "",
    motherId: "",
    isBreastfeeding: false,
    healthNotes: "",
    campId: null,
  };
  const [formData, setFormData] = useState<InsertChild>(initialFormState);

  const filteredChildren = children?.filter(child => 
    child.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.idNumber.includes(searchTerm) ||
    child.fatherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateChild({ id: editingId, ...formData }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingId(null);
          setFormData(initialFormState);
        }
      });
    } else {
      createChild(formData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData(initialFormState);
        }
      });
    }
  };

  const openEdit = (child: any) => {
    setEditingId(child.id);
    setFormData({
      fullName: child.fullName,
      idNumber: child.idNumber,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender,
      healthStatus: child.healthStatus,
      fatherName: child.fatherName,
      fatherId: child.fatherId,
      motherName: child.motherName,
      motherId: child.motherId,
      isBreastfeeding: child.isBreastfeeding || false,
      healthNotes: child.healthNotes || "",
      campId: child.campId,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display">Children Records</h2>
          <p className="text-muted-foreground">Manage health records for all registered children.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => { setEditingId(null); setFormData(initialFormState); }}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Child
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Child Record" : "Register New Child"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={formData.fullName} 
                    onChange={e => setFormData({...formData, fullName: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID Number</Label>
                  <Input 
                    value={formData.idNumber} 
                    onChange={e => setFormData({...formData, idNumber: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input 
                    type="date"
                    value={formData.dateOfBirth} 
                    onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={val => setFormData({...formData, gender: val})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Health Status</Label>
                  <Select 
                    value={formData.healthStatus} 
                    onValueChange={val => setFormData({...formData, healthStatus: val})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="sick">Sick</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="malnourished">Malnourished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Camp Location</Label>
                  <Select 
                    value={formData.campId?.toString() || ""} 
                    onValueChange={val => setFormData({...formData, campId: parseInt(val) || null})}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Camp" /></SelectTrigger>
                    <SelectContent>
                      {camps?.map(camp => (
                        <SelectItem key={camp.id} value={camp.id.toString()}>{camp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase">Parent Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Father's Name</Label>
                    <Input 
                      value={formData.fatherName} 
                      onChange={e => setFormData({...formData, fatherName: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Father's ID</Label>
                    <Input 
                      value={formData.fatherId} 
                      onChange={e => setFormData({...formData, fatherId: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mother's Name</Label>
                    <Input 
                      value={formData.motherName} 
                      onChange={e => setFormData({...formData, motherName: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mother's ID</Label>
                    <Input 
                      value={formData.motherId} 
                      onChange={e => setFormData({...formData, motherId: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="breastfeeding" 
                  checked={formData.isBreastfeeding || false}
                  onCheckedChange={(checked) => setFormData({...formData, isBreastfeeding: checked as boolean})}
                />
                <Label htmlFor="breastfeeding">Is currently breastfeeding?</Label>
              </div>

              <div className="space-y-2">
                <Label>Medical Notes</Label>
                <Input 
                  value={formData.healthNotes || ""} 
                  onChange={e => setFormData({...formData, healthNotes: e.target.value})} 
                  placeholder="Any allergies, chronic conditions, or notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Record</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name, ID, or father's name..." 
          className="pl-10 max-w-md bg-card"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Child Name</th>
                <th className="px-6 py-4 font-medium">ID Number</th>
                <th className="px-6 py-4 font-medium">Age/DOB</th>
                <th className="px-6 py-4 font-medium">Gender</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading records...</td>
                </tr>
              ) : filteredChildren?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No records found.</td>
                </tr>
              ) : (
                filteredChildren?.map((child) => (
                  <tr key={child.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{child.fullName}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{child.idNumber}</td>
                    <td className="px-6 py-4">{child.dateOfBirth}</td>
                    <td className="px-6 py-4 capitalize">{child.gender}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        child.healthStatus === 'healthy' ? 'bg-green-50 text-green-700 border-green-200' :
                        child.healthStatus === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {child.healthStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(child)}>
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm("Are you sure you want to delete this record?")) {
                          deleteChild(child.id);
                        }
                      }}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
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
