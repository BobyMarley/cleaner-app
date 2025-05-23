import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  Timestamp, 
  deleteDoc, 
  doc, 
  orderBy,
  writeBatch,
  getDoc,
  updateDoc,
  runTransaction // Добавлен импорт для транзакций
} from 'firebase/firestore';

const db = getFirestore();

// Типы для календарной системы
export interface AvailableDate {
  id?: string;
  date: Date;
  timeSlots: string[];
  isReserved: boolean;
  reservedBy?: string;
  createdAt: Date;
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  reservedBy?: string;
}

export interface CalendarDay {
  date: string;
  displayDate: number;
  displayDay: string;
  displayMonth: string;
  isToday: boolean;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

// Утилиты для работы с датами
const getWarsawTime = (date: Date = new Date()): Date => {
  const warsawOffset = 2; // UTC+2 (летнее время)
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (warsawOffset * 3600000));
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const isToday = (date: Date): boolean => {
  const today = getWarsawTime();
  return formatDate(date) === formatDate(today);
};

const isFutureDate = (date: Date): boolean => {
  const today = getWarsawTime();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate >= today;
};

// Предустановленные временные слоты
export const DEFAULT_TIME_SLOTS = {
  morning: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
  afternoon: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
  evening: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
};

export const getAllTimeSlots = (): string[] => {
  return [
    ...DEFAULT_TIME_SLOTS.morning,
    ...DEFAULT_TIME_SLOTS.afternoon,
    ...DEFAULT_TIME_SLOTS.evening
  ];
};

// Получить все доступные даты (БЕЗ fallback)
export const getAvailableDates = async (): Promise<string[]> => {
  try {
    console.log('Fetching available dates from Firestore...');
    
    const datesQuery = query(
      collection(db, 'availableDates'),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(datesQuery);
    const dates: string[] = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.date && typeof data.date.toDate === 'function') {
        const dateObj = data.date.toDate();
        
        // Проверяем что дата в будущем и не зарезервирована
        if (isFutureDate(dateObj) && !data.isReserved) {
          dates.push(dateObj.toISOString());
        }
      }
    });
    
    console.log(`Found ${dates.length} available dates`);
    return dates;
    
  } catch (error) {
    console.error('Error fetching available dates:', error);
    throw new Error('Не удалось загрузить доступные даты. Попробуйте позже.');
  }
};

// Получить доступные даты с ID (для админки)
export const getAvailableDatesWithIds = async (): Promise<Array<{id: string, date: string, isReserved: boolean}>> => {
  try {
    const datesQuery = query(
      collection(db, 'availableDates'),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(datesQuery);
    const dates: Array<{id: string, date: string, isReserved: boolean}> = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.date && typeof data.date.toDate === 'function') {
        const dateObj = data.date.toDate();
        
        dates.push({
          id: doc.id,
          date: dateObj.toISOString(),
          isReserved: data.isReserved || false
        });
      }
    });
    
    return dates;
    
  } catch (error) {
    console.error('Error fetching dates with IDs:', error);
    throw new Error('Не удалось загрузить календарь администратора.');
  }
};

// Добавить одну дату
export const addAvailableDate = async (dateTimeString: string): Promise<string> => {
  try {
    const dateTime = new Date(dateTimeString);
    
    if (isNaN(dateTime.getTime())) {
      throw new Error('Неверный формат даты');
    }
    
    if (!isFutureDate(dateTime)) {
      throw new Error('Нельзя добавить дату в прошлом');
    }
    
    // Проверяем дубликаты
    const existingQuery = query(
      collection(db, 'availableDates'),
      where('date', '==', Timestamp.fromDate(dateTime))
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    if (!existingSnapshot.empty) {
      throw new Error('Эта дата уже добавлена');
    }
    
    const docRef = await addDoc(collection(db, 'availableDates'), {
      date: Timestamp.fromDate(dateTime),
      isReserved: false,
      createdAt: Timestamp.fromDate(getWarsawTime()),
      timeSlot: dateTime.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    });
    
    console.log(`Date ${dateTimeString} added with ID: ${docRef.id}`);
    return docRef.id;
    
  } catch (error) {
    console.error('Error adding date:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Ошибка при добавлении даты');
  }
};

// Массовое добавление дат (для админки)
export const addMultipleDates = async (
  startDate: string, 
  endDate: string, 
  timeSlots: string[],
  excludeWeekends = true
): Promise<number> => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      throw new Error('Дата начала должна быть раньше даты окончания');
    }
    
    const batch = writeBatch(db);
    const datesCollection = collection(db, 'availableDates');
    let addedCount = 0;
    
    // Получаем существующие даты для проверки дубликатов
    const existingQuery = query(
      datesCollection,
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end))
    );
    const existingSnapshot = await getDocs(existingQuery);
    const existingDates = new Set(
      existingSnapshot.docs.map(doc => 
        doc.data().date.toDate().toISOString()
      )
    );
    
    // Генерируем даты
    const currentDate = new Date(start);
    while (currentDate <= end) {
      // Пропускаем выходные если нужно
      if (excludeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      // Пропускаем даты в прошлом
      if (!isFutureDate(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      // Добавляем временные слоты
      for (const timeSlot of timeSlots) {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const dateTime = new Date(currentDate);
        dateTime.setHours(hours, minutes, 0, 0);
        
        // Проверяем дубликаты
        if (!existingDates.has(dateTime.toISOString())) {
          const docRef = doc(datesCollection);
          batch.set(docRef, {
            date: Timestamp.fromDate(dateTime),
            isReserved: false,
            createdAt: Timestamp.fromDate(getWarsawTime()),
            timeSlot: timeSlot
          });
          addedCount++;
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (addedCount > 0) {
      await batch.commit();
    }
    
    console.log(`Added ${addedCount} dates`);
    return addedCount;
    
  } catch (error) {
    console.error('Error adding multiple dates:', error);
    throw new Error('Ошибка при массовом добавлении дат');
  }
};

// Удалить дату
export const deleteAvailableDate = async (docId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'availableDates', docId));
    console.log(`Date with ID ${docId} deleted`);
  } catch (error) {
    console.error('Error deleting date:', error);
    throw new Error('Ошибка при удалении даты');
  }
};

// Проверить доступность даты
export const isDateAvailable = async (dateTimeString: string): Promise<boolean> => {
  try {
    const dateTime = new Date(dateTimeString);
    
    if (!isFutureDate(dateTime)) {
      return false;
    }
    
    const availableQuery = query(
      collection(db, 'availableDates'),
      where('date', '==', Timestamp.fromDate(dateTime)),
      where('isReserved', '==', false)
    );
    
    const snapshot = await getDocs(availableQuery);
    return !snapshot.empty;
    
  } catch (error) {
    console.error('Error checking date availability:', error);
    return false;
  }
};

// Зарезервировать дату (атомарная операция)
export const reserveDate = async (dateTimeString: string, userId?: string): Promise<void> => {
  try {
    const dateTime = new Date(dateTimeString);
    const dateRef = collection(db, 'availableDates');

    await runTransaction(db, async (transaction) => {
      const availableQuery = query(
        dateRef,
        where('date', '==', Timestamp.fromDate(dateTime)),
        where('isReserved', '==', false)
      );
      const snapshot = await getDocs(availableQuery);

      if (snapshot.empty) {
        throw new Error('Дата больше недоступна для бронирования');
      }

      const dateDoc = snapshot.docs[0];
      transaction.update(dateDoc.ref, {
        isReserved: true,
        reservedAt: Timestamp.fromDate(getWarsawTime()),
        reservedBy: userId || 'anonymous'
      });
    });

    console.log(`Дата ${dateTimeString} успешно зарезервирована`);
  } catch (error) {
    console.error('Ошибка при резервировании даты:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Ошибка при резервировании даты');
  }
};

// Освободить дату (для отмены заказов)
export const unreserveDate = async (dateTimeString: string): Promise<void> => {
  try {
    const dateTime = new Date(dateTimeString);
    
    const reservedQuery = query(
      collection(db, 'availableDates'),
      where('date', '==', Timestamp.fromDate(dateTime)),
      where('isReserved', '==', true)
    );
    
    const snapshot = await getDocs(reservedQuery);
    
    if (!snapshot.empty) {
      const dateDoc = snapshot.docs[0];
      await updateDoc(dateDoc.ref, {
        isReserved: false,
        reservedAt: null,
        reservedBy: null
      });
      
      console.log(`Date ${dateTimeString} unreserved successfully`);
    }
    
  } catch (error) {
    console.error('Error unreserving date:', error);
    throw new Error('Ошибка при освобождении даты');
  }
};

// Очистка просроченных дат (для cron job)
export const cleanupExpiredDates = async (): Promise<number> => {
  try {
    const yesterday = new Date(getWarsawTime());
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    
    const expiredQuery = query(
      collection(db, 'availableDates'),
      where('date', '<', Timestamp.fromDate(yesterday))
    );
    
    const snapshot = await getDocs(expiredQuery);
    
    if (snapshot.empty) {
      return 0;
    }
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    console.log(`Cleaned up ${snapshot.docs.length} expired dates`);
    return snapshot.docs.length;
    
  } catch (error) {
    console.error('Error cleaning up expired dates:', error);
    return 0;
  }
};

// Получить статистику календаря (для админки)
export const getCalendarStats = async (): Promise<{
  totalDates: number;
  availableDates: number;
  reservedDates: number;
  expiredDates: number;
}> => {
  try {
    const allDatesSnapshot = await getDocs(collection(db, 'availableDates'));
    const today = getWarsawTime();
    today.setHours(0, 0, 0, 0);
    
    let totalDates = 0;
    let availableDates = 0;
    let reservedDates = 0;
    let expiredDates = 0;
    
    allDatesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const dateObj = data.date.toDate();
      
      totalDates++;
      
      if (!isFutureDate(dateObj)) {
        expiredDates++;
      } else if (data.isReserved) {
        reservedDates++;
      } else {
        availableDates++;
      }
    });
    
    return {
      totalDates,
      availableDates,
      reservedDates,
      expiredDates
    };
    
  } catch (error) {
    console.error('Error getting calendar stats:', error);
    return {
      totalDates: 0,
      availableDates: 0,
      reservedDates: 0,
      expiredDates: 0
    };
  }
};