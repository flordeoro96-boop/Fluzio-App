
import { CalendarEvent } from '../types';
import { format, addHours } from 'date-fns';

export const downloadIcsFile = (event: CalendarEvent) => {
  const startDate = new Date(event.date);
  const endDate = addHours(startDate, 2); // Default 2 hour duration

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fluzio//Squad Events//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@fluzio.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || 'Fluzio Squad Meetup'}`,
    `LOCATION:${event.location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getGoogleCalendarUrl = (event: CalendarEvent): string => {
  const startDate = new Date(event.date);
  const endDate = addHours(startDate, 2);

  const formatDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: event.description || 'Fluzio Squad Meetup',
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
