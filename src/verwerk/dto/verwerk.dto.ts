import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class VerwerkDto
{
   @IsString()
   naam!: string;

   @IsString()
   spreadsheetId!: string;

   @IsString()
   tabName!: string;

   @IsString()
   emailKolom!: string;

   @IsString()
   statusKolom!: string;

   @IsInt()
   competentie!: number;

   @IsOptional()
   @IsString()
   scoreKolom!: string;

   @IsOptional()
   @IsPositive()
   @IsInt()
   minScore!: number;
}