import { Phone, Mail, Calendar, FileText, MessageSquare } from 'lucide-react';
import type { RecentActivity } from '../../types/dashboard';
import { formatRelativeTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface RecentActivitiesProps {
  activities: RecentActivity[];
}

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: FileText,
  note: MessageSquare,
  'follow-up': MessageSquare,
};

const activityColors = {
  call: 'text-green-600 bg-green-100',
  email: 'text-blue-600 bg-blue-100',
  meeting: 'text-purple-600 bg-purple-100',
  task: 'text-orange-600 bg-orange-100',
  note: 'text-gray-600 bg-gray-100',
  'follow-up': 'text-yellow-600 bg-yellow-100',
};

export function RecentActivities({ activities }: RecentActivitiesProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-300">
        No recent activities
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type as keyof typeof activityIcons] || MessageSquare;
        const colorClass = activityColors[activity.type as keyof typeof activityColors] || 'text-gray-600 bg-gray-100';

        return (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-colors"
          >
            <div className={cn('p-2 rounded-lg', colorClass)}>
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-deep-ink truncate">{activity.subject}</p>
              <p className="text-sm text-gray-600">
                {activity.contact.first_name} {activity.contact.last_name}
                {activity.contact.company && ` · ${activity.contact.company}`}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(activity.scheduled_date)}
                </span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">
                  {activity.user.first_name} {activity.user.last_name}
                </span>
              </div>
            </div>
            <span className={cn(
              'text-xs px-2 py-1 rounded-full',
              activity.status === 'completed' ? 'bg-green-100 text-green-700' :
              activity.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
              activity.status === 'overdue' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            )}>
              {activity.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}