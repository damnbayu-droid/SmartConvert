'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  Activity,
  Zap,
  Clock
} from 'lucide-react';

export const runtime = 'edge';

export default function DashboardPage() {
  const stats = [
    { label: 'Total Users', value: '1,248', icon: Users, change: '+12% from last month', color: 'text-blue-600' },
    { label: 'Active Subscriptions', value: '84', icon: CreditCard, change: '+5.2% from last month', color: 'text-green-600' },
    { label: 'Total Revenue', value: '$452.00', icon: ArrowUpRight, change: 'Lifetime earnings', color: 'text-orange-600' },
    { label: 'Conversions (24h)', value: '4,512', icon: Activity, change: '100% browser-side', color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back, Admin. Here is what is happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Recent System Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 text-sm border-b pb-3 last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                    U{i}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">User conformed image to WebP</p>
                    <p className="text-xs text-muted-foreground">2 mins ago • IP: 182.253.xx.xx</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div>
                    <p className="font-semibold text-sm">Order #SDK-99{i}</p>
                    <p className="text-xs text-muted-foreground">Plan: $1 Weekly • bayu@gmail.com</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700">
                      Processing
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
