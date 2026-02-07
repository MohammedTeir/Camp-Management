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
import { Label } from "@/components/ui/label";
import { Tent, MapPin, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Camps() {
  const { camps, isLoading, createCamp, isCreating } = useCamps();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCamp({ name, location }, {
      onSuccess: () => {
        setIsOpen(false);
        setName("");
        setLocation("");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-display">Camp Management</h2>
          <p className="text-muted-foreground">Locations and distribution centers.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Camp
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Camp</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Camp Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. North Zone Alpha" />
              </div>
              <div className="space-y-2">
                <Label>Location / Coordinates</Label>
                <Input value={location} onChange={e => setLocation(e.target.value)} required placeholder="e.g. Sector 4, Grid B" />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>Create Camp</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div>Loading camps...</div>
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
          </Card>
        ))}
      </div>
    </div>
  );
}
