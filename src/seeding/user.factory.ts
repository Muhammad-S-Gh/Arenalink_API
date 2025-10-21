import { en, Faker } from '@faker-js/faker';
import { User } from '../modules/users/entities/users.entity';
import { setSeederFactory } from 'typeorm-extension';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../shared/enums/user-roles.enum';

export const UserFactory = setSeederFactory(User, async () => {
    const faker = new Faker({ locale: en });
    const user = new User();

    user.firstName = 'Muahmmad'; //faker.person.firstName();
    user.lastName = 'Ghunaim'; //faker.person.lastName();
    user.email = 'admin@admin.com'; // user.email = faker.internet.email();
    user.password = await bcrypt.hash('123456789', 10);
    user.emailVerifiedAt = new Date();
    user.verifiedAt = new Date(Date.now() + 30 * 60 * 1000);
    user.confirmedAt = new Date();
    // user.profilePicture = faker.image.avatar();
    user.latitude = 55.555; //faker.location.latitude();
    user.longitude = 120.101; //faker.location.longitude();
    user.role = UserRole.ADMIN; // user.role = faker.helpers.arrayElement([UserRole.USER, UserRole.OWNER, UserRole.ADMIN]);
    user.location = 'nahr3esha'; //faker.location.city();

    return user;
});
