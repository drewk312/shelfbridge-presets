import test from 'node:test';
import assert from 'node:assert/strict';
const {validateProbe}=await import('./health.mjs').catch(()=>({}));
const fixture={results:[{source:'standardebooks',language:'en-GB',downloadService:'direct',fileType:'epub',ebookUrl:'https://standardebooks.org/ebooks/author/title/downloads/title.epub'}]};
test('health accepts a direct English result from the intended source',()=>{assert.equal(typeof validateProbe,'function');assert.equal(validateProbe(fixture,'standardebooks'),1);});
for(const [name,data,source] of [
 ['empty results',{results:[]},'standardebooks'],
 ['foreign language',{results:[{...fixture.results[0],language:'fr'}]},'standardebooks'],
 ['unknown language',{results:[{...fixture.results[0],language:null}]},'standardebooks'],
 ['wrong provider',fixture,'gutenberg'],
 ['wrong resolver',{results:[{...fixture.results[0],downloadService:'torbox'}]},'standardebooks'],
 ['lookalike host',{results:[{...fixture.results[0],ebookUrl:'https://standardebooks.org.evil.test/a.epub'}]},'standardebooks'],
 ['missing file',{results:[{...fixture.results[0],ebookUrl:null}]},'standardebooks']]){
 test('health rejects '+name,()=>{assert.equal(typeof validateProbe,'function');assert.throws(()=>validateProbe(data,source));});
}
test('LibriVox health accepts archive bundles without pretending they are audio streams',()=>{
 assert.equal(typeof validateProbe,'function');assert.equal(validateProbe({results:[{source:'librivox',language:'English',downloadService:'direct',fileType:'zip',url:'https://archive.org/compress/test/file.zip'}]},'librivox'),1);
});
test('health rejects catalog pages masquerading as files',()=>{
 assert.throws(()=>validateProbe({results:[{...fixture.results[0],ebookUrl:'https://standardebooks.org/'}]},'standardebooks'));
 assert.throws(()=>validateProbe({results:[{source:'librivox',language:'English',downloadService:'direct',fileType:'zip',url:'https://archive.org/details/title'}]},'librivox'));
});
test('health rejects contradictory ebook media metadata',()=>{
 assert.throws(()=>validateProbe({results:[{...fixture.results[0],fileType:'mp3'}]},'standardebooks'));
});
