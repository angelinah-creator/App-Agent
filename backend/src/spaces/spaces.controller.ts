import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminManagerGuard } from 'src/auth/guards/admin-manager.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('shared/spaces')
@UseGuards(JwtAuthGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  @UseGuards(AdminManagerGuard)
  createSpace(@Body() createSpaceDto: CreateSpaceDto, @Req() req: AuthenticatedRequest) {
    return this.spacesService.createSpace(createSpaceDto, req.user.userId);
  }

  // Endpoint pour uploader une photo
  @Post('upload-photo')
  @UseGuards(AdminManagerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('spaceName') spaceName: string,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Validation du type de fichier
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou GIF.');
    }

    return this.spacesService.uploadSpacePhoto(file, spaceName || 'space');
  }

  @Get('admin/all')
  @UseGuards(AdminManagerGuard)
  getAllSpaces(@Query() filters: any) {
    return this.spacesService.getAllSpaces(filters);
  }

  @Get('my-spaces')
  getMySpaces(@Req() req: AuthenticatedRequest) {
    return this.spacesService.getUserSpaces(req.user.userId);
  }

  @Get(':id')
  getSpace(@Param('id') id: string) {
    return this.spacesService.getSpaceById(id);
  }

  @Put(':id')
  @UseGuards(AdminManagerGuard)
  updateSpace(@Param('id') id: string, @Body() updateSpaceDto: UpdateSpaceDto, @Req() req: AuthenticatedRequest) {
    return this.spacesService.updateSpace(id, updateSpaceDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(AdminManagerGuard)
  deleteSpace(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.spacesService.deleteSpace(id, req.user.userId);
  }
}