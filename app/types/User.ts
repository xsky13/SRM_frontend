export type User = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  telefono: string;
  pwdHash: string | null;
  usertype: UserType;
};

export enum UserType {
  Admin = 1,
  User = 2,
  Guest = 3
};
