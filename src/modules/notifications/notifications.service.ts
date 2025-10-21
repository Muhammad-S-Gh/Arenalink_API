import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { UserFcmToken } from './entities/user-fcm-tokens.entity';
import { User } from '../users/entities/users.entity';
import { PersonalAccessToken } from '../auth/entities/personal-access-tokens.entity';
import { FcmDTO } from '../auth/dtos/fcm.dto';
import { Notifications } from './entities/notifications.entity';
import * as firebase from 'firebase-admin';
import * as path from 'path';
import { existsSync, readFileSync } from 'fs';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Reservation } from '../reservations/entities/reservation.entity';
import { SupportedLang } from '../yc-i18n/yc-i18n.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(UserFcmToken) private notificationRepository: Repository<UserFcmToken>,
        @InjectRepository(Notifications) private pushNotificationsRepo: Repository<Notifications>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Reservation) private reservationRepository: Repository<Reservation>,
    ) {
        this.initFirebaseFromFile();
    }

    private initFirebaseFromFile() {
        if (firebase.apps.length) return;
        try {
            const sdkPath = process.env.FIREBASE_ADMIN_SDK_PATH
                ? process.env.FIREBASE_ADMIN_SDK_PATH
                : path.resolve(process.cwd(), 'firebase-admin-sdk.json');

            this.logger.log(`Trying Firebase Admin SDK path: ${sdkPath}`);

            if (!existsSync(sdkPath)) {
                this.logger.warn(`Firebase Admin SDK file not found at ${sdkPath}.`);
                return;
            }

            const raw = readFileSync(sdkPath, 'utf8');
            const serviceAccount = JSON.parse(raw);

            firebase.initializeApp({ credential: firebase.credential.cert(serviceAccount) });

            this.logger.log(`Firebase Admin initialized from file: ${sdkPath}`);
        } catch (err) {
            this.logger.error('Failed to initialize Firebase Admin SDK from file', err as any);
        }
    }

    private async saveNotificationRecord(
        user: User,
        type: string,
        title: { en?: string; ar?: string },
        body: { en?: string; ar?: string },
    ) {
        const rec = this.pushNotificationsRepo.create({ user, type, title, body });
        return this.pushNotificationsRepo.save(rec);
    }

    async sendToUser(
        user: User,
        type: string,
        title: { ar?: string; en?: string },
        body: { ar?: string; en?: string },
    ) {
        if (!firebase.apps.length) {
            this.logger.warn('Firebase Admin not initialized — skipping push send.');
            await this.saveNotificationRecord(user, type, title, body);
            return { success: false, reason: 'not_initialized' };
        }

        const tokenEntities = await this.notificationRepository.find({ where: { user: { id: user.id } } });
        const tokens = tokenEntities.map((t) => t.fcmToken).filter(Boolean);

        if (!tokens.length) {
            await this.saveNotificationRecord(user, type, title, body);
            this.logger.debug(`No FCM tokens for user ${user.id}`);
            return { success: false, reason: 'no_tokens' };
        }

        await this.saveNotificationRecord(user, type, title, body);
        for (const token of tokens) {
            const message: firebase.messaging.Message = {
                token,
                notification: { title: title.en, body: body.en },
                android: { priority: 'high' },
                apns: { headers: { 'apns-priority': '10' } },
                data: { type },
            };

            try {
                await firebase.messaging().send(message);
            } catch (err: any) {
                const code = err?.code || err?.errorInfo?.code;
                if (
                    code === 'messaging/registration-token-not-registered' ||
                    code === 'messaging/invalid-registration-token'
                ) {
                    try {
                        await this.notificationRepository.delete({ fcmToken: token } as any);
                        this.logger.log(`Removed stale FCM token for user ${user.id}`);
                    } catch (delErr) {
                        this.logger.warn(`Failed to delete stale token ${token}`, delErr as any);
                    }
                } else {
                    this.logger.warn(`Failed to send push to token ${token}: ${code || err?.message}`);
                }
            }
        }
        return { success: true, sent: tokens.length };
    }

    async sendToUsers(
        users: User[],
        type: string,
        title: { ar?: string; en?: string },
        body: { ar?: string; en?: string },
    ) {
        for (const u of users) {
            try {
                await this.sendToUser(u, type, title, body);
            } catch (err) {
                this.logger.error(`sendToUser failed for ${u.id}`, err as any);
            }
        }
    }

    async notifyAdminsOnOwnerRegister(email: string) {
        const admins = await this.userRepository.find({ where: { role: UserRole.ADMIN } });
        const title = { en: 'New owner registered', ar: 'تم تسجيل مالك جديد' };
        const body = {
            en: `New owner with email ${email} registered`,
            ar: `قام صاحب الحساب ${email} بالتسجيل كمالك`,
        };
        await this.sendToUsers(admins, 'Admin/Owner_Registered', title, body);
    }

    async notifyAdminsOnFacilityCreated() {
        const admins = await this.userRepository.find({ where: { role: UserRole.ADMIN } });
        const title = { en: 'New facility created', ar: 'تم إنشاء منشأة جديدة' };
        const body = {
            en: `New Facility was created, checkout pending facilities`,
            ar: `تم إنشاء منشأة جديدة راجع المنشأت ذات الحالة pending`,
        };
        await this.sendToUsers(admins, 'Admin/Facility_Created', title, body);
    }

    async notifyOwnerOnPaymentDone(ownerUser: User, paymentAmount: number, facilityName?: string) {
        const title = { en: 'Payment received', ar: 'تم استلام الدفع' };
        const body = {
            en: `Payment ${paymentAmount} received for ${facilityName ?? 'your facility'}`,
            ar: `تم استلام مبلغ ${paymentAmount} لحجز في ${facilityName ?? 'منشأتك'} `,
        };
        await this.sendToUser(ownerUser, 'Owner/Payment_Done', title, body);
    }

    async notifyOwnerOnStatusApproved(user: User) {
        if (!user) return;
        const title = { en: 'Owner Approved', ar: 'تم تنشيط حسابك كمالك' };
        const body = {
            en: `Your got approved by admin, now you can create facilities`,
            ar: `تم تنشيط حسابك كمالك بإمكانك الان اضافة المنشات الخاصة بك`,
        };
        await this.sendToUser(user, 'Owner/Payment_Done', title, body);
    }

    async notifyOwnerOnFacilityApproved(user: User, facilityName: { ar: string; en: string }) {
        if (!user) return;
        const title = { en: 'Facility Approved', ar: 'تم تنشيط منشأتك' };
        const body = {
            en: `Your facility ${facilityName.en ?? ''} is Active now `,
            ar: `تم تنشيط المنشأة ${facilityName.ar ?? ''} الخاصة بك`,
        };
        await this.sendToUser(user, 'Owner/Payment_Done', title, body);
    }

    @Cron(CronExpression.EVERY_DAY_AT_6AM)
    async remindUsersWithReservationsToday() {
        try {
            const todayIso = new Date().toISOString().slice(0, 10);
            const reservations = await this.reservationRepository.find({
                where: { date: todayIso },
                relations: ['user'],
            });

            const usersMap = new Map<number, User>();
            for (const r of reservations) if (r.user) usersMap.set(r.user.id, r.user);
            const users = Array.from(usersMap.values());

            if (!users.length) {
                this.logger.log('No reservations for today; nothing to remind.');
                return;
            }

            const title = { en: 'You have a reservation today', ar: 'لديك حجز اليوم' };
            const body = { en: 'Reminder: you have a reservation today', ar: 'تذكير: لديك حجز اليوم' };

            await this.sendToUsers(users, 'User/Reservation_Reminder', title, body);
            this.logger.log(`Reminders sent to ${users.length} users with reservations today.`);
        } catch (err) {
            this.logger.error('Failed to run remindUsersWithReservationsToday', err as any);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async clearNotificationTable(): Promise<void> {
        try {
            const cutOff = new Date();
            cutOff.setDate(cutOff.getDate() - 7);

            const res = await this.pushNotificationsRepo.delete({
                createdAt: LessThanOrEqual(cutOff),
            });

            this.logger.log(
                `clearNotificationTable: deleted ${res.affected ?? 0} notifications older than ${cutOff.toISOString()}`,
            );
        } catch (err) {
            this.logger.error('clearNotificationTable failed', err as any);
        }
    }

    async getNotifications(userId: number, lang: SupportedLang, page = 1, perPage = 5) {
        const pageNum = Math.max(1, Number(page));
        const limit = Math.max(1, Number(perPage));
        const skip = (pageNum - 1) * limit;

        const [notifications, total] = await this.pushNotificationsRepo.findAndCount({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
            select: ['id', 'type', 'title', 'body', 'readAt', 'createdAt'],
        });

        const items = notifications.map((el) => {
            const id = el.id;
            const type = el.type;
            const title = lang === 'ar' ? (el.title?.ar ?? null) : (el.title?.en ?? null);
            const body = lang === 'ar' ? (el.body?.ar ?? null) : (el.body?.en ?? null);
            const readAt = el.readAt ?? null;
            const createdAt = el.createdAt ?? null;

            return {
                id,
                type,
                title,
                body,
                readAt,
                createdAt,
            };
        });

        const totalPages = Math.max(1, Math.ceil(total / limit));

        return {
            items,
            meta: {
                total,
                perPage: limit,
                page: pageNum,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1,
            },
        };
    }

    async markNotificationAsRead(notificationId: number, userId: number) {
        const notification = await this.pushNotificationsRepo.findOne({
            where: { id: notificationId },
            relations: ['user'],
        });

        if (!notification) throw new BadRequestException('Notification not found');

        if (notification.user.id !== userId) throw new BadRequestException('Notification ID mismatch');

        await this.pushNotificationsRepo.update(notificationId, {
            readAt: new Date(),
        });

        return { notificationId };
    }

    async findFcmByPat(patId: number) {
        const fcm = await this.notificationRepository.findOneBy({ token: { id: patId } });
        return fcm;
    }

    registerFcm(user: User, pat: PersonalAccessToken, userFcmToken: FcmDTO) {
        const fcmToken = this.notificationRepository.create({
            user,
            token: pat,
            fcmToken: userFcmToken.fcm_token,
            platform: userFcmToken.platform,
        });
        return this.notificationRepository.save(fcmToken);
    }

    async deleteFcm(tokenId: number) {
        this.notificationRepository.delete({ token: { id: tokenId } });
    }
}
