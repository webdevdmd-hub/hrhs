import React, { useState, useEffect } from 'react';
import { MOCK_USERS, WORK_SCHEDULE } from '../../../shared/services/mockData';
import Button from '../../shared/ui/Button';
import { Clock, MoreHorizontal, Sun, AlertCircle, Settings, ChevronRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const currentUser = MOCK_USERS[0]; // Simulating logged-in user
  const [, setTime] = useState(new Date());
  const [timer, setTimer] = useState<number>(0); // Seconds elapsed
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('Activities');

  // Clock Effect
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer Effect (simulated work timer)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isCheckedIn) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;
  };

  const tabs = ['Activities', 'Feeds', 'Profile', 'Approvals', 'Leave', 'Attendance', 'Time Logs', 'Files'];

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4 p-4 lg:p-8">
      
      {/* LEFT COLUMN (Profile & Reportees) */}
      <div className="md:col-span-1 xl:col-span-1 space-y-4 sm:space-y-6">
        
        {/* User Profile Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50">
          <div className="h-24 sm:h-28 bg-[#1e293b] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 mix-blend-overlay"></div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 transform transition-transform hover:scale-105">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-slate-800 text-white flex items-center justify-center text-3xl font-light border-[4px] border-white shadow-lg">
                   {currentUser.firstName.charAt(0)}
                </div>
              </div>
          </div>
          <div className="mt-10 sm:mt-12 px-4 pb-6 sm:pb-8 text-center">
            <h2 className="text-xl font-bold text-gray-800">{currentUser.firstName} {currentUser.lastName}</h2>
            <p className="text-sm font-medium text-gray-500">{currentUser.designation}</p>
            
            <div className="mt-6 flex flex-col items-center gap-3">
               <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${!isCheckedIn ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                 {isCheckedIn ? 'Checked In' : 'Checked Out'}
               </span>
               <div className="text-3xl font-mono text-slate-700 tracking-wider font-variant-numeric tabular-nums">
                 {formatTimer(timer)}
               </div>
               <Button 
                 variant={isCheckedIn ? 'danger' : 'primary'} 
                 className={`w-full max-w-[200px] shadow-lg shadow-blue-500/20 transition-all ${!isCheckedIn ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                 onClick={() => setIsCheckedIn(!isCheckedIn)}
               >
                 {isCheckedIn ? 'Check-out' : 'Check-in'}
               </Button>
            </div>
          </div>
        </div>

        {/* Reportees */}
        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-gray-200/50">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Reportees</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {MOCK_USERS.slice(1, 4).map((user) => (
              <div key={user.id} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 overflow-hidden">
                   <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-700">{user.firstName} {user.lastName}</p>
                  <p className="truncate text-xs font-medium text-red-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    Yet to check-in
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded-lg py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
            View All Reportees
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN (Main Content) */}
      <div className="md:col-span-1 xl:col-span-3 space-y-4 sm:space-y-6">
        
        {/* Mobile-Friendly Scrollable Tabs */}
        <div className="sticky top-16 z-20 -mx-4 sm:mx-0 bg-gray-50/95 backdrop-blur sm:bg-transparent">
          <div className="border-b border-gray-200 bg-white px-2 sm:rounded-t-xl shadow-sm sm:shadow-none">
             <div className="flex overflow-x-auto custom-scrollbar scroll-smooth">
               {tabs.map((tab) => (
                 <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    whitespace-nowrap px-4 py-4 text-sm font-medium transition-all border-b-2
                    ${activeTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                 >
                   {tab}
                 </button>
               ))}
               <div className="flex-1 min-w-[40px]"></div>
               <div className="flex items-center px-4">
                   <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                     <Settings size={18}/>
                   </button>
               </div>
             </div>
          </div>
        </div>

        {/* Greeting Card */}
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gray-200/50 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                <Sun size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Good Morning, {currentUser.firstName}</h3>
                <p className="text-gray-500 text-sm mt-0.5">You have <span className="font-semibold text-blue-600">3 pending approvals</span> today.</p>
              </div>
            </div>
            {/* Visual Decoration for Desktop */}
            <div className="hidden sm:block opacity-60">
              <Sun size={64} className="text-orange-100/50" />
            </div>
        </div>

        {/* Work Schedule Timeline */}
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gray-200/50">
           <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Clock size={20} /></div>
               <div>
                  <h3 className="font-bold text-gray-800">Work Schedule</h3>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">07 Dec - 13 Dec 2025</p>
               </div>
             </div>
             <div className="text-right hidden sm:block">
                <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600">General Shift</span>
             </div>
           </div>

           {/* Responsive Timeline */}
           <div className="relative mt-2">
             <div className="overflow-x-auto pb-4 -mx-5 px-5 sm:mx-0 sm:px-0">
               <div className="min-w-[500px] md:min-w-0 md:w-full">
                 <div className="relative pt-6">
                    <div className="absolute left-0 top-[29px] w-full border-t border-gray-100"></div>
                    <div className="flex justify-between">
                        {WORK_SCHEDULE.map((day, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-3 relative z-10 group cursor-pointer">
                             <div className={`
                               h-4 w-4 rounded-full border-[3px] transition-all duration-300
                               ${day.active 
                                 ? 'border-blue-500 bg-white ring-4 ring-blue-50' 
                                 : 'border-gray-200 bg-gray-50'}
                               group-hover:scale-110
                             `}></div>
                             <div className={`
                               flex flex-col items-center p-2 rounded-lg transition-colors
                               ${day.day === 'Sun' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'hover:bg-gray-50'}
                             `}>
                               <span className="text-xs font-bold uppercase tracking-wider">{day.day}</span>
                               <span className={`text-lg font-bold leading-none mt-1 ${day.day === 'Sun' ? 'text-white' : 'text-gray-800'}`}>{day.date}</span>
                             </div>
                          </div>
                        ))}
                    </div>
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* Alert Card */}
        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-gray-200/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 border-l-4 border-orange-400">
           <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="flex-shrink-0 rounded-full bg-orange-50 p-2 text-orange-500">
               <AlertCircle size={24} />
             </div>
             <h4 className="font-bold text-gray-800 text-sm sm:hidden">Action Required</h4>
           </div>
           
           <div className="flex-1">
             <h4 className="font-bold text-gray-800 text-sm hidden sm:block">Action Required</h4>
             <p className="text-sm text-gray-600 mt-0.5">You are yet to submit your time logs for today. Please update them before EOD.</p>
           </div>
           
           <Button variant="ghost" size="sm" className="w-full sm:w-auto mt-2 sm:mt-0 ml-auto text-orange-600 hover:bg-orange-50 hover:text-orange-700 whitespace-nowrap justify-center">
             Fix now
           </Button>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;