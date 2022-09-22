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
