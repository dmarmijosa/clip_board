import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClipboardController } from './clipboard.controller';
import { ClipboardEntry } from './clipboard.entity';
import { ClipboardGateway } from './clipboard.gateway';
import { ClipboardService } from './clipboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClipboardEntry])],
  controllers: [ClipboardController],
  providers: [ClipboardService, ClipboardGateway],
  exports: [ClipboardService],
})
export class ClipboardModule {}
