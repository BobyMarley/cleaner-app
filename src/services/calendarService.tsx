import { getFirestore, collection, getDocs, addDoc, query, where, Timestamp, deleteDoc, doc } from 'firebase/firestore';

const db = getFirestore();

// Helper function to properly adjust dates for timezone
const adjustDateForTimezone = (date: Date, operation: 'add' | 'subtract'): Date => {
  const newDate = new Date(date);
  const timezoneOffset = 2; // UTC+2 (Warsaw timezone)
  
  if (operation === 'add') {
    newDate.setHours(newDate.getHours() + timezoneOffset);
  } else {
    newDate.setHours(newDate.getHours() - timezoneOffset);
  }
  
  return newDate;
};

// Get available dates marked by the administrator
export const getAvailableDates = async (): Promise<string[]> => {
  try {
    const datesQuery = query(collection(db, 'availableDates'));
    const snapshot = await getDocs(datesQuery);
    
    const dates: string[] = [];
    snapshot.docs.forEach(doc => {
      const dateField = doc.data().date;
      if (dateField && typeof dateField.toDate === 'function') {
        // Get the Firestore timestamp as a Date object
        const dateObj = dateField.toDate();
        
        // Adjust for UTC+2 timezone
        const adjustedDate = adjustDateForTimezone(dateObj, 'add');
        const isoDate = adjustedDate.toISOString();
        
        console.log(`Date from Firestore: ${dateField}, converted to local ISO: ${isoDate}`);
        
        // Only include future dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateToCompare = new Date(isoDate);
        dateToCompare.setHours(0, 0, 0, 0);
        
        if (dateToCompare >= today) {
          dates.push(isoDate);
        } else {
          console.log(`Date ${isoDate} is in the past, skipped`);
        }
      } else {
        console.warn(`Invalid date format in document ${doc.id}:`, dateField);
      }
    });
    
    // Sort dates chronologically
    dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    console.log('Final available dates:', dates);
    return dates;
  } catch (error) {
    console.error('Error fetching available dates:', error);
    throw error;
  }
};

// Add a new available date (for administrators)
export const addAvailableDate = async (date: string): Promise<string> => {
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date format for adding');
    }
    
    // Adjust for UTC+2 when storing
    const adjustedDate = adjustDateForTimezone(parsedDate, 'subtract');
    
    const docRef = await addDoc(collection(db, 'availableDates'), {
      date: Timestamp.fromDate(adjustedDate),
    });
    
    console.log(`Date ${date} successfully added with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error adding date:', error);
    throw error;
  }
};

// Delete an available date (for administrators)
export const deleteAvailableDate = async (docId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'availableDates', docId));
    console.log(`Date with ID ${docId} successfully deleted`);
  } catch (error) {
    console.error('Error deleting date:', error);
    throw error;
  }
};

// Check if a date is available
export const isDateAvailable = async (date: string): Promise<boolean> => {
  try {
    const availableDates = await getAvailableDates();
    const parsedDate = new Date(date);
    
    return availableDates.some(availableDate => {
      const availableDateObj = new Date(availableDate);
      
      return (
        availableDateObj.getFullYear() === parsedDate.getFullYear() &&
        availableDateObj.getMonth() === parsedDate.getMonth() &&
        availableDateObj.getDate() === parsedDate.getDate() &&
        availableDateObj.getHours() === parsedDate.getHours() &&
        availableDateObj.getMinutes() === parsedDate.getMinutes()
      );
    });
  } catch (error) {
    console.error('Error checking date availability:', error);
    throw error;
  }
};

// Reserve a date (remove from available after booking)
export const reserveDate = async (date: string): Promise<void> => {
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date format for reservation');
    }
    
    // Find all documents with the exact date and time to handle potential duplicates
    const availableDates = await getAvailableDates();
    const matchingDates = availableDates.filter(availableDate => {
      const availableDateObj = new Date(availableDate);
      const parsedDateObj = new Date(date);
      
      return (
        availableDateObj.getFullYear() === parsedDateObj.getFullYear() &&
        availableDateObj.getMonth() === parsedDateObj.getMonth() &&
        availableDateObj.getDate() === parsedDateObj.getDate() &&
        availableDateObj.getHours() === parsedDateObj.getHours() &&
        availableDateObj.getMinutes() === parsedDateObj.getMinutes()
      );
    });
    
    if (matchingDates.length === 0) {
      console.warn(`No matching date found for reservation: ${date}`);
      return;
    }
    
    // Adjust for UTC+2 when querying Firestore
    const adjustedDate = adjustDateForTimezone(parsedDate, 'subtract');
    
    // Find the document in Firestore with this date
    const datesQuery = query(
      collection(db, 'availableDates'), 
      where('date', '==', Timestamp.fromDate(adjustedDate))
    );
    
    const snapshot = await getDocs(datesQuery);
    
    if (snapshot.empty) {
      console.warn(`No matching document found in Firestore for date: ${date}`);
      return;
    }
    
    // Delete all matching documents
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`Date ${date} successfully reserved and removed from available dates`);
  } catch (error) {
    console.error('Error reserving date:', error);
    throw error;
  }
};

// Get dates with document IDs (for admin panel)
export const getAvailableDatesWithIds = async (): Promise<Array<{id: string, date: string}>> => {
  try {
    const datesQuery = query(collection(db, 'availableDates'));
    const snapshot = await getDocs(datesQuery);
    
    const dates: Array<{id: string, date: string}> = [];
    
    snapshot.docs.forEach(doc => {
      const dateField = doc.data().date;
      if (dateField && typeof dateField.toDate === 'function') {
        const dateObj = dateField.toDate();
        
        // Adjust for UTC+2 timezone
        const adjustedDate = adjustDateForTimezone(dateObj, 'add');
        const isoDate = adjustedDate.toISOString();
        
        // Only include future dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateToCompare = new Date(isoDate);
        dateToCompare.setHours(0, 0, 0, 0);
        
        if (dateToCompare >= today) {
          dates.push({
            id: doc.id,
            date: isoDate
          });
        }
      }
    });
    
    // Sort dates chronologically
    dates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return dates;
  } catch (error) {
    console.error('Error fetching available dates with IDs:', error);
    throw error;
  }
};