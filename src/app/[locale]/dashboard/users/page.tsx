'use client';

export const runtime = 'edge';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan] = useState('weekly');

  const users = [
    { email: 'damnbayu@gmail.com', role: 'admin', plan: 'lifetime', status: 'active', joined: '2026-03-10' },
    { email: 'tester@gmail.com', role: 'user', plan: 'weekly', status: 'active', joined: '2026-05-01' },
    { email: 'freeuser@hotmail.com', role: 'user', plan: 'free', status: 'inactive', joined: '2026-05-02' },
  ];

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    toast.success(`User ${newEmail} has been manually approved as ${newPlan}`);
    setNewEmail('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage and manually approve VIP accounts.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-orange-600 hover:bg-orange-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Generate Manual User
        </Button>
      </div>

      {isAdding && (
        <Card className="border-orange-200 bg-orange-50/20">
          <CardHeader>
            <CardTitle className="text-lg">Manual Approval</CardTitle>
            <CardDescription>Grant full access to an email without payment confirmation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualAdd} className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2 min-w-[300px]">
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="user@example.com" 
                    className="pl-10" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Plan</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                >
                  <option value="weekly">$1 Weekly</option>
                  <option value="monthly">$10 Monthly</option>
                  <option value="lifetime">$20 Lifetime</option>
                </select>
              </div>
              <Button type="submit">Approve Instantly</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users by email..." 
              className="pl-10" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.email}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">{user.plan}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.status === 'active' ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span className="text-xs">{user.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.joined}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
