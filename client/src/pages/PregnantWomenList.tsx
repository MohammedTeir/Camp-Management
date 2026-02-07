import { useState } from "react";
import { usePregnantWomen } from "@/hooks/use-pregnant-women";
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
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import type { InsertPregnantWoman } from "@shared/routes";

export default function PregnantWomenList() {
  const { women, isLoading, createWoman, updateWoman, deleteWoman } = usePregnantWomen();
  const { camps } = useCamps();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const initialFormState: InsertPregnantWoman = {
    fullName: "",
    idNumber: "",
    healthStatus: "healthy",
    pregnancyMonth: 1,
    spouseName: "",
    spouseId: "",
    healthNotes: "",
    campId: null,
  };
  const [formData, setFormData] = useState<InsertPregnantWoman>(initialFormState);

  const filteredWomen = women?.filter(woman => 
    woman.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    woman.idNumber.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateWoman({ id: editingId, ...formData }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingId(null);
          setFormData(initialFormState);
        }
      });
    } else {
      createWoman(formData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData(initialFormState);
        }
      });
    }
  };

  const openEdit = (woman: any) => {
    setEditingId(woman.id);
    setFormData({
      fullName: woman.fullName,
      idNumber: woman.idNumber,
      healthStatus: woman.healthStatus,
      pregnancyMonth: woman.pregnancyMonth,
      spouseName: woman.spouseName,
      spouseId: woman.spouseId,
      healthNotes: woman.healthNotes || "",
      campId: woman.campId,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display">Maternal Records</h2>
          <p className="text-muted-foreground">Manage health records for pregnant women.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => { setEditingId(null); setFormData(initialFormState); }}
              className="bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20"
            >
              <Plus className="w-4 h-4 mr-2" /> New Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Record" : "Register New Record"}</DialogTitle>
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
                  <Label>Pregnancy Month</Label>
                  <Select 
                    value={formData.pregnancyMonth.toString()} 
                    onValueChange={val => setFormData({...formData, pregnancyMonth: parseInt(val)})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9].map(m => (
                        <SelectItem key={m} value={m.toString()}>Month {m}</SelectItem>
                      ))}
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
                      <SelectItem value="risk">High Risk</SelectItem>
                      <SelectItem value="attention">Needs Attention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Spouse Name</Label>
                  <Input 
                    value={formData.spouseName} 
                    onChange={e => setFormData({...formData, spouseName: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spouse ID</Label>
                  <Input 
                    value={formData.spouseId} 
                    onChange={e => setFormData({...formData, spouseId: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Camp</Label>
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

              <div className="space-y-2">
                <Label>Health Notes</Label>
                <Input 
                  value={formData.healthNotes || ""} 
                  onChange={e => setFormData({...formData, healthNotes: e.target.value})} 
                  placeholder="Medical history, supplements needed..."
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
          placeholder="Search by name or ID..." 
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
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">ID Number</th>
                <th className="px-6 py-4 font-medium">Pregnancy Month</th>
                <th className="px-6 py-4 font-medium">Spouse</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading records...</td>
                </tr>
              ) : filteredWomen?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No records found.</td>
                </tr>
              ) : (
                filteredWomen?.map((woman) => (
                  <tr key={woman.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{woman.fullName}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{woman.idNumber}</td>
                    <td className="px-6 py-4">Month {woman.pregnancyMonth}</td>
                    <td className="px-6 py-4">{woman.spouseName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        woman.healthStatus === 'healthy' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {woman.healthStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(woman)}>
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm("Delete this record?")) deleteWoman(woman.id);
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
