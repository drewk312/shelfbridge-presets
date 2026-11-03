import test from 'node:test';
import assert from 'node:assert/strict';
import {validateProbe} from './health.mjs';
test('Z-Library accepts a PDF in a search without a format restriction',()=>{
 assert.equal(validateProbe({results:[{source:'zlib',language:'en',downloadService:'direct',fileType:'pdf',ebookUrl:'https://search.inkecho.duckdns.org/dl/md5/be43e22ff8d0af4edb9fe4793f405430.pdf'}]},'zlib'),1);
});
