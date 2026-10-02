import apiClient from '../api/apiClient';
import {
  StudentDashboardData,
  EnrolledModule,
  EnrolledMentor,
} from '../../domain/entities/StudentDashboard';

const FALLBACK_DASHBOARD: StudentDashboardData = {
  user: {
    name: 'Nethmi Silva',
    email: 'nethmi.silva@student.unimentor.lk',
    role: 'student',
    degreeProgramme: 'BSc (Hons) Software Engineering',
    academicYear: 'Year 3',
    semester: 'Sem 2',
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  academicStats: {
    goals: 4,
    plans: 3,
    dueTests: 2,
    done: 18,
  },
  deadlineAlert: {
    id: 'alert-prob-stat',
    tag: 'DEADLINE APPROACHING • 2 DAYS LEFT',
    title: 'Mock Exam: Probability & Statist',
    moduleCode: 'MA2010',
    daysLeft: 2,
    reviewAction: 'Review Mock Exam',
    tutorAction: 'Find Tutor',
    tutorQuery: 'Probability',
  },
  quickLaunchpad: [
    { key: 'goal', label: 'New Goal', icon: 'goal', isHighlighted: true },
    { key: 'pods', label: 'Pods', icon: 'pods', badge: '3' },
    { key: 'session', label: 'Join session', icon: 'session' },
    { key: 'library', label: 'Library', icon: 'library' },
  ],
  liveSession: {
    id: 'live-ds-1',
    tag: 'LIVE NOW',
    timeRemaining: '35m left',
    title: 'Data Structures: Graph Traversals',
    moduleCode: 'IT2040',
    sessionType: 'Peer Revision',
    subtitle: 'Module Code: IT2040 • Peer Revision',
    activeParticipants: 24,
    mentor: {
      id: 'mentor-tharushi-1',
      name: 'Tharushi Perera',
      roleTitle: 'Senior Peer Mentor',
      batch: "Batch '24",
      rating: 4.9,
      reviewCount: 38,
      activeCount: 24,
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      subjects: ['Data Structures', 'Algorithms', 'OOP'],
      bio: 'Final-year Software Engineering undergraduate with high distinction in Algorithms and Data Structures.',
    },
    roomAction: 'Join Room',
  },
  enrolledModules: [
    {
      code: 'IT2040',
      name: 'Data Structures: Graph Traversals & Algorithms',
      credits: 4,
      faculty: 'Computing',
      department: 'Software Engineering',
      progress: 75,
      status: 'active',
      nextSession: 'Today, 2:30 PM • Live Peer Revision',
      mentor: {
        id: 'mentor-tharushi-1',
        name: 'Tharushi Perera',
        roleTitle: 'Senior Peer Mentor',
        batch: "Batch '24",
        rating: 4.9,
        reviewCount: 38,
        activeStudentsCount: 24,
        isVerified: true,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        subjects: ['Data Structures', 'Algorithms', 'OOP'],
        bio: 'Specialist in Graph Algorithms, Dynamic Programming, and Tree Traversals.',
        hourlyRate: 2500,
      },
    },
    {
      code: 'SE3020',
      name: 'Software Architecture & Enterprise Design',
      credits: 4,
      faculty: 'Computing',
      department: 'Software Engineering',
      progress: 60,
      status: 'active',
      nextSession: 'Tomorrow, 10:00 AM • Microservices Q&A',
      mentor: {
        id: 'mentor-kaveen-2',
        name: 'Kaveen De Silva',
        roleTitle: 'Lead Peer Mentor',
        batch: "Batch '23",
        rating: 4.8,
        reviewCount: 29,
        activeStudentsCount: 19,
        isVerified: true,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        subjects: ['Software Architecture', 'OOP', 'DevOps'],
        bio: 'Expert in Clean Architecture, Domain Driven Design, and Cloud Microservices.',
        hourlyRate: 1800,
      },
    },
    {
      code: 'IT2030',
      name: 'Database Management Systems & Big Data',
      credits: 3,
      faculty: 'Computing',
      department: 'Information Technology',
      progress: 85,
      status: 'active',
      nextSession: 'Friday, 3:00 PM • Query Optimization',
      mentor: {
        id: 'mentor-sanduni-3',
        name: 'Sanduni Fernando',
        roleTitle: 'Peer Tutor',
        batch: "Batch '24",
        rating: 4.95,
        reviewCount: 44,
        activeStudentsCount: 31,
        isVerified: true,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        subjects: ['DBMS', 'SQL', 'NoSQL', 'Big Data Analytics'],
        bio: 'Experienced in Relational schemas, indexing strategies, and database scalability.',
        hourlyRate: 2200,
      },
    },
    {
      code: 'MA2010',
      name: 'Probability & Statistics for Computing',
      credits: 3,
      faculty: 'Humanities & Sciences',
      department: 'Mathematics & Statistics',
      progress: 45,
      status: 'active',
      nextSession: 'Saturday, 11:00 AM • Mock Exam Prep',
      mentor: {
        id: 'mentor-asanka-4',
        name: 'Dr. Asanka Perera',
        roleTitle: 'Faculty Academic Mentor',
        batch: 'Faculty Advisor',
        rating: 5.0,
        reviewCount: 52,
        activeStudentsCount: 42,
        isVerified: true,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        subjects: ['Probability', 'Applied Statistics', 'Calculus'],
        bio: 'Faculty advisor focusing on stochastic modeling, hypothesis testing, and Bayesian networks.',
        hourlyRate: 4500,
      },
    },
  ],
  availableMentors: [
    {
      id: 'mentor-tharushi-1',
      name: 'Tharushi Perera',
      roleTitle: 'Senior Peer Mentor',
      batch: "Batch '24",
      rating: 4.9,
      reviewCount: 38,
      activeStudentsCount: 24,
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      subjects: ['Data Structures', 'Algorithms', 'OOP'],
      hourlyRate: 2500,
    },
    {
      id: 'mentor-kaveen-2',
      name: 'Kaveen De Silva',
      roleTitle: 'Lead Peer Mentor',
      batch: "Batch '23",
      rating: 4.8,
      reviewCount: 29,
      activeStudentsCount: 19,
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      subjects: ['Software Architecture', 'OOP', 'DevOps'],
      hourlyRate: 1800,
    },
    {
      id: 'mentor-sanduni-3',
      name: 'Sanduni Fernando',
      roleTitle: 'Peer Tutor',
      batch: "Batch '24",
      rating: 4.95,
      reviewCount: 44,
      activeStudentsCount: 31,
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      subjects: ['DBMS', 'SQL', 'Big Data Analytics'],
      hourlyRate: 2200,
    },
    {
      id: 'mentor-asanka-4',
      name: 'Dr. Asanka Perera',
      roleTitle: 'Faculty Academic Mentor',
      batch: 'Faculty Advisor',
      rating: 5.0,
      reviewCount: 52,
      activeStudentsCount: 42,
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      subjects: ['Probability', 'Applied Statistics', 'Calculus'],
      hourlyRate: 4500,
    },
    {
      id: 'mentor-kavindu-5',
      name: 'Kavindu Wickramasinghe',
      roleTitle: 'Senior Peer Mentor',
      batch: "Batch '23",
      rating: 4.88,
      reviewCount: 40,
      activeStudentsCount: 28,
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
      subjects: ['Machine Learning', 'Artificial Intelligence', 'Data Mining'],
      hourlyRate: 3800,
    },
  ],
};

export const studentRepository = {
  async getDashboard(): Promise<StudentDashboardData> {
    try {
      const response = await apiClient.get<StudentDashboardData>('/users/dashboard');
      if (response.data && response.data.enrolledModules) {
        return response.data;
      }
      return FALLBACK_DASHBOARD;
    } catch (err) {
      console.warn('[studentRepository] Failed to fetch remote dashboard, using local fallback data:', err);
      return FALLBACK_DASHBOARD;
    }
  },

  async registerModule(data: {
    code: string;
    name: string;
    credits?: number;
    faculty?: string;
    department?: string;
    mentor?: EnrolledMentor;
  }): Promise<EnrolledModule[]> {
    try {
      const response = await apiClient.post<{ enrolledModules: EnrolledModule[] }>('/users/enrolled-modules', data);
      return response.data.enrolledModules;
    } catch (err) {
      console.warn('[studentRepository] Failed to register module on server:', err);
      throw err;
    }
  },

  async assignMentor(code: string, mentor: EnrolledMentor): Promise<EnrolledModule[]> {
    try {
      const response = await apiClient.put<{ enrolledModules: EnrolledModule[] }>(
        `/users/enrolled-modules/${code}/mentor`,
        { mentor }
      );
      return response.data.enrolledModules;
    } catch (err) {
      console.warn('[studentRepository] Failed to assign mentor on server:', err);
      throw err;
    }
  },

  async dropModule(code: string): Promise<EnrolledModule[]> {
    try {
      const response = await apiClient.delete<{ enrolledModules: EnrolledModule[] }>(
        `/users/enrolled-modules/${code}`
      );
      return response.data.enrolledModules;
    } catch (err) {
      console.warn('[studentRepository] Failed to drop module on server:', err);
      throw err;
    }
  },

  async addGoal(): Promise<{ goals: number }> {
    try {
      const response = await apiClient.post<{ academicStats: { goals: number } }>('/users/goals', {});
      return response.data.academicStats;
    } catch (err) {
      console.warn('[studentRepository] Failed to add goal on server:', err);
      throw err;
    }
  },

  async updateProgress(code: string, progress: number, nextSession?: string): Promise<EnrolledModule[]> {
    try {
      const response = await apiClient.put<{ enrolledModules: EnrolledModule[] }>(
        `/users/enrolled-modules/${code}/progress`,
        { progress, nextSession }
      );
      return response.data.enrolledModules;
    } catch (err) {
      console.warn('[studentRepository] Failed to update progress on server:', err);
      throw err;
    }
  },
};
