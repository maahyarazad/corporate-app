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
  if (!expiry || expiry.length < 4) return false;

  // Remove slash if exists (e.g. "02/26" → "0226")
  

  const month = parseInt(expiry.slice(0, 2), 10);
  const year = parseInt("20" + expiry.slice(2, 4), 10); // YY → YYYY

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year > currentYear) return true;
  if (year === currentYear && month >= currentMonth) return true;

  return false;
};