import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { ChangePasswordDTO } from './dtos/change-password.dto';
import { compare, hash } from 'bcrypt';
import { UpdateProfileDTO } from './dtos/update-profile.dto';
import { PhonesService } from '../phones/phones.service';
import { EmailConfirmationService } from '../auth/emailConfirmation.service';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { UserProfileDto } from './dtos/profile-response.dto';
import { Owner } from './entities/owners.entity';
import { OwnerStatus } from '../../shared/enums/owner-statuses.enum';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';
import { StripeService } from '../reservations/stripe.service';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { Getfacilities } from '../facilities/services/getfacilities.service';
import { ReservationsService } from '../reservations/reservations.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
    constructor(
        private i18n: YcI18nService,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Owner)
        private ownersRepostory: Repository<Owner>,
        private phonesService: PhonesService,
        @Inject(forwardRef(() => EmailConfirmationService))
        private emailConfirmationService: EmailConfirmationService,
        private stripeService: StripeService,
        private readonly facilityService: Getfacilities,
        private readonly reservationService: ReservationsService,
        private readonly notificationService: NotificationsService,
    ) {}

    // *****************************

    async create(user: Partial<User>): Promise<User> {
        const name = `${user.firstName} ${user.lastName}`;
        if (!user.email) throw new BadRequestException('email was not provided');
        const stripeCustomer = await this.stripeService.createCustomer(name, user.email);
        const newUser = this.usersRepository.create({
            ...user,
            stripeCustomerId: stripeCustomer.id,
        });
        await this.usersRepository.save(newUser);
        return newUser;
    }

    async findAll(): Promise<User[] | null> {
        return this.usersRepository.find({ relations: ['owner'] });
    }

    async findOneById(id: number): Promise<User | null> {
        if (!id) {
            return null;
        }
        return this.usersRepository.findOneBy({ id });
    }

    async findOneByIdWithRelations(id: number): Promise<User | null> {
        if (!id) {
            return null;
        }
        return this.usersRepository.findOne({ where: { id }, relations: ['owner', 'phone', 'fcmToken'] });
    }

    findOneByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOneBy({ email });
    }

    async update(id: number, userInformation: Partial<User>): Promise<User> {
        const user = await this.usersRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException(this.i18n.t('users.errors.user_not_found'));
        }
        Object.assign(user, userInformation);
        return this.usersRepository.save(user);
    }

    async remove(id: number) {
        const user = await this.usersRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException(this.i18n.t('users.errors.user_not_found'));
        }
        return this.usersRepository.remove(user);
    }

    async markEmailAsConfirmed(email: string) {
        return this.usersRepository.update(
            { email },
            {
                emailVerifiedAt: new Date(),
            },
        );
    }

    confirmPassword(email: string) {
        return this.usersRepository.update(
            { email },
            {
                confirmedAt: new Date(),
            },
        );
    }

    async changePassword(user: User, data: ChangePasswordDTO) {
        const isValid = await bcrypt.compare(data.currentPassword, user.password);
        if (!isValid) {
            throw new BadRequestException(this.i18n.t('users.errors.wrong_password'));
        }
        return this.update(user.id, {
            password: await hash(data.newPassword, 10),
        });
    }

    async updateProfile(file: Express.Multer.File, user: User, data: UpdateProfileDTO) {
        const updates: Partial<User> = {
            firstName: data.firstName,
            lastName: data.lastName,
            latitude: data.latitude,
            longitude: data.longitude,
            location: data.location,
        };

        if (file) {
            const old = (await this.findOneById(user.id))?.profilePicture;
            if (old) {
                const fullOldPath = path.join(process.cwd(), old);
                fs.unlink(fullOldPath, (err) => {
                    if (err && err.code !== 'ENOENT') {
                        console.log('Failed to delete old picture', err);
                    }
                });
            }
        }

        const profilePicturePath = file ? `uploads/profile_pictures/${file.filename}` : undefined;
        if (profilePicturePath) updates.profilePicture = profilePicturePath;

        if (data.email) {
            updates.email = data.email;
            updates.emailVerifiedAt = null;
            await this.emailConfirmationService.sendVerificationLink(data.email);
        }

        await this.update(user.id, updates);

        if (data.phoneNumber) {
            await this.phonesService.update(user.id, {
                phoneNumber: data.phoneNumber,
            });
            await this.update(user.id, {
                verifiedAt: null,
            });
        }
        const updatedProfile = await this.findOneById(user.id);
        return { message: 'Profile updated successfully', data: updatedProfile };
    }

    async getProfile(user: User) {
        const userProfile = await this.findOneById(user.id);
        if (!userProfile) {
            throw new NotFoundException(this.i18n.t('users.errors.user_not_found'));
        }
        const phoneNumber = await this.phonesService.findForUser(user.id);
        if (!phoneNumber) {
            throw new NotFoundException(this.i18n.t('errors.NotFound'));
        }
        const { password, verifiedAt, emailVerifiedAt, confirmedAt, stripeCustomerId, ...rest } = userProfile;
        const profile = {
            ...rest,
            phoneNumber: phoneNumber.phoneNumber,
        };

        return profile as UserProfileDto;
    }

    async getPendingOwners() {
        return this.ownersRepostory.find({ where: { status: OwnerStatus.PENDING }, relations: ['user'] });
    }

    async updateOwner(id: number, status: OwnerStatus): Promise<Owner> {
        const owner = await this.ownersRepostory.findOne({ where: { id }, relations: ['user'] });

        if (!owner) throw new NotFoundException(this.i18n.t('users.errors.owner_not_found'));
        if (status === owner.status) throw new BadRequestException(this.i18n.t('users.errors.invalid_status'));

        Object.assign(owner, { status });
        await this.ownersRepostory.save(owner);
        await this.notificationService.notifyOwnerOnStatusApproved(owner.user);
        return this.ownersRepostory.findOneByOrFail({ id });
    }

    async deleteProfile(userId: number, password: string) {
        const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['reservations'] });
        if (!user || user.role === UserRole.ADMIN) {
            throw new NotFoundException('User not found');
        }

        if (user.role === UserRole.USER) {
            const futureCount = await this.reservationService.countFuntureReservations(user.id);
            if (futureCount > 0) {
                throw new BadRequestException(this.i18n.t('users.deleteUser'));
            }
        }

        if (user.role === UserRole.OWNER) {
            const owner = await this.ownersRepostory.findOne({ where: { user: { id: userId } } });
            if (!owner) {
                throw new BadRequestException(this.i18n.t('users.errors.owner_not_found'));
            }

            const facilities = await this.facilityService.getOwnerFacilitiesCount(owner.id);
            if (facilities > 0) {
                throw new BadRequestException(this.i18n.t('users.deleteOwner'));
            }
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new BadRequestException(this.i18n.t('users.errors.wrong_password'));

        const profilePicture = (await this.findOneById(userId))?.profilePicture;
        if (profilePicture) {
            const fullProfilePicturePath = path.join(process.cwd(), profilePicture);
            fs.unlink(fullProfilePicturePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.log('Failed to delete profile picture', err);
                }
            });
        }
        return this.usersRepository.delete(userId);
    }

    // **********************

    async changeUserStatus(id: number) {
        const user = await this.usersRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException(this.i18n.t('users.errors.user_not_found'));
        }
        if (user.role === UserRole.OWNER) {
            throw new NotFoundException('That action cannot be applied on owners');
        }

        if (user.active === false) {
            user.active = true;
            return this.usersRepository.save(user);
        }

        if (user.active === true) {
            user.active = false;
            return this.usersRepository.save(user);
        }
    }

    async adminDelete(id: number) {
        const user = await this.usersRepository.findOne({ where: { id }, relations: ['reservations'] });
        if (!user || user.role === UserRole.ADMIN) {
            throw new NotFoundException('User not found');
        }

        if (user.role === UserRole.USER) {
            // const reservationsCount = Array.isArray(user.reservations) ? user.reservations.length : 0;
            const futureCount = await this.reservationService.countFuntureReservations(user.id);
            if (futureCount > 0) {
                throw new BadRequestException(this.i18n.t('users.deleteUser'));
            }
        }

        if (user.role === UserRole.OWNER) {
            const owner = await this.ownersRepostory.findOne({ where: { user: { id } } });
            if (!owner) {
                throw new BadRequestException(this.i18n.t('users.errors.owner_not_found'));
            }

            const facilities = await this.facilityService.getOwnerFacilitiesCount(owner.id);
            if (facilities > 0) {
                throw new BadRequestException(this.i18n.t('users.deleteOwner'));
            }
        }

        const profilePicture = await user?.profilePicture;
        if (profilePicture) {
            const fullProfilePicturePath = path.join(process.cwd(), profilePicture);
            fs.unlink(fullProfilePicturePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.log('failed to delete profile picture', err);
                }
            });
        }
        return this.usersRepository.delete(id);
    }
}
