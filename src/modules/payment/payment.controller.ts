import {
    Controller,
    Get,
    HttpCode,
    Logger,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { User } from '../auth/decorators/user.decorator';
import { PaymentService } from './payment.service';
import Stripe from 'stripe';
import { ReservationsService } from '../reservations/reservations.service';
import { ConfigService } from '@nestjs/config';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';
import { Public } from '../auth/decorators/public.decorator';
import { Response } from 'express';

@Controller('payment')
export class PaymentController {
    private stripe: Stripe;
    private readonly logger = new Logger(PaymentController.name);
    private webhookSecret: string;

    constructor(
        private readonly paymentService: PaymentService,
        private readonly reservationService: ReservationsService,
        private readonly configService: ConfigService,
        private readonly i18n: YcI18nService,
    ) {
        this.stripe = new Stripe(configService.getOrThrow('STRIPE_SECRET_KEY'), {
            apiVersion: '2025-07-30.basil',
        });
        this.webhookSecret = configService.getOrThrow('STRIPE_WEBHOOK_SECRET');
    }

    @Post(':reservationId/payment-intent')
    @Roles(UserRole.USER)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Pay for a reservation' })
    @ApiParam({
        name: 'reservation ID',
        type: Number,
        example: 10,
    })
    @HttpCode(201)
    async createPaymentIntent(@Param('reservationId', ParseIntPipe) reservationId, @User() user) {
        return this.paymentService.createPaymentIntent(reservationId, user);
    }

    @Public()
    @Post('webhook/stripe')
    @ApiOperation({ summary: 'Stripe webhook' })
    @HttpCode(200)
    async handleWebhook(@Req() req: Request) {
        return await this.paymentService.handleWebhook(req);
    }

    @Public()
    @Get(':paymentId/invoice')
    // @UseGuards(JwtGuard, RolesGuard)
    @Roles(UserRole.USER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Download or stream invoice PDF for a payment' })
    @ApiParam({ name: 'paymentId', type: Number, description: 'Payment id' })
    @ApiQuery({
        name: 'download',
        required: true,
        type: Boolean,
        description: 'if true force download; otherwise inline stream',
    })
    @HttpCode(200)
    async getInvoice(
        @Param('paymentId', ParseIntPipe) paymentId: number,
        @Query('download') download: boolean,
        @Res() res: Response,
    ) {
        // const forceDownload = download ? true : false;
        const forceDownload = true;
        const buffer = await this.paymentService.generateInvoicePdf(paymentId);
        const filename = `invoice-${paymentId}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', buffer.length.toString());

        if (forceDownload) {
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        } else {
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        }
        res.send(buffer);
    }
}
