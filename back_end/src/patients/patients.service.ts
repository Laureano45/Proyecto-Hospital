import {
  Injectable,
  ConflictException,
  NotFoundException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from './Entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientAllergy } from './Entities/patient-allergy.entity';
import { CreatePatientAllergyDto } from './dto/create-patient-allergy.dto';
import { PatientFamilyHistory } from './Entities/patient-family-history.entity';
import { CreatePatientFamilyHistoryDto } from './dto/create-patient-family-history.dto';

@Injectable()
export class PatientsService {

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(PatientAllergy)
    private readonly allergyRepository: Repository<PatientAllergy>,

    @InjectRepository(PatientFamilyHistory)
    private readonly familyHistoryRepository: Repository<PatientFamilyHistory>,
  ) {}

  async create(dto: CreatePatientDto) {
    const patient = this.patientRepository.create(dto);

    try {
      return await this.patientRepository.save(patient);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'El DNI o correo electrónico ya está registrado'
        );
      }

      throw error;
    }
  }

  async findAll() {
    return this.patientRepository.find();
  }

  async findOne(id: number) {
    return this.patientRepository.findOne({
      where: { id }
    });
  }

  async createAllergy(
    patientId: number,
    dto: CreatePatientAllergyDto,
  ) {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const allergy = this.allergyRepository.create({
      patientId,
      allergen: dto.allergen.trim(),
      severity: dto.severity,
    });

    return this.allergyRepository.save(allergy);
  }

  async findAllergies(patientId: number) {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return this.allergyRepository.find({
      where: { patientId },
      order: { id: 'DESC' },
    });
  }

  async createFamilyHistory(
    patientId: number,
    dto: CreatePatientFamilyHistoryDto,
  ) {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const familyHistory = this.familyHistoryRepository.create({
      patientId,
      relative: dto.relative.trim(),
      condition: dto.condition.trim(),
      observations: dto.observations?.trim() || null,
    });

    return this.familyHistoryRepository.save(familyHistory);
  }

  async findFamilyHistory(patientId: number) {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return this.familyHistoryRepository.find({
      where: { patientId },
      order: { id: 'DESC' },
    });
  }
}
