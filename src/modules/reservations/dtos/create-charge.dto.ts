import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateChargeDto {
    @IsString({ message: i18nValidationMessage('payments.invalidPaymentMethodId') })
    @IsNotEmpty({ message: i18nValidationMessage('payments.paymentMethodIdRequired') })
    paymentMethodId: string;

    @IsNumber({}, { message: i18nValidationMessage('payments.invalidAmount') })
    @IsNotEmpty({ message: i18nValidationMessage('payments.amountRequired') })
    amount: number;
}
