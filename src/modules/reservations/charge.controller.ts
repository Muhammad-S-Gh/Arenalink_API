import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { User } from '../auth/decorators/user.decorator';
import { CreateChargeDto } from './dtos/create-charge.dto';

@Controller('charge')
export class ChargeController {
    constructor(private readonly stripeService: StripeService) {}

    @Post()
    @UseGuards(JwtGuard)
    async createCharge(@Body() charge: CreateChargeDto, @User() user) {
        await this.stripeService.charge(charge.amount, charge.paymentMethodId, user.stripeCustomerId);
    }
}
