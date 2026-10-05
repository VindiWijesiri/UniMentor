import { TutorSlot } from '../../domain/entities/TutorSlot';

const INITIAL_SLOTS: TutorSlot[] = [
  {
    id: 'slot-1',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    date: 'Friday, 19 Sep 2025',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    timeRange: '09:00 AM - 10:00 AM',
    type: 'both',
    maxCapacity: 5,
    bookedCount: 0,
    module: 'Database Systems',
    isAvailable: true,
  },
  {
    id: 'slot-2',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    date: 'Friday, 19 Sep 2025',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    timeRange: '10:00 AM - 11:00 AM',
    type: 'both',
    maxCapacity: 5,
    bookedCount: 0,
    module: 'Database Systems',
    isAvailable: true,
  },
  {
    id: 'slot-3',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    date: 'Friday, 19 Sep 2025',
    startTime: '10:30 AM',
    endTime: '11:30 AM',
    timeRange: '10:30 AM - 11:30 AM',
    type: 'both',
    maxCapacity: 6,
    bookedCount: 0,
    module: 'Database Systems',
    isAvailable: true,
  },
  {
    id: 'slot-4',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    date: 'Friday, 19 Sep 2025',
    startTime: '11:30 AM',
    endTime: '12:30 PM',
    timeRange: '11:30 AM - 12:30 PM',
    type: 'both',
    maxCapacity: 6,
    bookedCount: 0,
    module: 'Database Systems',
    isAvailable: true,
  },
  {
    id: 'slot-5',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    date: 'Friday, 19 Sep 2025',
    startTime: '12:00 PM',
    endTime: '01:00 PM',
    timeRange: '12:00 PM - 01:00 PM',
    type: 'both',
    maxCapacity: 4,
    bookedCount: 0,
    module: 'Database Systems',
    isAvailable: true,
  },
  {
    id: 'slot-6',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    date: 'Friday, 19 Sep 2025',
    startTime: '02:00 PM',
    endTime: '03:00 PM',
    timeRange: '02:00 PM - 03:00 PM',
    type: 'both',
    maxCapacity: 5,
    bookedCount: 0,
    module: 'Database Systems',
    hasConflict: true,
    conflictDetails: {
      existingSessionTitle: 'Data Structures',
      existingWith: 'with Prof. Kumar',
      time: '19 Sep 2025, 2:00 PM – 3:00 PM',
    },
    isAvailable: true,
  },
  {
    id: 'slot-7',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    date: 'Friday, 19 Sep 2025',
    startTime: '03:30 PM',
    endTime: '04:30 PM',
    timeRange: '03:30 PM - 04:30 PM',
    type: 'both',
    maxCapacity: 5,
    bookedCount: 0,
    module: 'Database Systems',
    isAvailable: true,
  },
  {
    id: 'slot-8',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    date: 'Friday, 19 Sep 2025',
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    timeRange: '04:00 PM - 05:00 PM',
    type: 'both',
    maxCapacity: 5,
    bookedCount: 0,
    module: 'Database Systems',
    isAvailable: true,
  },
  {
    id: 'slot-9',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    date: 'Friday, 19 Sep 2025',
    startTime: '05:00 PM',
    endTime: '06:00 PM',
    timeRange: '05:00 PM - 06:00 PM',
    type: 'both',
    maxCapacity: 5,
    bookedCount: 0,
    module: 'Database Systems',
    isAvailable: true,
  },
  {
    id: 'slot-10',
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    date: 'Friday, 19 Sep 2025',
    startTime: '05:30 PM',
    endTime: '06:30 PM',
    timeRange: '05:30 PM - 06:30 PM',
    type: 'both',
    maxCapacity: 5,
    bookedCount: 0,
    module: 'Database Systems',
    isAvailable: true,
  },
];

let inMemorySlots: TutorSlot[] = [...INITIAL_SLOTS];

export const tutorSlotRepository = {
  async getSlotsByMentorAndDate(
    mentorId: string,
    mentorName: string,
    date: string,
    typeFilter?: '1-on-1' | 'group'
  ): Promise<TutorSlot[]> {
    // Check if slots exist for this mentor and date
    let slots = inMemorySlots.filter((s) => {
      const matchMentor =
        s.mentorId === mentorId ||
        s.mentorName.toLowerCase().includes(mentorName.toLowerCase()) ||
        mentorName.toLowerCase().includes(s.mentorName.toLowerCase());
      const matchDate = !date || !s.date || s.date === date || s.date.includes(date) || date.includes(s.date);
      return matchMentor && matchDate;
    });

    // If no slots exist yet for this specific date, generate slots for this date based on tutor availability
    if (slots.length === 0) {
      const baseTimes = [
        { start: '09:00 AM', end: '10:00 AM', conflict: false },
        { start: '10:30 AM', end: '11:30 AM', conflict: false },
        { start: '12:00 PM', end: '01:00 PM', conflict: false },
        { start: '02:00 PM', end: '03:00 PM', conflict: true },
        { start: '03:30 PM', end: '04:30 PM', conflict: false },
        { start: '05:00 PM', end: '06:00 PM', conflict: false },
      ];
      const generated: TutorSlot[] = baseTimes.map((bt, i) => ({
        id: `slot-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
        mentorId,
        mentorName,
        date,
        startTime: bt.start,
        endTime: bt.end,
        timeRange: `${bt.start} - ${bt.end}`,
        type: 'both',
        maxCapacity: 5,
        bookedCount: 0,
        module: 'Database Systems',
        hasConflict: bt.conflict,
        conflictDetails: bt.conflict
          ? {
              existingSessionTitle: 'Data Structures',
              existingWith: 'with Prof. Kumar',
              time: `${date}, 2:00 PM – 3:00 PM`,
            }
          : undefined,
        isAvailable: true,
      }));
      inMemorySlots.push(...generated);
      slots = generated;
    }

    if (typeFilter) {
      slots = slots.filter((s) => s.type === 'both' || s.type === typeFilter);
    }

    return slots;
  },

  async getAllSlots(): Promise<TutorSlot[]> {
    return [...inMemorySlots];
  },

  async addSlot(
    slot: Omit<TutorSlot, 'id' | 'bookedCount' | 'isAvailable'>
  ): Promise<TutorSlot> {
    const newSlot: TutorSlot = {
      ...slot,
      id: `slot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookedCount: 0,
      isAvailable: true,
    };
    inMemorySlots.unshift(newSlot);
    return newSlot;
  },

  async deleteSlot(slotId: string): Promise<void> {
    inMemorySlots = inMemorySlots.filter((s) => s.id !== slotId);
  },

  async markSlotBooked(slotId: string, isGroup: boolean): Promise<void> {
    inMemorySlots = inMemorySlots.map((s) => {
      if (s.id === slotId) {
        const newCount = (s.bookedCount || 0) + 1;
        const full = isGroup ? newCount >= s.maxCapacity : true;
        return {
          ...s,
          bookedCount: newCount,
          isAvailable: !full,
        };
      }
      return s;
    });
  },
};
