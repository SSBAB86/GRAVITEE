import { logger } from '../../../logger';
import { exec } from '../../../util/exec';
import type { ExecOptions, ToolConstraint } from '../../../util/exec/types';
import { readLocalFile } from '../../../util/fs';
import { getRepoStatus } from '../../../util/git';
import { regEx } from '../../../util/regex';
import type { UpdateArtifact, UpdateArtifactsResult } from '../types';

export async function updateArtifacts({
  packageFileName,
  config,
}: UpdateArtifact): Promise<UpdateArtifactsResult[] | null> {
  const lockFileName = packageFileName.replace(regEx(/\.nix$/), '.lock');
  const existingLockFileContent = await readLocalFile(lockFileName, 'utf8');
  if (!existingLockFileContent) {
    logger.debug('No flake.lock found');
    return null;
  }

  const nixToolConstraint: ToolConstraint = {
    toolName: 'nix',
    constraint: config.constraints?.nix,
  };

  const cmd = `nix \
    --extra-experimental-features nix-command \
    --extra-experimental-features flakes \
    flake update`;

  const execOptions: ExecOptions = {
    cwdFile: packageFileName,
    env: {
      PATH: `/home/jamie/.local/bin:${process.env.PATH!}`,
    },
    toolConstraints: [nixToolConstraint],
    docker: {
      image: 'sidecar',
    },
  };

  await exec(cmd, execOptions);

  const status = await getRepoStatus();
  if (!status.modified.includes(lockFileName)) {
    return null;
  }
  logger.debug('Returning updated flake.lock');
  const res: UpdateArtifactsResult[] = [
    {
      file: {
        type: 'addition',
        path: lockFileName,
        contents: await readLocalFile(lockFileName),
      },
    },
  ];

  return res;
}
