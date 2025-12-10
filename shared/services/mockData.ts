import { User, Role } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    firstName: 'David',
    lastName: 'Miller',
    email: 'david.m@hrnexus.com',
    role: Role.ADMIN,
    designation: 'CEO',
    department: 'Executive',
    status: 'active',
    checkInStatus: 'out',
    avatarUrl: 'https://picsum.photos/200'
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.j@hrnexus.com',
    role: Role.MANAGER,
    designation: 'Senior Developer',
    department: 'Engineering',
    status: 'active',
    checkInStatus: 'in',
    lastCheckIn: new Date(),
    avatarUrl: 'https://picsum.photos/201'
  },
  {
    id: '3',
    firstName: 'Lilly',
    lastName: 'Williams',
    email: 'lilly.w@hrnexus.com',
    role: Role.USER,
    designation: 'Product Designer',
    department: 'Design',
    status: 'active',
    checkInStatus: 'out',
    avatarUrl: 'https://picsum.photos/202'
  },
  {
    id: '4',
    firstName: 'Christopher',
    lastName: 'Brown',
    email: 'chris.b@hrnexus.com',
    role: Role.USER,
    designation: 'QA Engineer',
    department: 'Engineering',
    status: 'inactive',
    checkInStatus: 'out',
    avatarUrl: 'https://picsum.photos/203'
  },
   {
    id: '5',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah.c@hrnexus.com',
    role: Role.USER,
    designation: 'HR Specialist',
    department: 'HR',
    status: 'active',
    checkInStatus: 'in',
    avatarUrl: 'https://picsum.photos/204'
  }
];

export const WORK_SCHEDULE = [
  { day: 'Sun', date: '07', type: 'Weekend', active: false },
  { day: 'Mon', date: '08', type: 'General', time: '9:00 AM - 6:00 PM', active: true },
  { day: 'Tue', date: '09', type: 'General', time: '9:00 AM - 6:00 PM', active: true },
  { day: 'Wed', date: '10', type: 'General', time: '9:00 AM - 6:00 PM', active: true },
  { day: 'Thu', date: '11', type: 'General', time: '9:00 AM - 6:00 PM', active: true },
  { day: 'Fri', date: '12', type: 'General', time: '9:00 AM - 6:00 PM', active: true },
  { day: 'Sat', date: '13', type: 'Weekend', active: false },
];