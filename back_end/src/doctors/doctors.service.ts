
import {
  Injectable,
  ConflictException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Doctor } from './Entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';

@Injectable()
export class DoctorsService {

  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>
  ) {}

  async create(dto: CreateDoctorDto) {
    const doctor = this.doctorRepository.create(dto);

    try {
      return await this.doctorRepository.save(doctor);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'La matrícula profesional ya está registrada'
        );
      }

      throw error;
    }
  }

  async findAll() {
    return this.doctorRepository.find();
  }

  async findOne(id: number) {
    return this.doctorRepository.findOne({
      where: { id }
    });
  }
}
