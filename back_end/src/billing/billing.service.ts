import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { DataSource, In } from 'typeorm';

import { Patient } from '../patients/Entities/patient.entity';

import { CoverageType } from './entities/coverage.entity';
import { ServiceCatalog } from './entities/service-catalog.entity';
import { CoverageServicePrice } from './entities/coverage-service-price.entity';
import { Invoice } from './entities/invoice.entity';
import { Admission } from '../admissions/entities/admission.entity';
import { InvoiceStatus } from './entities/invoice.entity';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CoverageStrategyFactory } from './strategies/coverage-strategy.factory';

import { StayAccount, StayAccountStatus } from './entities/stay-account.entity';
import { SupplyPrice } from './entities/supply-price.entity';
import { AccountCharge } from './entities/account-charge.entity';
import { AccountChargeCategory } from './entities/account-charge.entity';

import { Supply } from '../inventory/entities/supply.entity';
import { MedicationAdministration } from '../medication/entities/medication-administration.entity';

@Injectable()
export class BillingService {

  constructor(
    private readonly dataSource: DataSource,
    private readonly strategyFactory: CoverageStrategyFactory,
  ) {}

  async createInvoice(dto: CreateInvoiceDto) {

    return this.dataSource.transaction(async manager => {

      // 1. Buscar paciente y cobertura

      const patient = await manager.findOne(Patient, {
        where: { id: dto.patientId },
        relations: {
          coverage: true,
        },
      });

      if (!patient) {
        throw new NotFoundException(
          'Paciente no encontrado.'
        );
      }

      if (!patient.coverage) {
        throw new BadRequestException(
          'El paciente no tiene cobertura asignada. Debe registrarse como particular si no posee cobertura.'
        );
      }

      const coverage = patient.coverage;

      if (!coverage.isActive) {
        throw new BadRequestException(
          'La cobertura no está activa.'
        );
      }

      // 2. Buscar prestación

      const service = await manager.findOne(ServiceCatalog, {
        where: {
          id: dto.serviceId,
          isActive: true,
        },
      });

      if (!service) {
        throw new NotFoundException(
          'Prestación no encontrada o inactiva.'
        );
      }

      // 3. Obtener valores monetarios

      const baseAmount = Number(service.basePrice);

      if (
        !Number.isFinite(baseAmount) ||
        baseAmount < 0
      ) {
        throw new BadRequestException(
          'El valor base de la prestación no es válido.'
        );
      }

      let copayAmount = 0;

      // 4. Obtener copago específico de la prestación

      if (coverage.type === CoverageType.PREPAGA) {

        const specificPrice = await manager.findOne(
          CoverageServicePrice,
          {
            where: {
              coverageId: coverage.id,
              serviceId: service.id,
            },
          }
        );

        copayAmount = Number(
          specificPrice?.copayAmount ?? coverage.fixedCopay
        );

        if (
          !Number.isFinite(copayAmount) ||
          copayAmount < 0 ||
          copayAmount > baseAmount
        ) {
          throw new BadRequestException(
            'El copago configurado no es válido para esta prestación.'
          );
        }
      }

      // 5. Seleccionar estrategia

      const strategy = this.strategyFactory.getStrategy(
        coverage.type
      );

      // 6. Calcular importes

      const calculation = strategy.calculate(
        baseAmount,
        copayAmount
      );

      // 7. Verificar distribución económica

      const total = Number(
        (
          calculation.patientAmount +
          calculation.payerAmount
        ).toFixed(2)
      );

      if (total !== Number(baseAmount.toFixed(2))) {
        throw new BadRequestException(
          'Error en la distribución de los importes.'
        );
      }

      // 8. Registrar factura

      const invoice = manager.create(Invoice, {

        patientId: patient.id,
        coverageId: coverage.id,
        serviceId: service.id,

        patientNameSnapshot:
          `${patient.firstName} ${patient.lastName}`,

        coverageNameSnapshot: coverage.name,
        serviceNameSnapshot: service.name,

        baseAmount: calculation.baseAmount,
        patientAmount: calculation.patientAmount,
        payerAmount: calculation.payerAmount,

      });

      return manager.save(Invoice, invoice);

    });
  }

  async chargeMedicationAdministration(administrationId: number) {
    return this.dataSource.transaction(async manager => {

      // 1. Recuperar la administración y su prescripción.
      const administration = await manager.findOne(
        MedicationAdministration,
        {
          where: { id: administrationId },
          relations: {
            medicationOrder: true,
          },
        },
      );

      if (!administration) {
        throw new NotFoundException(
          'Administración de medicamento no encontrada.',
        );
      }

      // 2. Evitar cargos duplicados.
      const existingCharge = await manager.findOne(
        AccountCharge,
        {
          where: { sourceAdministrationId: administrationId },
        },
      );

      if (existingCharge) {
        return {
          message: 'El cargo de esta administración ya existe.',
          duplicated: true,
          charge: existingCharge,
        };
      }

      const order = administration.medicationOrder;
      const consumedAt = new Date(administration.administeredAt);

      if (Number.isNaN(consumedAt.getTime())) {
        throw new BadRequestException(
          'La fecha de administración no es válida.',
        );
      }

      // 3. Buscar el insumo correspondiente.
      const supply = await manager
        .getRepository(Supply)
        .createQueryBuilder('supply')
        .where(
          'LOWER(TRIM(supply.name)) = LOWER(TRIM(:name))',
          { name: order.medicationName },
        )
        .andWhere('supply.isActive = :active', { active: true })
        .getOne();

      if (!supply) {
        throw new NotFoundException(
          `El insumo "${order.medicationName}" no está registrado o está inactivo.`,
        );
      }

      // 4. Buscar la cuenta activa de la internación.
      const account = await manager.findOne(StayAccount, {
        where: {
          admissionId: order.admissionId,
          status: StayAccountStatus.ACTIVA,
        },
      });

      if (!account) {
        throw new NotFoundException(
          `No existe una cuenta activa para la internación ${order.admissionId}.`,
        );
      }

      // 5. Buscar el precio vigente en la fecha de administración.
      const price = await manager
        .getRepository(SupplyPrice)
        .createQueryBuilder('price')
        .where('price.supplyId = :supplyId', {
          supplyId: supply.id,
        })
        .andWhere('price.validFrom <= :consumedAt', {
          consumedAt,
        })
        .andWhere(
          '(price.validUntil IS NULL OR price.validUntil > :consumedAt)',
          { consumedAt },
        )
        .andWhere('price.isActive = :active', {
          active: true,
        })
        .orderBy('price.validFrom', 'DESC')
        .getOne();

      if (!price) {
        throw new NotFoundException(
          `No existe un precio vigente para el insumo "${supply.name}" en la fecha de administración.`,
        );
      }

      const unitPrice = Number(price.unitPrice);
      const quantity = 1;
      const totalAmount = Number(
        (unitPrice * quantity).toFixed(2),
      );

      if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0 ||
        !Number.isFinite(totalAmount)
      ) {
        throw new BadRequestException(
          'El precio del insumo no es válido.',
        );
      }

      // 6. Generar el cargo administrativo.
      const charge = manager.create(AccountCharge, {
        accountId: account.id,
        supplyId: supply.id,
        category: AccountChargeCategory.FARMACIA,
        description: `Insumos de Farmacia - ${supply.name}`,
        quantity,
        unitPrice,
        totalAmount,
        sourceAdministrationId: administrationId,
        consumedAt,
      });

      const savedCharge = await manager.save(
        AccountCharge,
        charge,
      );

      return {
        message: 'Cargo de farmacia generado correctamente.',
        duplicated: false,
        charge: savedCharge,
      };
    });
  }

    // Listado general de cuentas de internación.
  async findAccounts() {
    const accounts = await this.dataSource
      .getRepository(StayAccount)
      .find({
        order: {
          openedAt: 'DESC',
        },
      });

    if (accounts.length === 0) {
      return [];
    }

    const admissionIds = accounts.map(
      account => account.admissionId,
    );

    const admissions = await this.dataSource
      .getRepository(Admission)
      .find({
        where: {
          id: In(admissionIds),
        },
        relations: {
          patient: true,
          room: true,
          bed: true,
        },
      });

    const accountIds = accounts.map(account => account.id);

    const charges = await this.dataSource
      .getRepository(AccountCharge)
      .find({
        where: {
          accountId: In(accountIds),
        },
        relations: {
          supply: true,
        },
        order: {
          consumedAt: 'DESC',
        },
      });

    const admissionMap = new Map(
      admissions.map(admission => [
        admission.id,
        admission,
      ]),
    );

    const chargesMap = new Map<number, AccountCharge[]>();

    for (const charge of charges) {
      const current = chargesMap.get(charge.accountId) ?? [];
      current.push(charge);
      chargesMap.set(charge.accountId, current);
    }

    return accounts.map(account => {
      const admission = admissionMap.get(account.admissionId);
      const accountCharges = chargesMap.get(account.id) ?? [];

      const totalCharges = accountCharges.reduce(
        (total, charge) => total + Number(charge.totalAmount),
        0,
      );

      return {
        ...account,
        admission: admission ?? null,
        charges: accountCharges,
        totalCharges: Number(totalCharges.toFixed(2)),
      };
    });
  }

  // Cuenta corriente y facturación de un paciente.
  async findPatientAccount(patientId: number) {
    const patient = await this.dataSource
      .getRepository(Patient)
      .findOne({
        where: {
          id: patientId,
        },
        relations: {
          coverage: true,
        },
      });

    if (!patient) {
      throw new NotFoundException(
        'Paciente no encontrado.',
      );
    }

    const admissions = await this.dataSource
      .getRepository(Admission)
      .find({
        where: {
          patientId,
        },
        relations: {
          room: true,
          bed: true,
        },
        order: {
          admissionDate: 'DESC',
        },
      });

    const admissionIds = admissions.map(
      admission => admission.id,
    );

    const accounts = admissionIds.length > 0
      ? await this.dataSource
          .getRepository(StayAccount)
          .find({
            where: {
              admissionId: In(admissionIds),
            },
            order: {
              openedAt: 'DESC',
            },
          })
      : [];

    const accountIds = accounts.map(
      account => account.id,
    );

    const charges = accountIds.length > 0
      ? await this.dataSource
          .getRepository(AccountCharge)
          .find({
            where: {
              accountId: In(accountIds),
            },
            relations: {
              supply: true,
            },
            order: {
              consumedAt: 'DESC',
            },
          })
      : [];

    const invoices = await this.dataSource
      .getRepository(Invoice)
      .find({
        where: {
          patientId,
        },
        order: {
          issuedAt: 'DESC',
        },
      });

    const admissionMap = new Map(
      admissions.map(admission => [
        admission.id,
        admission,
      ]),
    );

    const chargesMap = new Map<number, AccountCharge[]>();

    for (const charge of charges) {
      const current = chargesMap.get(charge.accountId) ?? [];
      current.push(charge);
      chargesMap.set(charge.accountId, current);
    }

    const accountsWithDetails = accounts.map(account => {
      const admission = admissionMap.get(account.admissionId);
      const accountCharges = chargesMap.get(account.id) ?? [];

      const totalCharges = accountCharges.reduce(
        (total, charge) => total + Number(charge.totalAmount),
        0,
      );

      return {
        ...account,
        admission: admission ?? null,
        charges: accountCharges,
        totalCharges: Number(totalCharges.toFixed(2)),
      };
    });

    const totalCharges = charges.reduce(
      (total, charge) => total + Number(charge.totalAmount),
      0,
    );

    const totalInvoiced = invoices.reduce(
      (total, invoice) => total + Number(invoice.baseAmount),
      0,
    );

    const patientPending = invoices
      .filter(invoice => invoice.status === InvoiceStatus.PENDIENTE)
      .reduce(
        (total, invoice) => total + Number(invoice.patientAmount),
        0,
      );

    return {
      patient,
      accounts: accountsWithDetails,
      invoices,
      summary: {
        totalCharges: Number(totalCharges.toFixed(2)),
        totalInvoiced: Number(totalInvoiced.toFixed(2)),
        pendingPatientInvoices: Number(patientPending.toFixed(2)),
        chargesCount: charges.length,
        invoicesCount: invoices.length,
      },
    };
  }
}
