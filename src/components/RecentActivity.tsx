import React from 'react';
import './RecentActivity.css';

type Activity = {
  type: string;
  description: string;
  date: string;
  status: 'Completed' | 'In Review' | 'Open';
};

const activities: Activity[] = [
  { type: 'Test', description: 'Automated Test Suite Completed', date: '2024-02-10', status: 'Completed' },
  { type: 'BRD', description: 'New Requirement Document Generated', date: '2024-02-09', status: 'In Review' },
  { type: 'Issue', description: 'Critical Bug Reported', date: '2024-02-09', status: 'Open' },
  { type: 'Call', description: 'Teams Meeting Recording Processed', date: '2024-02-08', status: 'Completed' },
];

const RecentActivity: React.FC = () => {
  return (
    <div className="recent-activity">
      <h3>Recent Activities</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, index) => (
            <tr key={index}>
              <td>{activity.type}</td>
              <td>{activity.description}</td>
              <td>{activity.date}</td>
              <td>
                <span className={`status ${activity.status.toLowerCase().replace(' ', '-')}`}>
                  {activity.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentActivity;