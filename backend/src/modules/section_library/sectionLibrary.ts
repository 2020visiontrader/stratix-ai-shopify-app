import { promises as fs } from 'fs';
import path from 'path';

export async function listAvailableSections(): Promise<string[]> {
  const dir = path.join(__dirname, '../../templates/sections');
  const files = await fs.readdir(dir);
  return files.filter(f => f.endsWith('.liquid'));
}

export async function insertSection(pageTemplatePath: string, sectionName: string, settings: Record<string, any> = {}): Promise<void> {
  const tplRaw = await fs.readFile(pageTemplatePath, 'utf-8');
  const tpl = JSON.parse(tplRaw);
  tpl.sections = tpl.sections || [];
  tpl.sections.push({ name: sectionName.replace('.liquid',''), settings });
  await fs.writeFile(pageTemplatePath, JSON.stringify(tpl, null, 2));
} 