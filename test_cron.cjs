const cp = require('cron-parser');
console.log('cp.CronExpressionParser.parse:', cp.CronExpressionParser.parse);
try {
  const result = cp.CronExpressionParser.parse('0 9 * * 1-5');
  console.log('Result type:', typeof result);
  console.log('Result properties:', Object.getOwnPropertyNames(Object.getPrototypeOf(result)));
  console.log('Next execution date:', result.next().toDate());
} catch (e) {
  console.log('Error:', e.message);
}
