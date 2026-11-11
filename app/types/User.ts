export const UserType = {
  Admin: 1,
  User: 2,
  Guest: 3,
} as const;

export type UserType = typeof UserType[keyof typeof UserType];

export type User = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  telefono: string;
  pwdHash: string | null;
  usertype: UserType;
};
