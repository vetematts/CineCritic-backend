import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from '../src/config/swagger.js';
import YAML from 'yamljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerSpec = swaggerJsdoc(swaggerOptions);
const yamlString = YAML.stringify(swaggerSpec, 10, 2);

const outputDir = path.join(__dirname, '..', 'docs');
const outputPath = path.join(outputDir, 'openapi.yaml');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, yamlString);

console.log('OpenAPI spec generated successfully at:', outputPath);
