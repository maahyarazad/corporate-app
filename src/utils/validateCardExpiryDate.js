export const validateCardExpiryDate = (state, prev) => {
  if (state.length < prev.length && prev.length == 3) {
    //   console.log("in");
    let firstHalf = prev.slice(0, 2);
    let secondHalf = prev.slice(2);
    if (parseInt(firstHalf) > 12) {
      firstHalf = 12;
    } else if (parseInt(firstHalf) === 0) {
      firstHalf = 1;
    }

    const modifyPrev = `${firstHalf.toString().padStart(2, "0")}/${secondHalf}`;
    return modifyPrev;
  }
  if (prev.length === 5) {
    const currentYear = new Date().getFullYear().toString().slice(2);
    const currentMonth = new Date().getMonth().toString().padStart(2, "0");
    const value = prev.split("/");
    console.log(currentMonth, currentYear);
    if (
      parseInt(value[0]) < parseInt(currentMonth) &&
      parseInt(value[1]) <= parseInt(currentYear)
    ) {
      return `${currentMonth}/${currentYear}`;
    }
    if (parseInt(value[1]) < parseInt(currentYear)) {
      return `${value[0]}/${currentYear}`;
    }
  }
  return prev;
};


export const isFutureExpiry = (expiry) => {
  if (!expiry || expiry.length < 5) return false;

  const month = parseInt(expiry.slice(0, 2), 10);
  const year2Digits = parseInt(expiry.slice(3, 5), 10);

  if (isNaN(month) || isNaN(year2Digits)) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Convert 2-digit year to correct century
  const century = Math.floor(currentYear / 100) * 100;
  let fullYear = century + year2Digits;

  // Handle rollover (e.g. 99 -> 2099 when current year is 2101)
  if (fullYear < currentYear - 50) {
    fullYear += 100;
  }

  if (fullYear > currentYear) return true;
  if (fullYear === currentYear && month >= currentMonth) return true;

  return false;
};