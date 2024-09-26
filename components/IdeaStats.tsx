import { Card, CardContent } from "@/components/ui/card"
import React from 'react';

// interface IdeaStatsProps {
//   totalIdeas: number;
//   waitingIdeas: number;
//   inProgressIdeas: number;
//   doneIdeas: number;
// }

// interface StatCardProps {
//     label: string;
//     value: number;
//     colorClass: string;
//   }
  
//   export function IdeaStats({ totalIdeas, waitingIdeas, inProgressIdeas, doneIdeas }: IdeaStatsProps) {
//     return (
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//         <StatCard label="Total Posted Ideas" value={totalIdeas} colorClass="bg-primary text-primary-foreground" />
//         <StatCard label="Total Waiting Ideas" value={waitingIdeas} colorClass="bg-yellow-100 text-yellow-800" />
//         <StatCard label="Total In Progress Ideas" value={inProgressIdeas} colorClass="bg-blue-100 text-blue-800" />
//         <StatCard label="Total Done Ideas" value={doneIdeas} colorClass="bg-green-100 text-green-800" />
//       </div>
//     )
//   }
  
//   function StatCard({ label, value, colorClass }: StatCardProps) {
//     return (
//       <Card className={`${colorClass} transition-colors duration-200`}>
//         <CardContent className="flex flex-col items-center justify-center p-6">
//           <h3 className="text-3xl font-bold mb-2">{value}</h3>
//           <p className="text-sm">{label}</p>
//         </CardContent>
//       </Card>
//     )
//   }

// Define the StatusFilter type
export type StatusFilter = 'all' | 'waiting' | 'in_progress' | 'done';

interface IdeaStatsProps {
  totalIdeas: number;
  waitingIdeas: number;
  inProgressIdeas: number;
  doneIdeas: number;
  activeStatus: StatusFilter;
  setActiveStatus: (status: StatusFilter) => void;
}

export function IdeaStats({ 
  totalIdeas, 
  waitingIdeas, 
  inProgressIdeas, 
  doneIdeas, 
  activeStatus, 
  setActiveStatus 
}: IdeaStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <StatCard
        title="Total Ideas"
        value={totalIdeas}
        onClick={() => setActiveStatus('all')}
        active={activeStatus === 'all'}
        color="bg-purple-500"
        hoverColor="hover:bg-purple-600"
      />
      <StatCard
        title="Waiting"
        value={waitingIdeas}
        onClick={() => setActiveStatus('waiting')}
        active={activeStatus === 'waiting'}
        color="bg-yellow-100 text-yellow-800" 
        hoverColor="hover:bg-yellow-600"
      />
      <StatCard
        title="In Progress"
        value={inProgressIdeas}
        onClick={() => setActiveStatus('in_progress')}
        active={activeStatus === 'in_progress'}
        color="bg-blue-200 text-black-800"
        hoverColor="hover:bg-blue-600"
      />
      <StatCard
        title="Done"
        value={doneIdeas}
        onClick={() => setActiveStatus('done')}
        active={activeStatus === 'done'}
        color="bg-green-200 text-green-800"
        hoverColor="hover:bg-green-600"
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  onClick: () => void;
  active: boolean;
  color: string;
  hoverColor: string;
}

function StatCard({ title, value, color, hoverColor, onClick, active }: StatCardProps) {
  return (
    <div
      className={`p-4 rounded-lg shadow-md cursor-pointer transition-colors duration-200 ${
        active ?`${color} text-white` : `bg-white ${hoverColor}`
      }`}
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}