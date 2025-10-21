import { Body, Controller, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger/dist';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ReservationResponseDto } from './dtos/reservation-response.dto';
import { ReservationsService } from './reservations.service';
import { User } from '../auth/decorators/user.decorator';
import { CreateReservationResultDto } from './dtos/create-reservation-response.dto';

@Controller('reservations')
export class ReservationsController {
    constructor(private readonly reseravtionsService: ReservationsService) {}

    @Post(':facilityId/schedule/:availabilityId/:slotId')
    @Roles(UserRole.USER)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'make a pending reservation' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiParam({
        name: 'availabilityId',
        type: Number,
        description: 'availability ID for the facility (e.g sunday schedule id)',
        example: 10,
    })
    @ApiParam({
        name: 'slotId',
        type: Number,
        description: 'bookable slot in the availability',
        example: 10,
    })
    @ApiBody({ type: CreateReservationDto })
    @ApiResponse({
        status: 201,
        description: 'reservation created successfully',
        type: CreateReservationResultDto,
    })
    @HttpCode(201)
    async makingReservation(
        @User() user,
        @Param('facilityId', ParseIntPipe) facilityId: number,
        @Param('availabilityId', ParseIntPipe) availabilityId: number,
        @Param('slotId', ParseIntPipe) slotId: number,
        @Body() dto: CreateReservationDto,
    ) {
        return this.reseravtionsService.createReservation(user, facilityId, availabilityId, slotId, dto);
    }

    @Patch(':reservationId/cancel')
    @Roles(UserRole.USER)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'cancelling reservation' })
    @ApiParam({
        name: 'reservationId',
        type: Number,
        description: 'Reservation ID',
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'Your reservation was cancelled',
    })
    @HttpCode(200)
    async cancelReservation(@User() user, @Param('reservationId', ParseIntPipe) reservationId: number) {
        return this.reseravtionsService.cancelReservation(reservationId, user);
    }
}
