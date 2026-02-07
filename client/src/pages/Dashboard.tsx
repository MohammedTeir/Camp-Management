import { useStats } from "@/hooks/use-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, Users, Tent, Activity } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();

  // Mock data for charts since the backend returns simple counts
  const genderData = [
    { name: 'أولاد', value: stats ? Math.floor(stats.totalChildren * 0.52) : 0 },
    { name: 'بنات', value: stats ? Math.floor(stats.totalChildren * 0.48) : 0 },
  ];

  const pregnancyData = [
    { name: '1-3 أشهر', count: 12 },
    { name: '4-6 أشهر', count: 28 },
    { name: '7-9 أشهر', count: 15 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: any; color: string }) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          +2.5% from last month
        </p>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-muted/50 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-display tracking-tight">نظرة عامة على لوحة التحكم</h2>
        <p className="text-muted-foreground">أهلاً بك مجدداً. إليك ما يحدث في المخيمات اليوم.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="إجمالي الأطفال" 
          value={stats.totalChildren} 
          icon={Baby} 
          color="hsl(var(--primary))" 
        />
        <StatCard 
          title="النساء الحوامل" 
          value={stats.totalPregnant} 
          icon={Users} 
          color="hsl(var(--accent))" 
        />
        <StatCard 
          title="المخيمات النشطة" 
          value={stats.totalCamps} 
          icon={Tent} 
          color="#10b981" 
        />
        <StatCard 
          title="الحالات الحرجة" 
          value="12" 
          icon={Activity} 
          color="hsl(var(--destructive))" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-md">
          <CardHeader>
            <CardTitle>توزيع أشهر الحمل</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={pregnancyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                  orientation="right"
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-md">
          <CardHeader>
            <CardTitle>نسبة جنس الأطفال</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#0088FE]" />
                <span className="text-sm font-medium">أولاد ({Math.round(genderData[0].value / (genderData[0].value + genderData[1].value) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00C49F]" />
                <span className="text-sm font-medium">بنات ({Math.round(genderData[1].value / (genderData[0].value + genderData[1].value) * 100)}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
