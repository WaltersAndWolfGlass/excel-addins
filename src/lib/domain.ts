export function TryGetVistaJobNumber(jobNumber: string): [boolean, string] {
  if (jobNumber.match(/^[179]0-\d{3,}$/)) {
    return [true, `25${jobNumber.substring(0, 1)}${jobNumber.substring(3)}`];
  } else if (jobNumber.match(/^18-\d{3,}$/)) {
    return [true, `258${jobNumber.substring(3)}`];
  }
  return [false, jobNumber];
}
