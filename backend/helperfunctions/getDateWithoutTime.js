export default function getDateInSingapore(date) {
  // Adjusts the date to the Singapore timezone and returns it in 'YYYY-MM-DD' format
  return new Date(date).toLocaleDateString("en-CA", {
    timeZone: "Asia/Singapore",
  });
}
