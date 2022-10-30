import { join } from 'upath';
import { envMock, mockExecSequence } from '../../../../test/exec-util';
import { env } from '../../../../test/util';
import { GlobalConfig } from '../../../config/global';
import type { RepoGlobalConfig } from '../../../config/types';
import { extractPackageFile } from '.';

jest.mock('../../../util/exec/env');
jest.mock('../../../util/git');
jest.mock('../../../util/http');
jest.mock('../../../util/fs');

const adminConfig: RepoGlobalConfig = {
  // `join` fixes Windows CI
  localDir: join('/tmp/github/some/repo'),
  cacheDir: join('/tmp/cache'),
  containerbaseDir: join('/tmp/cache/containerbase'),
};

const cmd =
  'nix     --extra-experimental-features nix-command     --extra-experimental-features flakes     eval --raw --file flake.nix inputs.nixpkgs.url';

describe('modules/manager/nix/extract', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    env.getChildProcessEnv.mockReturnValue({
      ...envMock.basic,
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US',
    });

    GlobalConfig.set(adminConfig);
  });

  it('returns null for empty stdout', async () => {
    const execSnapshots = mockExecSequence([{ stdout: '', stderr: '' }]);
    const res = await extractPackageFile('', 'flake.nix');

    expect(res).toBeNull();
    expect(execSnapshots).toMatchObject([
      {
        cmd,
      },
    ]);
  });

  it('returns nixpkgs-unstable', async () => {
    const execSnapshots = mockExecSequence([
      { stdout: 'github:nixos/nixpkgs/nixpkgs-unstable', stderr: '' },
    ]);
    const res = await extractPackageFile('', 'flake.nix');

    expect(res?.deps).toHaveLength(1);
    expect(res?.deps).toEqual([
      {
        depName: 'nixpkgs',
        currentValue: 'nixpkgs-unstable',
        skipReason: 'unsupported-version',
      },
    ]);
    expect(execSnapshots).toMatchObject([
      {
        cmd,
      },
    ]);
  });

  it('is case insensitive', async () => {
    const execSnapshots = mockExecSequence([
      { stdout: 'github:NixOS/nixpkgs/nixpkgs-unstable', stderr: '' },
    ]);

    const res = await extractPackageFile('', 'flake.nix');

    expect(res?.deps).toHaveLength(1);
    expect(res?.deps).toEqual([
      {
        depName: 'nixpkgs',
        currentValue: 'nixpkgs-unstable',
        skipReason: 'unsupported-version',
      },
    ]);
    expect(execSnapshots).toMatchObject([
      {
        cmd,
      },
    ]);
  });

  it('handles error', async () => {
    const execSnapshots = mockExecSequence([new Error()]);

    const res = await extractPackageFile('', 'flake.nix');

    expect(res).toBeNull();
    expect(execSnapshots).toMatchObject([
      {
        cmd,
      },
    ]);
  });

  it('handles stderr', async () => {
    const execSnapshots = mockExecSequence([{ stdout: '', stderr: 'error' }]);

    const res = await extractPackageFile('', 'flake.nix');

    expect(res).toBeNull();
    expect(execSnapshots).toMatchObject([
      {
        cmd,
      },
    ]);
  });
});
