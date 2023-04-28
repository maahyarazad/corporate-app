export function findCharRight(targetString, char) {
  for (let i = targetString.length - 1; i >= 0; i--) {
    if (targetString[i] === char) return i;
  }
  return null;
}
