# roxify-tsvm

`roxify` command for [`typescript-virtual-container`](https://www.npmjs.com/package/typescript-virtual-container) virtual shells. Encodes and decodes files as PNG steganography archives using the [`roxify`](https://www.npmjs.com/package/roxify) library.

## Installation

```ts
import { roxifyCommand } from "roxify-tsvm";
import { VirtualShell } from "typescript-virtual-container";

const shell = new VirtualShell({ /* ... */ });
shell.registerModule(roxifyCommand);
```

## Usage

```
roxify <command> <file>
```

### Commands

| Command | Description |
|---|---|
| `encode <file>` | Encode a file into a PNG archive |
| `decode <file.png>` | Decode a PNG archive back to the original file |
| `list <file.png>` | List files stored in a PNG archive |
| `havepassphrase <file.png>` | Check whether the archive requires a passphrase |

### Examples

```sh
# Encode a file
roxify encode secret.pdf
# → secret.pdf.png written to the VFS

# Decode it back
roxify decode secret.pdf.png
# → secret.pdf restored (filename preserved from archive metadata)

# List contents
roxify list archive.png
# → Files in archive.png:
#    - secret.pdf (42318 bytes)

# Check passphrase
roxify havepassphrase archive.png
# → archive.png does not require a passphrase
```

## How it works

- `encode` reads the file from the VFS as a raw binary buffer, encodes it with `roxify` (zstd-compressed PNG steganography), and writes the `.png` back to the VFS.
- `decode` reads the PNG from the VFS, decodes it, and restores the original file using the filename stored in the archive metadata.
- `list` and `havepassphrase` are read-only inspection commands.

All file I/O goes through the virtual filesystem - no real disk access.

## Dependencies

- [`roxify`](https://www.npmjs.com/package/roxify) - PNG steganography engine
- [`typescript-virtual-container`](https://www.npmjs.com/package/typescript-virtual-container) - virtual shell and VFS runtime
