import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentsModule } from './appointments/appointments.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoomsModule } from './rooms/rooms.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { VitalSignsModule } from './vital-signs/vital-signs.module';
import { ClinicalHistoryModule } from './clinical-history/clinical-history.module';
import { MedicationModule } from './medication/medication.module';
import { BillingModule } from './billing/billing.module';
  
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
    }),
      }),
    EventEmitterModule.forRoot(),
    AppointmentsModule,
    PatientsModule,
    DoctorsModule,
    UsersModule,
    AuthModule,
    RoomsModule,
    AdmissionsModule,
    VitalSignsModule,
    ClinicalHistoryModule,
    MedicationModule,
    BillingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}
