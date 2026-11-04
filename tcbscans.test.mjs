import test from 'node:test';import assert from 'node:assert/strict';import {links,imageUrls,downloadTcb} from './server/tcbscans.mjs';
test('TCB parser keeps reader images and excludes external chapter links',()=>{assert.deepEqual(links('<a href="/chapters/1/test">Chapter 1</a><a href="https://evil/chapters/2/x">bad</a>','chapters'),[{path:'/chapters/1/test',title:'Chapter 1'}]);assert.deepEqual(imageUrls('<img src="ad"><picture><img src="page"></picture>'),['page']);});
test('TCB rejects traversal before fetching',async()=>assert.rejects(downloadTcb('../secret'),/Invalid chapter/));
