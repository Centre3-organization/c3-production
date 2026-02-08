import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Download, 
  Calendar, 
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const accessData = [
  { name: "Mon", visitors: 120, contractors: 80, employees: 240 },
  { name: "Tue", visitors: 132, contractors: 90, employees: 250 },
  { name: "Wed", visitors: 101, contractors: 120, employees: 260 },
  { name: "Thu", visitors: 134, contractors: 100, employees: 245 },
  { name: "Fri", visitors: 90, contractors: 110, employees: 230 },
  { name: "Sat", visitors: 40, contractors: 60, employees: 80 },
  { name: "Sun", visitors: 30, contractors: 40, employees: 70 },
];

const zoneData = [
  { name: "Zone A (Lobby)", value: 400 },
  { name: "Zone B (Office)", value: 300 },
  { name: "Zone C (Server)", value: 150 },
  { name: "Zone D (Power)", value: 80 },
];

const COLORS = ['#5B2C93', '#5B2C93', '#059669', '#D97706'];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-[#2C2C2C]">Analytics & Reports</h1>
          <p className="text-[#6B6B6B] mt-1">Deep insights into facility usage and security trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="7d">
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Access Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">2,350</div>
            <p className="text-xs text-[#6B6B6B] mt-1 flex items-center">
              <span className="text-[#059669] flex items-center font-medium">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12.5%
              </span>
              <span className="ml-1">vs last week</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Visit Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">4h 12m</div>
            <p className="text-xs text-[#6B6B6B] mt-1 flex items-center">
              <span className="text-[#059669] flex items-center font-medium">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                -5%
              </span>
              <span className="ml-1">vs last week</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">12</div>
            <p className="text-xs text-[#6B6B6B] mt-1 flex items-center">
              <span className="text-[#FF6B6B] flex items-center font-medium">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +2
              </span>
              <span className="ml-1">vs last week</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contractors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">45</div>
            <p className="text-xs text-[#6B6B6B] mt-1 flex items-center">
              <span className="text-[#6B6B6B] flex items-center font-medium">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                0%
              </span>
              <span className="ml-1">vs last week</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Access Trends</CardTitle>
            <CardDescription>Daily access volume by personnel type.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={accessData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#6B6B6B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B6B6B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="employees" name="Employees" stackId="a" fill="#5B2C93" radius={[0, 0, 4, 4]} />
                <Bar dataKey="contractors" name="Contractors" stackId="a" fill="#5B2C93" radius={[0, 0, 0, 0]} />
                <Bar dataKey="visitors" name="Visitors" stackId="a" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Zone Distribution</CardTitle>
            <CardDescription>Access distribution across security zones.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={zoneData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#5B2C93"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {zoneData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance & Violations</CardTitle>
          <CardDescription>Security incidents and policy violations over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={accessData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#6B6B6B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B6B6B" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="visitors" name="Policy Violations" stroke="#FF6B6B" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="contractors" name="Overstay Incidents" stroke="#D97706" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
