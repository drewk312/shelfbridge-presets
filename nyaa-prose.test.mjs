import test from 'node:test';
import assert from 'node:assert/strict';
import {isProseExcludedComic} from './server/comics-filter.mjs';
test('Nyaa EPUB prose survives while manga and untyped Nyaa remain excluded',()=>{
 assert.equal(isProseExcludedComic({source:'nyaa',title:'Light Novel',fileType:'epub'}),false);
 for(const row of [{title:'Manga',fileType:'epub'},{title:'Novel',fileType:'cbz'},{title:'Unspecified'}])assert.equal(isProseExcludedComic({source:'nyaa',...row}),true);
});
