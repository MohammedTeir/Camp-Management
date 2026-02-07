import { useState } from "react";
import { useChildLookup } from "@/hooks/use-children";
import { usePregnantWomanLookup } from "@/hooks/use-pregnant-women";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Baby, User, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const [activeTab, setActiveTab] = useState("children");
  const [searchId, setSearchId] = useState("");
  const [lookupId, setLookupId] = useState(""); // Actual ID used for query

  const { data: children, isLoading: loadingChildren } = useChildLookup(activeTab === "children" ? lookupId : "");
  const { data: women, isLoading: loadingWomen } = usePregnantWomanLookup(activeTab === "women" ? lookupId : "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupId(searchId);
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4 pt-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
          بيانات العائلة <span className="text-gradient">بحث</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          الوصول إلى السجلات الصحية للأطفال والرعاية الأمومية عن طريق إدخال رقم هوية العائلة أو الرقم الوطني أو رقم هوية الزوج.
        </p>
      </div>

      <Card className="max-w-xl mx-auto border-2 shadow-lg">
        <CardContent className="pt-6">
          <Tabs defaultValue="children" onValueChange={(val) => { setActiveTab(val); setSearchId(""); setLookupId(""); }}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="children">سجلات الأطفال</TabsTrigger>
              <TabsTrigger value="women">سجلات الأمهات</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder={activeTab === "children" ? "أدخل رقم هوية الأب أو الأم..." : "أدخل رقم هوية الزوج أو الزوجة..."}
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="h-12 text-lg"
              />
              <Button type="submit" size="lg" className="h-12 px-6">
                <Search className="w-5 h-5" />
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {activeTab === "children" && lookupId && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Search Results</h2>
            {loadingChildren ? (
              <div className="text-center py-12 text-muted-foreground">Searching database...</div>
            ) : children && children.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map((child) => (
                  <Card key={child.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-display text-primary">{child.fullName}</CardTitle>
                        <Baby className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <CardDescription>ID: {child.idNumber}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Date of Birth</span>
                        <span className="font-medium">{child.dateOfBirth}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Gender</span>
                        <span className="font-medium capitalize">{child.gender}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                          {child.healthStatus}
                        </span>
                      </div>
                      {child.healthNotes && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs italic">
                          "{child.healthNotes}"
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/30">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground">No records found</h3>
                <p className="text-muted-foreground">Try checking the ID number and trying again.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "women" && lookupId && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Search Results</h2>
            {loadingWomen ? (
              <div className="text-center py-12 text-muted-foreground">Searching database...</div>
            ) : women && women.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {women.map((woman) => (
                  <Card key={woman.id} className="hover:shadow-md transition-shadow border-l-4 border-l-accent">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-display text-accent">{woman.fullName}</CardTitle>
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <CardDescription>ID: {woman.idNumber}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Spouse</span>
                        <span className="font-medium">{woman.spouseName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Pregnancy Month</span>
                        <span className="font-medium">{woman.pregnancyMonth}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Health Status</span>
                        <span className="font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                          {woman.healthStatus}
                        </span>
                      </div>
                      {woman.healthNotes && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs italic">
                          "{woman.healthNotes}"
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/30">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground">No records found</h3>
                <p className="text-muted-foreground">Try checking the ID number and trying again.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Decorative background Unsplash image */}
      {!lookupId && (
        <div className="relative rounded-3xl overflow-hidden mt-12 aspect-[21/9] shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 flex flex-col justify-end p-8 text-white">
            <h3 className="text-2xl font-bold font-display">Healthcare for Everyone</h3>
            <p className="max-w-lg opacity-90">Providing essential data management for camps to ensure every child and mother receives the care they deserve.</p>
          </div>
          {/* Medical camp setting or community health */}
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop" 
            alt="Medical camp" 
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
          />
        </div>
      )}
    </div>
  );
}
