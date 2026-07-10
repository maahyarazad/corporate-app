import { TranslationLanguageCodeMap } from "react-native-country-picker-modal";

export interface IUser{
    app_id?: number;
    user_id?: number;
    username: string;
    password: string;
    honorifics: string;
    firstname: string;
    middlename: string;
    lastname: string;
    birthdate: Date | null;
    gender: string;
    email: string;
    mobile?: string;
    mobileCode?: string;
    nationality: string | TranslationLanguageCodeMap;
    partner_id: number;
    token: string;
}

export interface IUserDetails {
    app_id: number;
    username: string,
    password: string,
    cpassword: string,
    mobile: string,
    mobileCode: string,
    email: string
}

export interface IUserChangePass {
    login: string,
    mobileCode: string,
    mobile: string
}

export interface IMemberInfo {
    firstname: string,
    middlename?: string,
    lastname: string,
    email: string,
    mobileCode: string,
    mobileNubmer: string
}

export type UserServiceType = {
    createUser: (user: IUser) => Promise<any>;
    updateUser: (user: IUser) => Promise<boolean>;
    getUserInfo: (userId: number) => Promise<IUser>;
    validateDetails: (data: IUserDetails) => Promise<boolean>;
    getRedemptionHistory: (userId: number) => Promise<any>;
    requestForgetPass: (data: IUserChangePass) => Promise<any>
    verifyForgetPass: (data: any) => Promise<any>
    changePassword: (data: any) => Promise<any>
    resendEmailVerification: (userId: number) => Promise<boolean>;
    removeUser: (userId: number) => Promise<boolean>;
    getMemberInfo: (user_id: number, signal?: AbortSignal) => Promise<any>;
    addMember: (data: IMemberInfo) => Promise<boolean>;
}