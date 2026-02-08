import { useStats } from "@/hooks/use-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, Users, Tent, Activity, HeartPulse, Stethoscope } from "lucide-react"; // Added HeartPulse, Stethoscope
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
  Cell,
  Legend
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext"; // Import useLanguage hook

const getHealthStatusTranslation = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'صحي';
    case 'critical':
      return 'حرج';
    case 'warning':
      return 'تحذير';
    case 'risk':
      return 'معرض للخطر';
    default:
      return status;
  }
};

const getGenderTranslation = (gender: string) => {
  switch (gender.toLowerCase()) {
    case 'male':
      return 'ذكور';
    case 'female':
      return 'إناث';
    default:
      return gender;
  }
};

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();
  const { direction } = useLanguage(); // Use the language direction context

  // Prepare data for Gender Distribution Chart
  const genderData = stats?.childrenByGender.map(item => ({
    name: getGenderTranslation(item.gender),
    value: item.count,
  })) || [];

  // Prepare data for Pregnancy Month Distribution Chart
  const pregnancyData = stats?.pregnantWomenByMonth.map(item => ({
    name: `الشهر ${item.month}`,
    count: item.count,
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8B008B', '#FFD700']; // More colors for potentially more health statuses

  // Calculate combined critical cases
  const childrenCritical = stats?.childrenHealthStatusCounts.find(s => s.status === 'critical')?.count || 0;
  const pregnantWomenRisk = stats?.pregnantWomenHealthStatusCounts.find(s => s.status === 'risk')?.count || 0;
  const totalCriticalCases = childrenCritical + pregnantWomenRisk;

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: any; color: string }) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-r-4 sm:border-r-4" style={{ borderRightColor: color }}> {/* Adjusted for RTL */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        {/* <p className="text-xs text-muted-foreground mt-1">
          +2.5% from last month // Removed if no real data
        </p> */}
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
    <div className="space-y-8" dir={direction}> {/* Apply dir for RTL */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">نظرة عامة على لوحة التحكم</h2> {/* Removed font-display */}
        <p className="text-muted-foreground">أهلاً بك مجدداً. إليك ما يحدث في المخيمات اليوم.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"> {/* Responsive grid */}
        <StatCard
          title="إجمالي الأطفال"
          value={stats.totalChildren}
          icon={Baby}
          color="hsl(var(--primary))"
        />
        <StatCard
          title="النساء الحوامل"
          value={stats.totalPregnantWomen}
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
          title="الأمهات المرضعات"
          value={stats.totalMothers}
          icon={HeartPulse} // Assuming HeartPulse for mothers
          color="#FFD700" // Gold color
        />
        <StatCard
          title="الحالات الحرجة"
          value={totalCriticalCases}
          icon={Activity}
          color="hsl(var(--destructive))"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7"> {/* Responsive grid */}
        <Card className="col-span-1 lg:col-span-4 shadow-md"> {/* Responsive columns */}
          <CardHeader>
            <CardTitle>توزيع أشهر الحمل</CardTitle>
          </CardHeader>
          <CardContent className={`${direction === 'rtl' ? 'pr-2' : 'pl-2'}`}> {/* Adjusted padding */}
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={pregnancyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}> {/* Use vertical layout for RTL */}
                <CartesianGrid strokeDasharray="3 3" horizontal={false} /> {/* Adjusted for vertical bars */}
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  orientation="right" // Y-axis on the right for RTL vertical bars
                />
                <XAxis
                  dataKey="count"
                  type="number"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  orientation="top" // X-axis on top for RTL vertical bars
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => [`${value}`, 'العدد']} // Translate tooltip value label
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} /> {/* Adjusted bar size */}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 shadow-md"> {/* Responsive columns */}
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
                <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} /> {/* Tooltip formatter */}
                <Legend layout="horizontal" verticalAlign="bottom" align="center" /> {/* Add legend */}
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {genderData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-medium">
                    {entry.name} ({
                      // Calculate percentage only if total is not zero to avoid division by zero
                      (genderData.reduce((acc, curr) => acc + curr.value, 0) > 0) ?
                      Math.round(entry.value / genderData.reduce((acc, curr) => acc + curr.value, 0) * 100) : 0
                    }%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

