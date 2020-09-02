import dotEnv from 'dotenv';
import dotEnvExpand from 'dotenv-expand';
import fs from 'fs';
import path from 'path';

export const loadEnvs = (dotEnvFileName: string, env: string): string[] => {
    return [
        `${dotEnvFileName}.${env}.local`,
        `${dotEnvFileName}.${env}`,
        // Don't include `.env.local` for `test` environment
        // since normally you expect __tests__ to produce the same
        // results for everyone
        env !== 'test' ? `${dotEnvFileName}.local` : '',
        dotEnvFileName
    ].filter(Boolean);
};

const basePath = path.resolve(path.join(__dirname, '../../'));
const dotEnvFiles: string[] = loadEnvs('.env', (process.env.NODE_ENV || 'development') as string);

dotEnvFiles
    .map((fileName: string) => path.join(basePath, fileName as string))
    .filter((dotEnvFile: string) => fs.existsSync(dotEnvFile))
    .forEach((dotEnvFile: string) => {
        dotEnvExpand(dotEnv.config({ path: dotEnvFile }));
    });
