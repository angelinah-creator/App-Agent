import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto, UserProfile } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ContractsService } from '../contracts/contracts.service';
import { UserDocument } from '../users/schemas/user.schema'; // AJOUT de l'import

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
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email déjà utilisé');

    // Vérification du CIN
    const existingByCin = await this.usersService.findByCin(dto.cin);
    if (existingByCin) throw new ConflictException('CIN déjà utilisé');

    const hashed = await bcrypt.hash(dto.password, 10);

    const userData: any = {
      profile: dto.profile,
      nom: dto.nom,
      prenoms: dto.prenoms,
      dateNaissance: new Date(dto.dateNaissance),
      genre: dto.genre,
      adresse: dto.adresse,
      cin: dto.cin,
      poste: dto.poste,
      dateDebut: new Date(dto.dateDebut),
      dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
      dateFinIndeterminee: dto.dateFinIndeterminee,
      tjm: dto.tjm,
      telephone: dto.telephone,
      email: dto.email,
      password: hashed,
    };

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

    const user = await this.usersService.create(userData);

    // GÉNÉRER LE CONTRAT AUTOMATIQUEMENT
    try {
      this.logger.log(`Génération du contrat pour l'utilisateur: ${user._id}`);
      // CORRECTION: Conversion explicite en string
      const contract = await this.contractsService.generateContract((user._id as any).toString());
      this.logger.log(`Contrat généré avec succès: ${contract.contractNumber}`);
    } catch (error) {
      this.logger.error('Erreur lors de la génération du contrat:', error);
      // Ne pas bloquer l'inscription si la génération échoue
    }

    const obj = user.toObject();
    delete obj.password;

    // CORRECTION: Conversion explicite pour le payload
    const payload = { 
      sub: obj._id.toString(), 
      email: obj.email, 
      profile: obj.profile 
    };
    const token = this.jwtService.sign(payload);

    return {
      user: obj,
      token,
    };
  }

  // --- VALIDATE USER ---
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const obj = user.toObject();
    delete obj.password;
    return obj;
  }

  // --- LOGIN ---
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

    // CORRECTION: Conversion explicite pour le payload
    const payload = { 
      sub: (user as any)._id.toString(), 
      email: user.email, 
      profile: (user as any).profile 
    };
    const token = this.jwtService.sign(payload);

    return {
      user,
      token,
    };
  }
}