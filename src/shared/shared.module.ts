import { forwardRef, Module } from '@nestjs/common';
import { IsUniqueConstraint } from './validators/is-unique.constraint';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../modules/users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature(),
        forwardRef(() => UsersModule),
        //
    ],
    providers: [IsUniqueConstraint],
    exports: [IsUniqueConstraint],
})
export class SharedModule {}
