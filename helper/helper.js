import { typeEnum } from "../src/utils/constants";

export const getEnumKey = (value) => {
  return Object.keys(typeEnum).find((key) => typeEnum[key] === value);
};
