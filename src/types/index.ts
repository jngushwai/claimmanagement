export interface Department {
  id: string;
  name: string;
  code: string;
  programmes?: Programme[];
}

export interface Programme {
  id: string;
  name: string;
  code: string;
  departmentId: string;
}

export interface Lecturer {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  departmentId?: string;
  department?: Department;
  programmeId?: string;
  programme?: Programme;
  bankName?: string;
  bankAccountName?: string;
  accountNumber?: string;
  hourlyRate: number;
  degreeRate: number;
  odRate: number;
  transportRate: number;
}

export interface User {
  id: string;
  email: string;
  role: 'lecturer' | 'super_admin';
  isActive: boolean;
  googleId?: string;
  lecturer?: Lecturer;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface ClassItem {
  id: string;
  name: string;
  type: 'DEGREE' | 'OD';
}

export interface TimetableEntry {
  id: string;
  moduleId: string;
  module: Module;
  classId: string;
  class: ClassItem;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface TeachingSession {
  id: string;
  moduleId: string;
  module: Module;
  classId: string;
  class: ClassItem;
  date: string;
  hours: number;
  hourlyRate: number;
  tuition: number;
  transport: number;
  gross: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback?: string;
}

export interface ClaimDocument {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  category: 'ATTENDANCE_SHEET' | 'TIMETABLE' | 'OTHER';
}

export interface Claim {
  id: string;
  lecturerId: string;
  lecturer?: Lecturer;
  month: number;
  year: number;
  totalHours: number;
  totalTuition: number;
  totalTransport: number;
  totalGross: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback?: string;
  documents?: ClaimDocument[];
  createdAt: string;
}
