import React from 'react';

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MANAGER = 'MANAGER'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  designation: string;
  department: string;
  avatarUrl?: string;
  status: 'active' | 'inactive';
  checkInStatus: 'in' | 'out';
  lastCheckIn?: Date;
}

export interface EmploymentDetails {
  userId: string; // UID linking to Auth + users collection
  employeeId?: string;
  nickName?: string;
  jobTitle?: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  employmentStatus?: string;
  hireDate?: string; // ISO date string
  dateOfExit?: string; // ISO date string
  sourceOfHire?: string;
  location?: string;
  managerName?: string;
  zohoRole?: string;
  currentExperience?: string;
  totalExperience?: string;
  dateOfBirth?: string;
  age?: string;
  gender?: string;
  maritalStatus?: string;
  about?: string;
  expertise?: string;
  extension?: string;
  seatingLocation?: string;
  tags?: string;
  presentAddress?: string;
  permanentAddress?: string;
  workPhone?: string;
  personalPhone?: string;
  personalEmail?: string;
  addedBy?: string;
  modifiedBy?: string;
  addedTime?: string;
  modifiedTime?: string;
  onboardingStatus?: string;
  workExperienceCompany?: string;
  workExperienceJobTitle?: string;
  workExperienceFrom?: string;
  workExperienceTo?: string;
  workExperienceJobDescription?: string;
  workExperienceRelevant?: string;
  educationInstituteName?: string;
  educationDegree?: string;
  educationSpecialization?: string;
  educationCompletionDate?: string;
  notes?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string; // ISO string
  checkOut?: string;
  status: 'present' | 'absent' | 'half-day';
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  subItems?: NavItem[];
}

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}
