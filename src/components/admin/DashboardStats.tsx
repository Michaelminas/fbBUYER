'use client';

interface DashboardStatsProps {
  stats: {
    overview: {
      totalLeads: number;
      totalVerified: number;
      totalScheduled: number;
      totalCompleted: number;
      verificationRate: number;
      schedulingRate: number;
      completionRate: number;
    };
    today: {
      leads: number;
      scheduled: number;
    };
    trends: {
      weekLeads: number;
      monthLeads: number;
      avgQuoteValue: number;
      totalRevenue: number;
    };
    topDevices: Array<{
      model: string;
      count: number;
    }>;
  } | null;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.overview.totalLeads,
      icon: '👥',
      color: 'blue',
      description: `${stats.trends.weekLeads} this week`
    },
    {
      title: 'Today\'s Leads',
      value: stats.today.leads,
      icon: '📅',
      color: 'green',
      description: 'New inquiries today'
    },
    {
      title: 'Revenue',
      value: `$${stats.trends.totalRevenue.toLocaleString()}`,
      icon: '💰',
      color: 'purple',
      description: 'Total completed sales'
    },
    {
      title: 'Completion Rate',
      value: `${stats.overview.completionRate}%`,
      icon: '📈',
      color: 'orange',
      description: 'Scheduled to completed'
    },
    {
      title: 'Verified Leads',
      value: stats.overview.totalVerified,
      icon: '✅',
      color: 'teal',
      description: 'Ready for scheduling'
    },
    {
      title: 'Avg Quote Value',
      value: `$${stats.trends.avgQuoteValue}`,
      icon: '💵',
      color: 'indigo',
      description: 'Average quote amount'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
      teal: 'bg-teal-50 text-teal-600 border-teal-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </div>
            <div
              className={`p-3 rounded-full text-xl ${getColorClasses(stat.color)}`}
            >
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}