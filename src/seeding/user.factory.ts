import { en, Faker } from '@faker-js/faker';
import { User } from '../modules/users/entities/users.entity';
import { setSeederFactory } from 'typeorm-extension';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../shared/enums/user-roles.enum';

export const UserFactory = setSeederFactory(User, async () => {
    const faker = new Faker({ locale: en });
    const user = new User();

    user.firstName = 'Muahmmad';
    user.lastName = 'Ghunaim';
    user.email = 'admin@admin.com';
    user.password = await bcrypt.hash('123456789', 10);
    user.emailVerifiedAt = new Date();
    user.verifiedAt = new Date(Date.now() + 30 * 60 * 1000);
    user.confirmedAt = new Date();

    user.latitude = 33.4885933;
    user.longitude = 36.2825397;
    user.role = UserRole.ADMIN;
    user.location = 'nahr3esha';

    return user;
});
