export const expiryToDate = (expiry) => {
  const _expiry = expiry.split("/");
  const _date = new Date();
  _date.setFullYear(`20${_expiry[1]}`, _expiry[0] - 1);
  _date.setHours(0, 0, 0);
  return _date;
};
