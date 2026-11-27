import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';

import {ConfigService} from '@nestjs/config';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import { Doctor } from '../doctors/Entities/doctor.entity';
import { Role } from './roles.enum';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService implements OnApplicationBootstrap{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    private readonly configService: ConfigService,

    private readonly dataSource: DataSource,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: { doctor: true },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { doctor: true },
    });
  }

  async desactivarUsuario(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role === Role.ADMIN) {
      throw new BadRequestException(
        'No se puede desactivar una cuenta de administrador',
      );
    }

    user.isActive = false;

    const updatedUser = await this.userRepository.save(user);

    const { password, ...safeUser } = updatedUser;

    return safeUser;
  }

  async activarUsuario(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = true;

    const updatedUser = await this.userRepository.save(user);

    const { password, ...safeUser } = updatedUser;

    return safeUser;
  }

  async findAll() {
    const usuarios = await this.userRepository.find({
      where: {
        role: In([
          Role.MEDICO,
          Role.ENFERMERO,
          Role.RECEPCIONISTA,
          Role.MAESTRANZA,
        ]),
      },
      relations: {
        doctor: true,
      },
      order: {
        lastName: 'ASC',
        firstName: 'ASC',
      },
    });

    return usuarios.map(({ password, ...usuario }) => usuario);
  }


  async createUser(dto: CreateUserDto) {
    const allowedRoles = [
      Role.MEDICO,
      Role.ENFERMERO,
      Role.RECEPCIONISTA,
      Role.MAESTRANZA,
    ];

    if (!allowedRoles.includes(dto.role)) {
      throw new BadRequestException(
        'El rol indicado no está permitido para este registro',
      );
    }

    return this.dataSource.transaction(async manager => {
      const userRepo = manager.getRepository(User);
      const doctorRepo = manager.getRepository(Doctor);

      const existingUser = await userRepo.findOne({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException(
          'Ya existe un usuario con ese correo electrónico',
        );
      }

      let doctor: Doctor | null = null;

      if (dto.role === Role.MEDICO) {
        if (!dto.specialty || !dto.licenseNumber) {
          throw new BadRequestException(
            'El médico debe tener especialidad y matrícula',
          );
        }

        const existingDoctor = await doctorRepo.findOne({
          where: {
            licenseNumber: dto.licenseNumber,
          },
        });

        if (existingDoctor) {
          throw new ConflictException(
            'Ya existe un médico con esa matrícula',
          );
        }

        doctor = doctorRepo.create({
          firstName: dto.firstName,
          lastName: dto.lastName,
          specialty: dto.specialty,
          licenseNumber: dto.licenseNumber,
        });

        doctor = await doctorRepo.save(doctor);
      }

      const hashedPassword = await bcrypt.hash(
        dto.password,
        10,
      );

      const user = userRepo.create({
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        doctor,
      });

      const savedUser = await userRepo.save(user);

      const { password, ...safeUser } = savedUser;

      return safeUser;
    });
  }


  async onApplicationBootstrap() {
    await this.createInitialAdmin();
  }

  async createInitialAdmin() {
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    const firstName = this.configService.get<string>('ADMIN_FIRST_NAME');
    const lastName = this.configService.get<string>('ADMIN_LAST_NAME');

    // Si no hay configuración, no crear administrador.
    if (!email || !password || !firstName || !lastName) {
      console.log('Configuración inicial de ADMIN no encontrada.');
      return;
    }

    if (password.length < 12) {
      throw new Error('La contraseña inicial del ADMIN debe tener al menos 12 caracteres.');
    }

    // Evitar crear administradores duplicados.
    const existingAdmin = await this.userRepository.findOne({
      where: { role: Role.ADMIN },
    });

    if (existingAdmin) {
      console.log('Ya existe un administrador. No se creará otro.');
      return;
    }

    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        'El correo configurado para ADMIN ya pertenece a otro usuario.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: Role.ADMIN,
      doctor: null,
    });

    await this.userRepository.save(admin);

    console.log('Administrador inicial creado correctamente.');
  }

}
