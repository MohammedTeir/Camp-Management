import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { username, password }, 
      { onSuccess: () => setLocation("/dashboard") }
    );
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-accent" />
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <LogIn className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold font-display">دخول المسؤول</CardTitle>
          <CardDescription>
            سجل الدخول لإدارة بيانات المخيم والسجلات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base" disabled={isLoggingIn}>
              {isLoggingIn ? "جاري التحقق..." : "تسجيل الدخول"}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>لرؤساء الأسر، استخدم أداة البحث في الصفحة الرئيسية.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
