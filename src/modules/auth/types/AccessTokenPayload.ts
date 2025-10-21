import { UserRole } from '../../../shared/enums/user-roles.enum';

export type AccessTokenPayload = {
    userId: number;
    email: string;
    // role: UserRole;
};
