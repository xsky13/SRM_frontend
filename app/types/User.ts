export type User = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  telefono: string;
  pwdHash: string | null;
  usertype: UserType;
};

export type UserType = {
  admin: 1;
  user: 2;
  guest: 3;
};
