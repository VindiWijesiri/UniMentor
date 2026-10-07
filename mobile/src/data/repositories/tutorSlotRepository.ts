import { TutorSlot, RegisteredAttendee } from '../../domain/entities/TutorSlot';
import apiClient from '../api/apiClient';
import { getDynamicDate } from './tutorSettingsRepository';

const INITIAL_SLOTS: TutorSlot[] = [
  {
    id: 'slot-1',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    title: 'Database Normalization & Query Tuning Deep-Dive',
    module: 'Database Management Systems',
    date: getDynamicDate(0),
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    duration: '90 Mins',
    timeRange: '09:00 AM - 10:30 AM',
    fee: 2500,
    type: 'both',
    maxCapacity: 5,
    bookedCount: 2,
    description:
      'Comprehensive breakdown of 1NF, 2NF, 3NF, BCNF with real SLIIT past paper problem solving and indexing strategy.',
    prerequisites: 'Basic SQL and Relational Algebra concepts.',
    mode: 'Online',
    location: 'Microsoft Teams • Link Provided Upon Booking',
    targetBatch: 'Year 2 & Year 3',
    registeredAttendees: [
      {
        id: 'att-1',
        studentName: 'Kasun Dissanayake',
        studentEmail: 'kasun.d@sliit.lk',
        registeredAt: 'Yesterday, 10:30 AM',
        status: 'confirmed',
        bookingType: 'individual',
        notes: 'Need special help with 3NF vs BCNF decomposition rules.',
        feePaid: 2500,
      },
      {
        id: 'att-2',
        studentName: 'Sanduni Weerasinghe',
        studentEmail: 'sanduni.w@sliit.lk',
        registeredAt: 'Yesterday, 04:15 PM',
        status: 'confirmed',
        bookingType: 'individual',
        notes: 'Focus on indexing query execution plans.',
        feePaid: 2500,
      },
    ],
    isAvailable: true,
  },
  {
    id: 'slot-2',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    title: 'Tree & Graph Traversals Algorithm Revision Pod',
    module: 'Data Structures & Algorithms',
    date: getDynamicDate(0),
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    duration: '90 Mins',
    timeRange: '11:00 AM - 12:30 PM',
    fee: 1800,
    type: 'group',
    maxCapacity: 6,
    bookedCount: 3,
    description:
      'Interactive study group solving recursive graph traversals, BFS/DFS cycle detection, and Dijkstra algorithm with live whiteboard peer coding.',
    prerequisites: 'Knowledge of arrays, recursion, and linked structures.',
    mode: 'In-Person',
    location: 'SLIIT Malabe Campus • Computing Building Lab 402',
    targetBatch: 'Year 2 Sem 1/2',
    registeredAttendees: [
      {
        id: 'att-3',
        studentName: 'SE Revision Pod #3',
        studentEmail: 'pod-lead@sliit.lk',
        registeredAt: 'Today, 08:30 AM',
        status: 'confirmed',
        bookingType: 'group',
        groupName: 'SE Revision Pod #3',
        groupSize: 3,
        notes: 'Group of 3 SE students preparing for mid-term tests.',
        feePaid: 5400,
      },
    ],
    isAvailable: true,
  },
  {
    id: 'slot-alex-10am',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    title: 'B+ Trees & Query Execution Plans Mentoring',
    module: 'Database Management Systems',
    date: getDynamicDate(0),
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    duration: '60 Mins',
    timeRange: '10:00 AM - 11:00 AM',
    fee: 2500,
    type: 'both',
    maxCapacity: 5,
    bookedCount: 1,
    description:
      'Targeted 1-on-1 and small group deep-dive on indexing trees, cost-based optimizers, and query bottlenecks.',
    prerequisites: 'Basic SQL syntax and relational algebra.',
    mode: 'Online',
    location: 'Microsoft Teams • Link Provided Upon Booking',
    targetBatch: 'Year 2 & Year 3',
    registeredAttendees: [],
    isAvailable: true,
  },
  {
    id: 'slot-alex-conflict',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    title: 'Relational Schema Design & Normalization Lab',
    module: 'Database Management Systems',
    date: getDynamicDate(0),
    startTime: '02:00 PM',
    endTime: '03:00 PM',
    duration: '60 Mins',
    timeRange: '02:00 PM - 03:00 PM',
    fee: 2500,
    type: 'both',
    maxCapacity: 4,
    bookedCount: 2,
    description:
      'Problem solving session for normalization and schema decomposing with past SLIIT exam questions.',
    prerequisites: 'Relational algebra & SQL basics.',
    mode: 'Online',
    location: 'Microsoft Teams Meeting',
    targetBatch: 'Year 2',
    registeredAttendees: [],
    hasConflict: true,
    conflictDetails: {
      existingSessionTitle: 'Data Structures',
      existingWith: 'with Prof. Kumar',
      time: `${getDynamicDate(0)}, 2:00 PM – 3:00 PM`,
    },
    isAvailable: false,
  },
  {
    id: 'slot-alex-4pm',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    title: 'Advanced Query Optimization & Indexing Practice',
    module: 'Database Management Systems',
    date: getDynamicDate(0),
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    duration: '60 Mins',
    timeRange: '04:00 PM - 05:00 PM',
    fee: 2500,
    type: 'both',
    maxCapacity: 5,
    bookedCount: 0,
    description:
      'Afternoon alternative session focusing on BCNF decomposition and query performance optimization.',
    prerequisites: 'Course lecture notes.',
    mode: 'Online',
    location: 'Microsoft Teams Meeting',
    targetBatch: 'Year 2 & Year 3',
    registeredAttendees: [],
    isAvailable: true,
  },
  {
    id: 'slot-alex-530pm',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    title: 'Database Transactions & ACID Properties Revision',
    module: 'Database Management Systems',
    date: getDynamicDate(0),
    startTime: '05:30 PM',
    endTime: '06:30 PM',
    duration: '60 Mins',
    timeRange: '05:30 PM - 06:30 PM',
    fee: 2500,
    type: 'both',
    maxCapacity: 5,
    bookedCount: 1,
    description:
      'Evening peer revision on concurrency control, transaction isolation levels, and serializability.',
    prerequisites: 'DBMS fundamentals.',
    mode: 'Online',
    location: 'Microsoft Teams Meeting',
    targetBatch: 'Year 2 & Year 3',
    registeredAttendees: [],
    isAvailable: true,
  },
  {
    id: 'slot-3',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    title: '1-on-1 Software Architecture Design Patterns Mentoring',
    module: 'Software Architecture & Design',
    date: 'Saturday, 20 Sep 2025',
    startTime: '02:00 PM',
    endTime: '03:00 PM',
    duration: '60 Mins',
    timeRange: '02:00 PM - 03:00 PM',
    fee: 3000,
    type: '1-on-1',
    maxCapacity: 1,
    bookedCount: 0,
    description:
      'Private 1-on-1 architecture review for Factory, Singleton, Strategy, and Clean Layered Design principles for your ongoing project.',
    prerequisites: 'OOP fundamentals in Java/TypeScript.',
    mode: 'Online',
    location: 'Zoom Audio/Video Interactive',
    targetBatch: 'Year 3',
    registeredAttendees: [],
    isAvailable: true,
  },
  {
    id: 'slot-4',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    title: 'Mobile App State Management & Navigation Workshop',
    module: 'Mobile Application Development',
    date: 'Monday, 22 Sep 2025',
    startTime: '03:30 PM',
    endTime: '05:00 PM',
    duration: '90 Mins',
    timeRange: '03:30 PM - 05:00 PM',
    fee: 2200,
    type: 'both',
    maxCapacity: 8,
    bookedCount: 4,
    description:
      'Hands-on session building React Native state stores with Zustand, nested React Navigation stacks, and handling offline async storage.',
    prerequisites: 'Basic JavaScript/React fundamentals.',
    mode: 'Hybrid',
    location: 'SLIIT FOC Lab 304 & MS Teams Live Stream',
    targetBatch: 'Year 3 Sem 1',
    registeredAttendees: [
      {
        id: 'att-4',
        studentName: 'Algorithms Study Pod',
        studentEmail: 'algo-pod@sliit.lk',
        registeredAt: 'Yesterday, 02:00 PM',
        status: 'confirmed',
        bookingType: 'group',
        groupName: 'Algorithms Study Pod',
        groupSize: 4,
        notes: 'Group attending from computing lab.',
        feePaid: 8800,
      },
    ],
    isAvailable: true,
  },
  {
    id: 'slot-5',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    title: 'Distributed Systems & Cloud Microservices Q&A',
    module: 'Cloud Computing & Distributed Systems',
    date: 'Tuesday, 23 Sep 2025',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    duration: '60 Mins',
    timeRange: '10:00 AM - 11:00 AM',
    fee: 2400,
    type: '1-on-1',
    maxCapacity: 1,
    bookedCount: 1,
    description:
      'Individual code review and architectural feedback for Docker containerization and Kubernetes cluster deployments.',
    prerequisites: 'Linux commands and basic networking.',
    mode: 'Online',
    location: 'Microsoft Teams Call',
    targetBatch: 'Year 4 / Final Year',
    registeredAttendees: [
      {
        id: 'att-5',
        studentName: 'Chathura Rajapaksha',
        studentEmail: 'chathura.r@sliit.lk',
        registeredAt: '2 days ago',
        status: 'confirmed',
        bookingType: 'individual',
        notes: 'Reviewing Dockerfile and compose configurations.',
        feePaid: 2400,
      },
    ],
    isAvailable: false,
  },
  {
    id: 'slot-tharushi-1',
    mentorId: 'demo-tutor-1',
    mentorName: 'Tharushi Perera',
    title: 'Graph Traversals: BFS vs DFS & Cycle Detection',
    module: 'Data Structures & Algorithms',
    date: 'Today',
    startTime: '02:30 PM',
    endTime: '04:00 PM',
    duration: '90 Mins',
    timeRange: '02:30 PM - 04:00 PM',
    fee: 1500,
    type: 'group',
    maxCapacity: 6,
    bookedCount: 4,
    description:
      'Detailed walkthrough of adjacency lists, BFS queue traversal, recursive DFS and cycle detection in directed graphs.',
    prerequisites: 'Basic arrays and recursion concepts.',
    mode: 'Online',
    location: 'UniMentor Live Room • Pod Alpha',
    targetBatch: 'Year 2 & Year 3',
    registeredAttendees: [
      {
        id: 'att-t-1',
        studentName: 'Kavindu Perera',
        studentEmail: 'kavindu.p@my.sliit.lk',
        registeredAt: 'Today, 10:30 AM',
        status: 'confirmed',
        bookingType: 'group',
        notes: 'Struggling with finding back-edges in directed DFS.',
        feePaid: 1500,
      },
      {
        id: 'att-t-2',
        studentName: 'Nethmi Silva',
        studentEmail: 'nethmi.silva@student.unimentor.lk',
        registeredAt: 'Today, 11:15 AM',
        status: 'confirmed',
        bookingType: 'group',
        notes: 'Need clarity on time complexity analysis O(V+E).',
        feePaid: 1500,
      },
      {
        id: 'att-t-3',
        studentName: 'Dulitha Bandara',
        studentEmail: 'dulitha.b@my.sliit.lk',
        registeredAt: 'Today, 01:20 PM',
        status: 'confirmed',
        bookingType: 'group',
        notes: 'Ready with test cases.',
        feePaid: 1500,
      },
    ],
    isAvailable: true,
  },
  {
    id: 'slot-tharushi-2',
    mentorId: 'demo-tutor-1',
    mentorName: 'Tharushi Perera',
    title: 'Clean Architecture Patterns & SOLID Principles Mentoring',
    module: 'Software Architecture & Design',
    date: 'Tomorrow',
    startTime: '04:30 PM',
    endTime: '06:00 PM',
    duration: '90 Mins',
    timeRange: '04:30 PM - 06:00 PM',
    fee: 2000,
    type: '1-on-1',
    maxCapacity: 2,
    bookedCount: 1,
    description:
      'Individual review for Clean Architecture layers, Repository pattern, and Dependency Inversion.',
    prerequisites: 'Object Oriented Programming basics.',
    mode: 'Online',
    location: 'UniMentor Live Room • Hall B',
    targetBatch: 'Year 3',
    registeredAttendees: [
      {
        id: 'att-t-4',
        studentName: 'Chamath Vihanga',
        studentEmail: 'chamath.v@my.sliit.lk',
        registeredAt: 'Yesterday, 04:00 PM',
        status: 'confirmed',
        bookingType: 'individual',
        notes: 'Layer boundaries and entity modeling queries.',
        feePaid: 2000,
      },
    ],
    isAvailable: true,
  },
];

let inMemorySlots: TutorSlot[] = [...INITIAL_SLOTS];
const slotListeners = new Set<() => void>();

function notifySlotListeners() {
  slotListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('Listener error in tutorSlotRepository:', e);
    }
  });
}

function transformBackendSlot(item: any): TutorSlot {
  return {
    id: item._id || item.id,
    mentorId: item.mentorId ? String(item.mentorId) : 'demo-tutor-1',
    mentorName: item.mentorName || 'Tharushi Perera',
    title: item.title || item.module || 'Mentoring Session',
    module: item.module || 'General Computing',
    date: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
    duration: item.duration || '60 Mins',
    timeRange: item.timeRange || `${item.startTime} - ${item.endTime}`,
    fee: Number(item.fee) || 2000,
    type: item.type || 'both',
    maxCapacity: Number(item.maxCapacity) || 5,
    bookedCount: Number(item.bookedCount) || 0,
    description: item.description || '',
    prerequisites: item.prerequisites || 'None',
    mode: item.mode || 'Online',
    location: item.location || 'Microsoft Teams',
    targetBatch: item.targetBatch || 'All Batches',
    registeredAttendees: Array.isArray(item.registeredAttendees)
      ? item.registeredAttendees.map((a: any) => ({
          id: a._id || a.id,
          studentId: a.studentId ? String(a.studentId) : undefined,
          studentName: a.studentName || 'Student',
          studentEmail: a.studentEmail || 'student@sliit.lk',
          studentAvatar: a.studentAvatar,
          faceVerificationPhoto: a.faceVerificationPhoto || a.studentAvatar,
          isFaceVerified: a.isFaceVerified !== false,
          registeredAt: a.registeredAt ? new Date(a.registeredAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Recently',
          status: a.status || 'confirmed',
          bookingType: a.bookingType || 'individual',
          groupName: a.groupName,
          groupSize: a.groupSize || 1,
          notes: a.notes,
          feePaid: a.feePaid,
        }))
      : [],
    hasConflict: !!item.hasConflict,
    conflictDetails: item.conflictDetails,
    isAvailable: item.isAvailable !== false,
  };
}

export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3];

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function normalizeDateKey(dateStr: string): string {
  if (!dateStr) return '';
  const cleaned = dateStr.trim().toLowerCase();
  const withoutDay = cleaned.replace(
    /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)[,\s]+/i,
    ''
  ).trim();
  return withoutDay.replace(/[,\.]/g, '').replace(/\s+/g, ' ');
}

export function isSameOrMatchingDate(slotDate: string, queryDate: string): boolean {
  if (!slotDate || !queryDate) return false;
  const s = slotDate.trim().toLowerCase();
  const q = queryDate.trim().toLowerCase();
  if (s === q) return true;

  const todayStr = getDynamicDate(0).toLowerCase();
  const tomorrowStr = getDynamicDate(1).toLowerCase();

  const isQueryToday = q.includes('today') || q === todayStr || todayStr.includes(normalizeDateKey(q));
  const isSlotToday = s.includes('today') || s === todayStr || todayStr.includes(normalizeDateKey(s));
  if (isQueryToday && isSlotToday) return true;

  const isQueryTmrw = q.includes('tomorrow') || q.includes('tmrw') || q === tomorrowStr || tomorrowStr.includes(normalizeDateKey(q));
  const isSlotTmrw = s.includes('tomorrow') || s.includes('tmrw') || s === tomorrowStr || tomorrowStr.includes(normalizeDateKey(s));
  if (isQueryTmrw && isSlotTmrw) return true;

  // Extract day, month, year
  const extractParts = (str: string) => {
    const iso = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      return {
        year: parseInt(iso[1], 10),
        month: parseInt(iso[2], 10),
        day: parseInt(iso[3], 10),
      };
    }
    const dmy = str.match(/(\d{1,2})\s+([a-zA-Z]{3,9})(?:\s+(\d{4}))?/);
    if (dmy) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const mIdx = monthNames.findIndex((m) => dmy[2].toLowerCase().startsWith(m));
      return {
        day: parseInt(dmy[1], 10),
        month: mIdx >= 0 ? mIdx + 1 : 0,
        year: dmy[3] ? parseInt(dmy[3], 10) : null,
      };
    }
    const mdy = str.match(/([a-zA-Z]{3,9})\s+(\d{1,2})(?:,?\s+(\d{4}))?/);
    if (mdy) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const mIdx = monthNames.findIndex((m) => mdy[1].toLowerCase().startsWith(m));
      return {
        day: parseInt(mdy[2], 10),
        month: mIdx >= 0 ? mIdx + 1 : 0,
        year: mdy[3] ? parseInt(mdy[3], 10) : null,
      };
    }
    return null;
  };

  const p1 = extractParts(s);
  const p2 = extractParts(q);
  if (p1 && p2 && p1.day === p2.day && p1.month === p2.month) {
    if (!p1.year || !p2.year || p1.year === p2.year) {
      return true;
    }
  }

  // Normalized substring check
  const ns = normalizeDateKey(s);
  const nq = normalizeDateKey(q);
  if (ns.length >= 4 && nq.length >= 4 && (ns.includes(nq) || nq.includes(ns))) {
    return true;
  }

  return false;
}

export const tutorSlotRepository = {
  async getSlotsByMentorAndDate(
    mentorId: string,
    mentorName: string,
    date: string,
    typeFilter?: '1-on-1' | 'group'
  ): Promise<TutorSlot[]> {
    // 1. Retrieve all slots belonging to this specific tutor (syncs local additions & server)
    const mentorSlots = await this.getAllSlots(mentorId, mentorName);

    // 2. Filter slots matching requested date
    let slots = mentorSlots.filter((s) => isSameOrMatchingDate(s.date, date));

    // 3. If typeFilter matches some slots, prioritize matching type, but keep available sessions
    if (typeFilter && slots.length > 0) {
      const typeMatching = slots.filter((s) => s.type === 'both' || s.type === typeFilter);
      if (typeMatching.length > 0) {
        slots = typeMatching;
      }
    }

    // 4. Return actual slots scheduled for this date (empty array if no sessions scheduled)
    return slots;
  },

  async getAllSlots(mentorId?: string, mentorName?: string): Promise<TutorSlot[]> {
    try {
      const response = await apiClient.get<any[]>('/slots');
      if (Array.isArray(response.data) && response.data.length > 0) {
        const backendSlots = response.data.map(transformBackendSlot);
        const merged = [...backendSlots];
        for (const localSlot of inMemorySlots) {
          const matchIdx = merged.findIndex((b) => b.id === localSlot.id);
          if (matchIdx >= 0) {
            const backendAttendees = merged[matchIdx].registeredAttendees || [];
            const localAttendees = localSlot.registeredAttendees || [];
            const allAttendees = [...backendAttendees];
            for (const la of localAttendees) {
              if (
                !allAttendees.some(
                  (ba) =>
                    ba.id === la.id ||
                    (ba.studentEmail === la.studentEmail && ba.registeredAt === la.registeredAt)
                )
              ) {
                allAttendees.push(la);
              }
            }
            merged[matchIdx].registeredAttendees = allAttendees;
            merged[matchIdx].bookedCount = Math.max(merged[matchIdx].bookedCount, allAttendees.length);
          } else {
            if (
              localSlot.bookedCount > 0 ||
              (localSlot.registeredAttendees && localSlot.registeredAttendees.length > 0)
            ) {
              merged.push(localSlot);
            }
          }
        }
        inMemorySlots = merged;
      }
    } catch {
      // Use in-memory
    }

    if (mentorId) {
      const mIdClean = mentorId.toLowerCase().trim();
      const mNameClean = (mentorName || '').toLowerCase().trim();

      const filtered = inMemorySlots.filter((s) => {
        const slotMId = (s.mentorId || '').toLowerCase().trim();
        const slotMName = (s.mentorName || '').toLowerCase().trim();

        // Exact or partial ID match
        if (slotMId === mIdClean || slotMId.includes(mIdClean) || mIdClean.includes(slotMId)) {
          return true;
        }

        // Mentor name match if tutor name is provided
        if (mNameClean && slotMName.length > 0 && (slotMName.includes(mNameClean) || mNameClean.includes(slotMName))) {
          return true;
        }

        // Demo tutor alias matching
        if (
          (mIdClean === 'demo-tutor-1' || mIdClean === 'mentor-demo-1' || mNameClean.includes('tharushi')) &&
          (slotMId === 'demo-tutor-1' || slotMId === 'mentor-demo-1' || slotMName.includes('tharushi'))
        ) {
          return true;
        }

        return false;
      });

      return filtered;
    }
    return [...inMemorySlots];
  },

  async addSlot(
    slot: Omit<TutorSlot, 'id' | 'bookedCount' | 'isAvailable'>
  ): Promise<TutorSlot> {
    const newSlot: TutorSlot = {
      ...slot,
      id: `slot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: slot.title || `${slot.module} Mentoring`,
      duration: slot.duration || '60 Mins',
      fee: Number(slot.fee) || 2000,
      description: slot.description || 'Hands-on revision and practical session.',
      mode: slot.mode || 'Online',
      location: slot.location || 'Microsoft Teams',
      targetBatch: slot.targetBatch || 'All Batches',
      registeredAttendees: slot.registeredAttendees || [],
      bookedCount: 0,
      isAvailable: true,
    };

    inMemorySlots.unshift(newSlot);

    try {
      const res = await apiClient.post('/slots', {
        title: newSlot.title,
        module: newSlot.module,
        date: newSlot.date,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        duration: newSlot.duration,
        fee: newSlot.fee,
        type: newSlot.type,
        maxCapacity: newSlot.maxCapacity,
        description: newSlot.description,
        prerequisites: newSlot.prerequisites,
        mode: newSlot.mode,
        location: newSlot.location,
        targetBatch: newSlot.targetBatch,
      });
      if (res.data?._id) {
        newSlot.id = res.data._id;
      }
    } catch {
      // Local addition remains effective
    }

    notifySlotListeners();
    return newSlot;
  },

  async updateSlot(slotId: string, updates: Partial<TutorSlot>): Promise<TutorSlot | null> {
    inMemorySlots = inMemorySlots.map((s) => (s.id === slotId ? { ...s, ...updates } : s));
    notifySlotListeners();
    try {
      await apiClient.put(`/slots/${slotId}`, updates);
    } catch {}
    return inMemorySlots.find((s) => s.id === slotId) || null;
  },

  async deleteSlot(slotId: string): Promise<void> {
    inMemorySlots = inMemorySlots.filter((s) => s.id !== slotId);
    notifySlotListeners();
    try {
      await apiClient.delete(`/slots/${slotId}`);
    } catch {}
  },

  async registerStudentToSlot(
    slotId: string,
    attendee: Omit<RegisteredAttendee, 'id' | 'registeredAt' | 'status'>
  ): Promise<TutorSlot | null> {
    const slot = inMemorySlots.find((s) => s.id === slotId);
    if (!slot) return null;

    const countToAdd = attendee.bookingType === 'group' ? Math.max(1, attendee.groupSize || 1) : 1;
    const newAttendee: RegisteredAttendee = {
      ...attendee,
      id: `att-${Date.now()}`,
      registeredAt: 'Just now',
      status: 'confirmed',
      isFaceVerified: attendee.isFaceVerified !== false,
      faceVerificationPhoto: attendee.faceVerificationPhoto || attendee.studentAvatar,
    };

    const updatedAttendees = [newAttendee, ...(slot.registeredAttendees || [])];
    const newBookedCount = (slot.bookedCount || 0) + countToAdd;
    const isNowFull = newBookedCount >= slot.maxCapacity;

    slot.registeredAttendees = updatedAttendees;
    slot.bookedCount = newBookedCount;
    slot.isAvailable = !isNowFull;
    notifySlotListeners();

    try {
      await apiClient.post(`/slots/${slotId}/register`, {
        studentName: attendee.studentName,
        studentEmail: attendee.studentEmail,
        studentAvatar: attendee.studentAvatar,
        faceVerificationPhoto: attendee.faceVerificationPhoto,
        isFaceVerified: true,
        bookingType: attendee.bookingType,
        groupName: attendee.groupName,
        groupSize: attendee.groupSize,
        notes: attendee.notes,
        feePaid: attendee.feePaid || slot.fee,
      });
    } catch {}

    return slot;
  },

  async markSlotBooked(
    slotId: string,
    isGroup: boolean,
    studentDetails?: {
      name: string;
      email: string;
      avatar?: string;
      faceVerificationPhoto?: string;
      isFaceVerified?: boolean;
      groupName?: string;
      groupSize?: number;
      notes?: string;
      feePaid?: number;
      mentorId?: string;
      mentorName?: string;
      slotTitle?: string;
      slotDate?: string;
      slotTime?: string;
    }
  ): Promise<void> {
    let slot = inMemorySlots.find((s) => s.id === slotId);

    const verifiedImg = studentDetails?.faceVerificationPhoto || studentDetails?.avatar;
    const countToAdd = isGroup ? (studentDetails?.groupSize || 1) : 1;
    const newAttendee: RegisteredAttendee = {
      id: `att-${Date.now()}`,
      studentName: studentDetails?.name || 'Student',
      studentEmail: studentDetails?.email || 'student@sliit.lk',
      studentAvatar: studentDetails?.avatar,
      faceVerificationPhoto: verifiedImg,
      isFaceVerified: true,
      registeredAt: 'Just now',
      status: 'confirmed',
      bookingType: isGroup ? 'group' : 'individual',
      groupName: studentDetails?.groupName || (isGroup ? 'Study Pod' : undefined),
      groupSize: countToAdd,
      notes: studentDetails?.notes,
      feePaid: studentDetails?.feePaid || (slot ? slot.fee : 2500),
    };

    if (!slot) {
      slot = {
        id: slotId,
        mentorId: studentDetails?.mentorId || 'demo-tutor-1',
        mentorName: studentDetails?.mentorName || 'Tharushi Perera',
        title: studentDetails?.slotTitle || 'Mentoring Session',
        module: 'Database Management Systems',
        date: studentDetails?.slotDate || getDynamicDate(0),
        startTime: studentDetails?.slotTime || '10:00 AM',
        endTime: '11:30 AM',
        duration: '90 Mins',
        timeRange: `${studentDetails?.slotTime || '10:00 AM'} - 11:30 AM`,
        fee: studentDetails?.feePaid || 2500,
        type: isGroup ? 'group' : 'both',
        maxCapacity: isGroup ? 5 : 1,
        bookedCount: countToAdd,
        description: 'Interactive peer session.',
        mode: 'Online',
        location: 'Microsoft Teams Meeting',
        registeredAttendees: [newAttendee],
        isAvailable: true,
      };
      inMemorySlots.unshift(slot);
    } else {
      slot.registeredAttendees = [newAttendee, ...(slot.registeredAttendees || [])];
      slot.bookedCount = (slot.bookedCount || 0) + countToAdd;
      if (slot.bookedCount >= slot.maxCapacity) {
        slot.isAvailable = false;
      }
    }
    notifySlotListeners();

    try {
      await apiClient.post(`/slots/${slotId}/register`, {
        studentName: newAttendee.studentName,
        studentEmail: newAttendee.studentEmail,
        studentAvatar: newAttendee.studentAvatar,
        faceVerificationPhoto: newAttendee.faceVerificationPhoto,
        isFaceVerified: true,
        bookingType: newAttendee.bookingType,
        groupName: newAttendee.groupName,
        groupSize: newAttendee.groupSize,
        notes: newAttendee.notes,
        feePaid: newAttendee.feePaid,
        mentorId: studentDetails?.mentorId || slot.mentorId,
        mentorName: studentDetails?.mentorName || slot.mentorName,
        title: slot.title,
        module: slot.module,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    } catch (err) {
      console.log('[tutorSlotRepository] Backend register error:', err);
    }
  },

  async cancelRegistration(
    slotIdOrOptions:
      | string
      | {
          slotId?: string;
          attendeeId?: string;
          studentEmail?: string;
          studentName?: string;
          mentorId?: string;
          mentorName?: string;
        },
    attendeeIdParam?: string
  ): Promise<boolean> {
    let slotId: string | undefined;
    let attendeeId: string | undefined;
    let studentEmail: string | undefined;
    let studentName: string | undefined;
    let mentorId: string | undefined;
    let mentorName: string | undefined;

    if (typeof slotIdOrOptions === 'string') {
      slotId = slotIdOrOptions;
      attendeeId = attendeeIdParam;
    } else {
      slotId = slotIdOrOptions.slotId;
      attendeeId = slotIdOrOptions.attendeeId;
      studentEmail = slotIdOrOptions.studentEmail;
      studentName = slotIdOrOptions.studentName;
      mentorId = slotIdOrOptions.mentorId;
      mentorName = slotIdOrOptions.mentorName;
    }

    let targetSlot = slotId ? inMemorySlots.find((s) => s.id === slotId) : undefined;

    // If not found by slotId, search slots belonging to this mentor that contain the attendee
    if (!targetSlot && (mentorId || mentorName)) {
      targetSlot = inMemorySlots.find((s) => {
        const matchMentor =
          (mentorId && s.mentorId === mentorId) ||
          (mentorName && s.mentorName.toLowerCase().includes(mentorName.toLowerCase()));
        if (!matchMentor) return false;
        if (!s.registeredAttendees || s.registeredAttendees.length === 0) return false;
        if (attendeeId && s.registeredAttendees.some((a) => a.id === attendeeId)) return true;
        if (studentEmail && s.registeredAttendees.some((a) => a.studentEmail?.toLowerCase() === studentEmail?.toLowerCase()))
          return true;
        if (studentName && s.registeredAttendees.some((a) => a.studentName?.toLowerCase().includes(studentName?.toLowerCase() || '')))
          return true;
        return true;
      });
    }

    if (!targetSlot) return false;

    let attendeeIdx = -1;
    if (attendeeId) {
      attendeeIdx = (targetSlot.registeredAttendees || []).findIndex((a) => a.id === attendeeId);
    }
    if (attendeeIdx === -1 && studentEmail) {
      attendeeIdx = (targetSlot.registeredAttendees || []).findIndex(
        (a) => a.studentEmail && a.studentEmail.toLowerCase() === studentEmail.toLowerCase()
      );
    }
    if (attendeeIdx === -1 && studentName) {
      attendeeIdx = (targetSlot.registeredAttendees || []).findIndex(
        (a) => a.studentName && a.studentName.toLowerCase().includes(studentName.toLowerCase())
      );
    }

    let countToRemove = 1;
    if (attendeeIdx >= 0 && targetSlot.registeredAttendees) {
      const att = targetSlot.registeredAttendees[attendeeIdx];
      countToRemove = att.bookingType === 'group' ? (att.groupSize || 1) : 1;
      targetSlot.registeredAttendees.splice(attendeeIdx, 1);
    } else if (targetSlot.registeredAttendees && targetSlot.registeredAttendees.length > 0) {
      targetSlot.registeredAttendees.pop();
    }

    targetSlot.bookedCount = Math.max(0, (targetSlot.bookedCount || 0) - countToRemove);
    targetSlot.isAvailable = targetSlot.bookedCount < targetSlot.maxCapacity;

    notifySlotListeners();

    try {
      await apiClient.post(`/slots/${targetSlot.id}/cancel-registration`, {
        attendeeId,
        studentEmail,
        studentName,
      });
    } catch (e) {
      console.log('[tutorSlotRepository] Backend cancel notice:', e);
    }

    return true;
  },

  checkOverlap(
    mentorId: string,
    mentorName: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeSlotId?: string
  ): { hasOverlap: boolean; overlappingSlot?: TutorSlot } {
    const newStart = parseTimeToMinutes(startTime);
    const newEnd = parseTimeToMinutes(endTime);

    if (newStart === null || newEnd === null || newEnd <= newStart) {
      return { hasOverlap: false };
    }

    const normNewDate = normalizeDateKey(date);

    const tutorSlots = inMemorySlots.filter((s) => {
      if (excludeSlotId && s.id === excludeSlotId) return false;
      const idMatch =
        mentorId &&
        s.mentorId &&
        (s.mentorId === mentorId || s.mentorId.includes(mentorId) || mentorId.includes(s.mentorId));
      const nameMatch =
        mentorName &&
        s.mentorName &&
        (s.mentorName.toLowerCase().includes(mentorName.toLowerCase()) ||
          mentorName.toLowerCase().includes(s.mentorName.toLowerCase()));
      return idMatch || nameMatch || (!mentorId && !mentorName);
    });

    for (const existing of tutorSlots) {
      const normExistingDate = normalizeDateKey(existing.date);
      const datesMatch =
        normNewDate === normExistingDate ||
        (existing.date && date && (existing.date.includes(date) || date.includes(existing.date)));

      if (datesMatch) {
        const existStart = parseTimeToMinutes(existing.startTime);
        const existEnd = parseTimeToMinutes(existing.endTime);

        if (existStart !== null && existEnd !== null) {
          if (newStart < existEnd && newEnd > existStart) {
            return { hasOverlap: true, overlappingSlot: existing };
          }
        }
      }
    }

    return { hasOverlap: false };
  },

  subscribe(callback: () => void): () => void {
    slotListeners.add(callback);
    return () => {
      slotListeners.delete(callback);
    };
  },
};
