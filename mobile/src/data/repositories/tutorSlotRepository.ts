import { TutorSlot, RegisteredAttendee } from '../../domain/entities/TutorSlot';
import apiClient from '../api/apiClient';

const INITIAL_SLOTS: TutorSlot[] = [
  {
    id: 'slot-1',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    title: 'Database Normalization & Query Tuning Deep-Dive',
    module: 'Database Management Systems',
    date: 'Friday, 19 Sep 2025',
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
    date: 'Friday, 19 Sep 2025',
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
];

let inMemorySlots: TutorSlot[] = [...INITIAL_SLOTS];

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

export const tutorSlotRepository = {
  async getSlotsByMentorAndDate(
    mentorId: string,
    mentorName: string,
    date: string,
    typeFilter?: '1-on-1' | 'group'
  ): Promise<TutorSlot[]> {
    try {
      const response = await apiClient.get<any[]>('/slots');
      if (Array.isArray(response.data) && response.data.length > 0) {
        const transformed = response.data.map(transformBackendSlot);
        inMemorySlots = transformed;
      }
    } catch {
      // Fallback to in-memory slots
    }

    let slots = inMemorySlots.filter((s) => {
      const matchMentor =
        !mentorId ||
        s.mentorId === mentorId ||
        s.mentorName.toLowerCase().includes(mentorName.toLowerCase()) ||
        mentorName.toLowerCase().includes(s.mentorName.toLowerCase()) ||
        true; // Allow matching for demo preview

      const matchDate =
        !date ||
        !s.date ||
        s.date === date ||
        s.date.includes(date) ||
        date.includes(s.date);

      return matchMentor && matchDate;
    });

    if (slots.length === 0) {
      // Generate clean slots for selected date if none exist
      const generated: TutorSlot = {
        id: `slot-${Date.now()}`,
        mentorId: mentorId || 'mentor-alex',
        mentorName: mentorName || 'Alex Ferreira',
        title: `${mentorName || 'Tutor'}'s Dedicated Mentoring Slot`,
        module: 'Database Management Systems',
        date,
        startTime: '10:00 AM',
        endTime: '11:30 AM',
        duration: '90 Mins',
        timeRange: '10:00 AM - 11:30 AM',
        fee: 2500,
        type: 'both',
        maxCapacity: 5,
        bookedCount: 0,
        description:
          'Dedicated peer session focusing on coursework guidance, problem sets, and targeted exam questions.',
        prerequisites: 'Course lecture notes and specific questions prepared.',
        mode: 'Online',
        location: 'Microsoft Teams Meeting',
        targetBatch: 'All Batches',
        registeredAttendees: [],
        isAvailable: true,
      };
      inMemorySlots.push(generated);
      slots = [generated];
    }

    if (typeFilter) {
      slots = slots.filter((s) => s.type === 'both' || s.type === typeFilter);
    }

    return slots;
  },

  async getAllSlots(mentorId?: string): Promise<TutorSlot[]> {
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
      return inMemorySlots.filter((s) => {
        // ALWAYS include slots that have bookings so tutor dashboard displays all student bookings!
        if (s.registeredAttendees && s.registeredAttendees.length > 0) return true;
        if (s.bookedCount && s.bookedCount > 0) return true;
        return (
          s.mentorId === mentorId ||
          s.mentorId === 'demo-tutor-1' ||
          s.mentorId === 'mentor-alex' ||
          !mentorId
        );
      });
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

    return newSlot;
  },

  async updateSlot(slotId: string, updates: Partial<TutorSlot>): Promise<TutorSlot | null> {
    inMemorySlots = inMemorySlots.map((s) => (s.id === slotId ? { ...s, ...updates } : s));
    try {
      await apiClient.put(`/slots/${slotId}`, updates);
    } catch {}
    return inMemorySlots.find((s) => s.id === slotId) || null;
  },

  async deleteSlot(slotId: string): Promise<void> {
    inMemorySlots = inMemorySlots.filter((s) => s.id !== slotId);
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
        date: studentDetails?.slotDate || 'Friday, 19 Sep 2025',
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

  async cancelRegistration(slotId: string, attendeeId: string): Promise<void> {
    const slot = inMemorySlots.find((s) => s.id === slotId);
    if (!slot) return;

    const att = (slot.registeredAttendees || []).find((a) => a.id === attendeeId);
    const countToRemove = att?.bookingType === 'group' ? (att.groupSize || 1) : 1;

    slot.registeredAttendees = (slot.registeredAttendees || []).filter((a) => a.id !== attendeeId);
    slot.bookedCount = Math.max(0, (slot.bookedCount || 0) - countToRemove);
    slot.isAvailable = slot.bookedCount < slot.maxCapacity;

    try {
      await apiClient.post(`/slots/${slotId}/cancel-registration`, { attendeeId });
    } catch {}
  },
};
