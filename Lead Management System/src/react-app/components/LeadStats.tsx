import { useEffect, useState } from "react";

interface Stats {
  total: number;
  new_count: number;
  contacted_count: number;
  qualified_count: number;
  closed_count: number;
  instagram_count: number;
  google_count: number;
  website_count: number;
}

export default function LeadStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/leads/stats/summary", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return null;
  }

  const statCards = [
    {
      label: "Total Leads",
      value: stats.total,
      icon: "📊",
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "New",
      value: stats.new_count,
      icon: "🆕",
      color: "from-blue-400 to-blue-500",
    },
    {
      label: "Contacted",
      value: stats.contacted_count,
      icon: "📞",
      color: "from-yellow-400 to-yellow-500",
    },
    {
      label: "Qualified",
      value: stats.qualified_count,
      icon: "⭐",
      color: "from-purple-400 to-purple-500",
    },
    {
      label: "Closed",
      value: stats.closed_count,
      icon: "✅",
      color: "from-green-400 to-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{card.icon}</span>
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${card.color}`}></div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{card.value}</div>
          <div className="text-sm text-gray-600">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
