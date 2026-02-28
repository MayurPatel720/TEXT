"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Sparkles, 
  CreditCard, 
  Shield, 
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout";

interface User {
  _id: string;
  name: string;
  email: string;
  plan: string;
  credits: number;
  role: string;
  totalGenerations: number;
  createdAt: string;
  lastLoginAt?: string;
}

interface Stats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    byPlan: Record<string, number>;
  };
  generations: {
    total: number;
    today: number;
  };
  credits: {
    total: number;
    average: number;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`),
      ]);

      if (statsRes.status === 403 || usersRes.status === 403) {
        setError("Admin access required");
        return;
      }

      if (!statsRes.ok || !usersRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [statsData, usersData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
      ]);

      setStats(statsData);
      setUsers(usersData.users);
      setTotalPages(usersData.pagination.totalPages);
    } catch (err) {
      setError("Failed to load admin data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates }),
      });

      if (!res.ok) throw new Error("Failed to update");
      
      fetchData();
      setEditingUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (error === "Admin access required") {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-[var(--text-secondary)]">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Total Users"
              value={stats.users.total}
              subtext={`+${stats.users.newThisWeek} this week`}
            />
            <StatCard
              icon={<Sparkles className="w-5 h-5" />}
              label="Generations"
              value={stats.generations.total}
              subtext={`${stats.generations.today} today`}
            />
            <StatCard
              icon={<CreditCard className="w-5 h-5" />}
              label="Total Credits"
              value={stats.credits.total}
              subtext={`~${stats.credits.average} avg/user`}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Pro Users"
              value={stats.users.byPlan?.pro || 0}
              subtext={`${Math.round(((stats.users.byPlan?.pro || 0) / stats.users.total) * 100)}% of total`}
            />
          </div>
        )}

        {/* Users Table */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Users</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Plan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Credits</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Generations</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-primary)]/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.plan === 'pro' ? 'bg-purple-500/20 text-purple-400' :
                        user.plan === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4">{user.credits}</td>
                    <td className="py-3 px-4">{user.totalGenerations}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setEditingUser(editingUser === user._id ? null : user._id)}
                        className="p-2 hover:bg-[var(--bg-primary)] rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  subtext: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-[var(--accent)]/10 rounded-lg text-[var(--accent)]">
          {icon}
        </div>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-xs text-[var(--text-tertiary)] mt-1">{subtext}</p>
    </motion.div>
  );
}
