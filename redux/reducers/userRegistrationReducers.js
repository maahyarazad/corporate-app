export const initialRegistrationState = {
  username: "",
  password: "",
  cpassword: "",
  email: "",
  mobile: "",
  mobileCode: "971",
  mobileCountry: "AE",
  partner_id: null,
  app_id: config.APP_ID,
  card_valid_date: "",
  miscellaneous: undefined,
  honorifics: "",
  firstname: "",
  middlename: "",
  lastname: "",
  nationality: "United Arab Emirates",
  birthdate: null,
  gender: "",
};

export const registrationReducer = (state, action) => {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };

    case "SET_FIELDS":
      return {
        ...state,
        ...action.payload,
      };

    case "RESET":
      return initialRegistrationState;

    default:
      return state;
  }
};