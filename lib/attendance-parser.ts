// Types for attendance records
export interface AttendanceRecord {
  id: string;
  name: string;
  date: string | null;
  inTime: string;
  outTime: string;
}

export interface ParsedAttendanceData {
  records: AttendanceRecord[];
  confidence: number;
  warnings: string[];
}

/**
 * Parse OCR text into structured attendance data using regex patterns
 */
export async function parseAttendanceData(ocrText: string): Promise<AttendanceRecord[]> {
  return fallbackParseAttendanceData(ocrText);
}

/**
 * Normalize time format to HH:MM
 */
function normalizeTime(timeStr: string): string {
  if (!timeStr || timeStr === 'null') return '';
  
  // Remove any non-digit/colon characters
  const cleanTime = timeStr.replace(/[^\d:]/g, '');
  
  // If already in HH:MM format, return as is
  if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
    const [hours, minutes] = cleanTime.split(':').map(Number);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // If just hours (e.g., "9" or "18")
  if (/^\d{1,2}$/.test(cleanTime)) {
    const hours = parseInt(cleanTime);
    if (hours <= 12 && timeStr.toLowerCase().includes('pm')) {
      return `${(hours + 12).toString().padStart(2, '0')}:00`;
    }
    return `${hours.toString().padStart(2, '0')}:00`;
  }
  
  // If hours with decimal (e.g., "9.30")
  if (/^\d{1,2}\.\d{2}$/.test(cleanTime)) {
    const [hours, minutes] = cleanTime.split('.');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Fallback: return original string if we can't parse it
  return timeStr;
}

/**
 * Fallback parsing method using regex (when AI is not available)
 */
function fallbackParseAttendanceData(ocrText: string): AttendanceRecord[] {
  const lines = ocrText.split('\n').filter(line => line.trim());
  const records: AttendanceRecord[] = [];
  
  console.log('Debug: Processing lines:', lines);
  
  // Parse line by line and build records
  let currentName = '';
  let currentInTime = '';
  let currentOutTime = '';
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip header lines
    if (trimmedLine.includes('ATTENDANCE REGISTER') || 
        trimmedLine.includes('DATE:') || 
        trimmedLine.includes('IN TIME') || 
        trimmedLine.includes('OUT TIME') || 
        trimmedLine.includes('SIGNATURE') ||
        trimmedLine.includes('TIME') && trimmedLine.includes('SIGNATURE') ||
        trimmedLine === 'NAME') {
      console.log('Skipping header line:', trimmedLine);
      return;
    }
    
    console.log(`Processing line ${index}: "${trimmedLine}"`);
    
    // Check if line contains a name (starts with | and contains letters)
    if (trimmedLine.startsWith('|') && /[A-Za-z]/.test(trimmedLine)) {
      // Save previous record if we have one
      if (currentName && currentInTime && currentOutTime) {
        const record = {
          id: `record-${records.length}-${Date.now()}`,
          name: currentName.replace(/\s+/g, ' ').replace(/\./g, '').trim(),
          date: null,
          inTime: normalizeTime(currentInTime),
          outTime: normalizeTime(currentOutTime)
        };
        
        if (record.name && record.inTime && record.outTime && record.name.length > 1) {
          records.push(record);
          console.log('Added record:', record);
        }
      }
      
      // Start new record with name
      currentName = trimmedLine.replace(/[|]/g, '').trim();
      currentInTime = '';
      currentOutTime = '';
      console.log('Found name:', currentName);
    }
    
    // Check if line contains times (has | and time patterns)
    else if (trimmedLine.includes('|') && /\d{1,2}:\d{2}/.test(trimmedLine)) {
      const times = trimmedLine.match(/\d{1,2}:\d{2}/g);
      if (times && times.length >= 2) {
        currentInTime = times[0];
        currentOutTime = times[1];
        console.log('Found times:', { in: currentInTime, out: currentOutTime });
      }
    }
    
    // Check if line is just times (no name)
    else if (/\d{1,2}:\d{2}/.test(trimmedLine) && !trimmedLine.includes('|')) {
      // This could be a time line for the current record
      const timeMatch = trimmedLine.match(/\d{1,2}:\d{2}/);
      if (timeMatch) {
        if (!currentInTime) {
          currentInTime = timeMatch[0];
          console.log('Set in time:', currentInTime);
        } else if (!currentOutTime) {
          currentOutTime = timeMatch[0];
          console.log('Set out time:', currentOutTime);
        }
      }
    }
    
    // Skip signature lines (short, contain dots)
    else if (trimmedLine.length < 10 && /\./.test(trimmedLine)) {
      console.log('Skipping signature line:', trimmedLine);
    }
    
    // Skip empty or single character lines
    else if (trimmedLine.length <= 2) {
      console.log('Skipping short line:', trimmedLine);
    }
  });
  
  // Add the last record if we have one
  if (currentName && currentInTime && currentOutTime) {
    const record = {
      id: `record-${records.length}-${Date.now()}`,
      name: currentName.replace(/\s+/g, ' ').replace(/\./g, '').trim(),
      date: null,
      inTime: normalizeTime(currentInTime),
      outTime: normalizeTime(currentOutTime)
    };
    
    if (record.name && record.inTime && record.outTime && record.name.length > 1) {
      records.push(record);
      console.log('Added final record:', record);
    }
  }
  
  console.log('Final records:', records);
  return records;
}

/**
 * Calculate total hours from in and out times
 */
export function calculateHours(inTime: string, outTime: string): number {
  if (!inTime || !outTime) return 0;
  
  try {
    const [inHour, inMin] = inTime.split(':').map(Number);
    const [outHour, outMin] = outTime.split(':').map(Number);
    
    const inMinutes = inHour * 60 + (inMin || 0);
    const outMinutes = outHour * 60 + (outMin || 0);
    
    return Math.max(0, (outMinutes - inMinutes) / 60);
  } catch (error) {
    console.error('Error calculating hours:', error);
    return 0;
  }
}

/**
 * Calculate overtime (hours beyond 8 hours)
 */
export function calculateOvertime(inTime: string, outTime: string): number {
  const totalHours = calculateHours(inTime, outTime);
  return Math.max(0, totalHours - 8); // 8 hours is standard work day
}
