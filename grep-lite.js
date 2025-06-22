#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const chalk = require('chalk');

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
    const argv = yargs(hideBin(process.argv))
        .usage('Usage: $0 --file=<path> --search=<string> [options]')
        .option('file', {
            alias: 'f',
            type: 'array',
            description: 'Path to the file(s) to search',
            demandOption: true
        })
        .option('search', {
            alias: 's',
            type: 'string',
            description: 'Substring to search for',
            demandOption: true
        })
        .option('ignore-case', {
            alias: 'i',
            type: 'boolean',
            description: 'Ignore case',
            default: false
        })
        .help()
        .alias('help', 'h')
        .fail((msg, err) => {
            if (err) throw err;
            console.error(chalk.red('Error: Both --file and --search are required'));
            console.error('Usage: node grep-lite.js --file=<path> --search=<string>');
            process.exit(1);
        })
        .parse();

    const files = argv.file;
    const searchString = argv.search;
    const ignoreCase = argv.ignoreCase;

    const escapedSearch = escapeRegExp(searchString);
    const regexFlags = ignoreCase ? 'gi' : 'g';
    const testRegex = new RegExp(escapedSearch, ignoreCase ? 'i' : '');
    const highlightRegex = new RegExp(escapedSearch, regexFlags);

    for (const file of files) {
        try {
            const content = await fs.readFile(file, 'utf8');
            const lines = content.split('\n');
            const fileName = files.length > 1 ? `File: ${file}, ` : '';

            for (let i = 0; i < lines.length; i++) {
                testRegex.lastIndex = 0;
                if (testRegex.test(lines[i])) {
                    const highlighted = lines[i].replace(
                        highlightRegex,
                        match => chalk.bgYellow(match)
                    );
                    console.log(`[${fileName}Line ${i + 1}]: ${highlighted}`);
                }
            }
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.error(chalk.red(`Error: File not found: ${file}`));
                process.exit(1);
            }
            throw err;
        }
    }
}

main().catch(err => {
    console.error(chalk.red('Unexpected error:', err));
    process.exit(1);
});