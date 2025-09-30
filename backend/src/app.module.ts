import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClipboardEntry } from './clipboard/clipboard.entity';
import { ClipboardModule } from './clipboard/clipboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST', 'db'),
        port: Number.parseInt(config.get<string>('DATABASE_PORT', '5432'), 10),
        username: config.get<string>('DATABASE_USER', 'clipboard'),
        password: config.get<string>('DATABASE_PASSWORD', 'clipboard'),
        database: config.get<string>('DATABASE_NAME', 'clipboard'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        entities: [ClipboardEntry],
      }),
    }),
    ClipboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
