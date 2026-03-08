const fs = require('fs');
const zlib = require('zlib');

const INPUT = 'Surya Siddhanta, Chapter I, with Commentary and Calculations.pdf';
const OUTPUT = 'server/pdf_extracted_surya_ch1.txt';

function decodePdfString(str) {
  return str
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, '\t')
    .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\\\/g, '\\');
}

const data = fs.readFileSync(INPUT);
const latin = data.toString('latin1');
const streamRegex = /<<(.*?)>>\s*stream\r?\n/gms;
const texts = [];
let match;

while ((match = streamRegex.exec(latin)) !== null) {
  const dict = match[1];
  const start = match.index + match[0].length;
  const end = latin.indexOf('endstream', start);
  if (end === -1) continue;

  const bufStart = Buffer.byteLength(latin.slice(0, start), 'latin1');
  const bufEnd = Buffer.byteLength(latin.slice(0, end), 'latin1');
  const chunk = data.subarray(bufStart, bufEnd);

  let decoded;
  try {
    decoded = /FlateDecode/.test(dict)
      ? zlib.inflateSync(chunk).toString('latin1')
      : chunk.toString('latin1');
  } catch {
    continue;
  }

  const parts = [];
  const stringRegex = /\(([^()]*(?:\\.[^()]*)*)\)/gms;
  let stringMatch;
  while ((stringMatch = stringRegex.exec(decoded)) !== null) {
    parts.push(decodePdfString(stringMatch[1]));
  }

  if (parts.length) {
    texts.push(parts.join(''));
  }
}

const output = texts.join('\n\n---PAGE---\n\n');
fs.writeFileSync(OUTPUT, output, 'utf8');
console.log('Wrote ' + OUTPUT);
