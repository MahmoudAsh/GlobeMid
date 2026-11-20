/** URL-safe id from an employee name ("Dr. Mona Abdelrahman" → "dr-mona-abdelrahman"). */
export function employeeId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/^-|-$/g, '')
}
