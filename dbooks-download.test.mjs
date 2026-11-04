import test from 'node:test';import assert from 'node:assert/strict';import {fetchDbooksFile} from './server/dbooks-download.mjs';
test('DBooks normalizes uppercase ISBN suffix before metadata lookup',async()=>{let called='';await fetchDbooksFile('099977302X',{},async u=>{called=u;return new Response('',{status:404})});assert.equal(called,'https://www.dbooks.org/api/book/099977302x');});
