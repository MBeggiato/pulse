// Status-Speicherung für Container
// Key: containerName, Value: letzter bekannter Status (true = running, false = stopped)
const containerStates = new Map<string, boolean>();

export function getLastStatus(containerName: string): boolean | undefined {
  return containerStates.get(containerName);
}

export function updateStatus(containerName: string, isRunning: boolean): void {
  containerStates.set(containerName, isRunning);
}

export function hasStatusChanged(
  containerName: string,
  currentStatus: boolean
): boolean {
  const lastStatus = getLastStatus(containerName);
  // Beim ersten Check ist es keine Änderung
  if (lastStatus === undefined) {
    return false;
  }
  return lastStatus !== currentStatus;
}
