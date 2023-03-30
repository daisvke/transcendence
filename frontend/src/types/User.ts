export type User = {
  avatar: string | undefined;
  id: number;
  nickname: string;
  profileId: string;
  provider: string;
  role: string;
  blockedUsers: number[];
  joinedChatRoom: string;
  totpSecret: null | {
    verified: boolean;
  };
  username: string;
};
