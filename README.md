# farp: Find All References Patch

As of 02-03-2021, Visual Studio Code's Find All References feature [doesn't work between apps and libs](https://github.com/nrwl/nx/issues/3106) in [Nrwl Nx](https://github.com/nrwl/nx) workspaces. This Node CLI utility temporarily and non-destructively applies the workaround from that GitHub issue to your Nx workspace.

## Usage

Run `farp` in a Nrwl Nx workspace to apply the patch.

Run `unfarp` to remove the patch by restoring the original tsconfig files.

Unfortunately, your code will not compile while the workaround is in place.

Unit tests do seem to work, though.
