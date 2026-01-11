// backend/src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ContractsService } from '../contracts/contracts.service';
import { UserDocument, UserRole, UserProfile } from '../users/schemas/user.schema';
import { CreateClientDto } from '../users/dto/create-client.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private contractsService: ContractsService,
  ) {}

  // --- REGISTER ---
  async register(dto: RegisterDto) {
    // Vérifier que le rôle est autorisé pour l'inscription
    if (dto.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot register as admin');
    }

    if (dto.role === UserRole.CLIENT) {
      throw new BadRequestException('Clients must be created by admin');
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email déjà utilisé');

    // Vérification du CIN pour les collaborateurs/managers
    if (dto.role === UserRole.COLLABORATEUR || dto.role === UserRole.MANAGER) {
      const existingByCin = await this.usersService.findByCin(dto.cin);
      if (existingByCin) throw new ConflictException('CIN déjà utilisé');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const userData: any = {
      role: dto.role,
      nom: dto.nom,
      prenoms: dto.prenoms,
      email: dto.email,
      telephone: dto.telephone,
      password: hashed,
      completedProfile: true, // Les collaborateurs complètent leur profil à l'inscription
    };

    // Ajouter les champs spécifiques selon le rôle
    if (dto.role === UserRole.COLLABORATEUR || dto.role === UserRole.MANAGER) {
      userData.profile = dto.profile;
      userData.dateNaissance = new Date(dto.dateNaissance);
      userData.genre = dto.genre;
      userData.adresse = dto.adresse;
      userData.cin = dto.cin;
      userData.poste = dto.poste;
      userData.dateDebut = new Date(dto.dateDebut);
      userData.dateFin = dto.dateFin ? new Date(dto.dateFin) : undefined;
      userData.dateFinIndeterminee = dto.dateFinIndeterminee;
      userData.tjm = dto.tjm;

      // Ajouter les champs spécifiques selon le profil
      if (dto.profile === UserProfile.STAGIAIRE) {
        userData.mission = dto.mission;
        userData.indemnite = dto.indemnite;
        userData.indemniteConnexion = dto.indemniteConnexion;
      } else if (dto.profile === UserProfile.PRESTATAIRE) {
        userData.domainePrestation = dto.domainePrestation;
        userData.tarifJournalier = dto.tarifJournalier;
        userData.dureeJournaliere = dto.dureeJournaliere;
      }
    }

    const user = await this.usersService.create(userData);

    // GÉNÉRER LE CONTRAT pour les collaborateurs et managers
    if (dto.role === UserRole.COLLABORATEUR || dto.role === UserRole.MANAGER) {
      try {
        this.logger.log(`Génération du contrat pour l'utilisateur: ${user._id}`);
        const contract = await this.contractsService.generateContract((user._id as any).toString());
        this.logger.log(`Contrat généré avec succès: ${contract.contractNumber}`);
      } catch (error) {
        this.logger.error('Erreur lors de la génération du contrat:', error);
        // Ne pas bloquer l'inscription si la génération échoue
      }
    }

    const obj = user.toObject();
    delete obj.password;

    const payload = { 
      sub: obj._id.toString(), 
      email: obj.email, 
      role: obj.role,
      profile: obj.profile // Peut être undefined pour admin/client
    };
    const token = this.jwtService.sign(payload);

    return {
      user: obj,
      token,
    };
  }

  async createClient(dto: CreateClientDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email déjà utilisé');

    const hashed = await bcrypt.hash(dto.password, 10);

    const userData: any = {
      role: UserRole.CLIENT,
      email: dto.email,
      password: hashed,
      completedProfile: false, // Le client complétera son profil plus tard
      nom: dto.nom || '',
      prenoms: dto.prenoms || '',
      telephone: dto.telephone || '',
      entreprise: dto.entreprise || '',
      nif: dto.nif || '',
      stat: dto.stat || '',
      roleClient: dto.roleClient || '',
    };

    const user = await this.usersService.create(userData);
    const obj = user.toObject();
    delete obj.password;

    return obj;
  }

  // --- COMPLETE CLIENT PROFILE ---
  async completeClientProfile(userId: string, profileData: any) {
    const updateData = {
      ...profileData,
      completedProfile: true
    };

    return this.usersService.update(userId, updateData);
  }

  // --- VALIDATE USER ---
async validateUser(email: string, password: string): Promise<any> {
  const user = await this.usersService.findByEmailWithPassword(email);
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  const obj = user.toObject();
  delete obj.password;
  
  // Retourner les informations cohérentes avec le nouveau schéma
  return {
    ...obj,
    _id: obj._id,
    role: obj.role,
    profile: obj.profile // Peut être undefined pour admin/client
  };
}

  // --- LOGIN ---
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const payload = { 
      sub: (user as any)._id.toString(), 
      email: user.email, 
      role: (user as any).role,
      profile: (user as any).profile // Peut être undefined pour admin/client
    };
    const token = this.jwtService.sign(payload);

    return {
      user,
      token,
    };
  }
}