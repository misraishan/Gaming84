import { duration } from "moment";

export function convertToReadableTime(time: number) {
  if (time === 0) return "0s";
  const dur = duration(time, "seconds");
  let timeString = "";
  if (dur.days() !== 0) timeString += dur.days() + "d ";
  if (timeString.includes("d") || dur.hours() !== 0) timeString += dur.hours() + "h ";
  if (timeString.includes("h") || dur.minutes() !== 0) timeString += dur.minutes() + "m ";
  if (timeString.includes("m") || dur.seconds() !== 0) timeString += dur.seconds() + "s ";
  return timeString;
}
