import { Module } from '@nestjs/common';
import { EnergyService } from './energy.service';
import { EnergyController } from './energy.controller';
@Module({ providers: [EnergyService], controllers: [EnergyController], exports: [EnergyService] })
export class EnergyModule {}
