import * as fs from "node:fs";
import { decodePngToBinary, encodeBinaryToPng, listFilesInPng } from "roxify";
import type { VirtualShell } from "typescript-virtual-container";

export function attachRoxifyToShell(shell: VirtualShell) {
	shell.addCommand("roxify", [], async ({ args, cwd }) => {
		const help = `
ROX CLI — Encode/decode binary in PNG or WAV

Usage:
    npx rox <command> [options]

Commands:
    encode <input>... [output]   Encode one or more files/directories
    decode <input> [output]      Decode PNG/WAV to original file
    list <input>                 List files in a Rox archive
    havepassphrase <input>       Check whether the archive requires a passphrase

Options:
    --image                   Use PNG container (default)
    --sound                   Use WAV audio container (smaller overhead, faster)
    --bwt-ans                 Use BWT-ANS compression instead of Zstd
    -p, --passphrase <pass>   Use passphrase (AES-256-GCM)
    -m, --mode <mode>         Mode: screenshot (default)
    -e, --encrypt <type>      auto|aes|xor|none
    --no-compress             Disable compression
    --dict <file>             Use zstd dictionary when compressing
    --ram-budget-mb <mb>      Max RAM budget used by native encode/decode paths
    --force-ts                Force TypeScript encoder (slower but supports encryption)
    -o, --output <path>       Output file path
    -s, --sizes               Show file sizes in 'list' output (default)
    --no-sizes                Disable file size reporting in 'list'
    --files <list>            Extract only specified files (comma-separated)
    --view-reconst            Export the reconstituted PNG for debugging
    --debug                   Export debug images (doubled.png, reconstructed.png)
    -v, --verbose             Show detailed errors

Lossy-Resilient Encoding:
    --lossy-resilient         Enable lossy-resilient mode (survives JPEG/MP3)
    --ecc-level <level>       ECC redundancy: low|medium|quartile|high (default: medium)
    --block-size <n>          Robust image block size: 2-8 pixels (default: 4)

    When --lossy-resilient is active, data is encoded with Reed-Solomon ECC
    and rendered as a QR-code-style grid (image) or MFSK tones (audio).
    Use --sound or --image to choose the container format.

Examples:
    npx rox encode secret.pdf                      Encode to PNG
    npx rox encode secret.pdf --sound               Encode to WAV
    npx rox encode secret.pdf --lossy-resilient     Lossy-resilient PNG
    npx rox encode secret.pdf --lossy-resilient --sound --ecc-level high
    npx rox decode secret.pdf.png                   Decode back
    npx rox decode secret.pdf.wav                   Decode WAV back

Run "npx rox help" for this message.
        `.trim();

		// args[0] will be the subcommand (encode, decode, list, havepassphrase)
		// args[1] and onwards will be the options/arguments for that subcommand
		// args[2] can be a flag like --sound or --lossy-resilient
		if (args[1]) {
			const file = args[1];
			const path = cwd === "/" ? file : `${cwd}/${file}`;
			const buffer = Buffer.from(shell.vfs.readFile(path));
			// console.log(buffer)
			switch (args[0]) {
				case "encode": {
					if (!file) {
						return {
							exitCode: 1,
							stdout:
								"Error: No input file specified. Usage: roxify encode <input>... [output]",
						};
					}
					const encodedBuffer = await encodeBinaryToPng(buffer);
					const finalfilePath = `${cwd}/${file}.png`;
					// console.log(finalfilePath)
					shell.vfs.writeFile(finalfilePath, encodedBuffer);
					return {
						exitCode: 0,
						stdout: `Encoded ${file}...`,
					};
				}
				case "decode": {
					if (!file) {
						return {
							exitCode: 1,
							stdout:
								"Error: No input file specified. Usage: roxify decode <input> [output]",
						};
					}
					const decodedBuffer = await decodePngToBinary(buffer);
					shell.vfs.writeFile(`${file.split(".png")[0]}`, decodedBuffer.buf!);
					return {
						exitCode: 0,
						stdout: `Decoded ${file}...`,
					};
				}
				case "list": {
					if (!file) {
						return {
							exitCode: 1,
							stdout:
								"Error: No input file specified. Usage: roxify list <input>",
						};
					}
					const buffer = fs.readFileSync(file!);
					const list = await listFilesInPng(buffer)!;
					const output = [`Files in ${file}:`];
					(list as string[]).forEach((file) => {
						output.push(`- ${file}`);
					});
					return {
						exitCode: 0,
						stdout: output.join("\n"),
					};
				}
				case "havepassphrase":
					return {
						exitCode: 0,
						stdout: `Checking if ${file} requires a passphrase... (not really, this is just a demo command)`,
					};
			}
		}

		return {
			exitCode: 0,
			stdout: help,
		};
	});
}
